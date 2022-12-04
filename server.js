import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let players = [];
let games = [];

try {
  io.on("connection", (socket) => {
    socket.on("join-game", (userName, pin) => {
      console.log("join-game", pin, userName);
      const game = games.find((game) => game.pin === pin);
      if (!game) {
        socket.emit("response-join-game", false, "Game not found");
        return;
      }

      if (
        game?.players?.find?.((player) => player?.name === userName) ||
        game?.inactivePlayers?.find?.((player) => player?.name === userName)
      ) {
        socket.emit("response-join-game", false, "Username already taken");
        return;
      }

      const clientSecret = uuidv4();

      const player = {
        id: socket.id,
        name: userName,
        uuid: uuidv4(),
        joinedGame: game.id,
        pin: pin,
        clientSecret,
      };

      players.push(player);

      games
        .find((game) => game.id === player.joinedGame)
        .players.push({ ...player, clientSecret: undefined });

      socket.join(game.id);

      const hostSocket = io.sockets.sockets.get(game.host.id);

      if (hostSocket) {
        hostSocket.emit("player-joined", game.players, game.inactivePlayers);
      }
      socket.emit("response-join-game", true, player, {
        ...game?.questions?.[game.currentQuestion],
        correctAnswer: undefined,
      });
    });

    socket.on("check-pin-exists", (pin) => {
      const game = games.find((game) => game.pin === pin);
      if (game) {
        socket.emit("reponse-check-pin-exists", pin);
      } else {
        socket.emit("reponse-check-pin-exists", false);
      }
    });

    socket.on("create-game", async (gameId, clientSecret = "") => {
      let game = {};
      const gameExists = games.find((game) => game.id === gameId);
      if (gameExists) {
        if (gameExists.host.secret === clientSecret) {
          socket.emit("game-exists", { ...gameExists, host: false });
        } else {
          console.log("game exists");
          socket.emit("game-exists", false);
        }
      } else {
        const gameData = await getGameData(gameId);

        if (gameData.result.status !== 200) {
          socket.emit("game-exists", false);
          return;
        }

        const clientSecret = uuidv4();
        const pin = makeid(6).toUpperCase();
        game = {
          id: gameId,
          host: { id: socket.id, secret: clientSecret },
          pin: pin,
          players: [],
          inactivePlayers: [],
          currentPage: "lobby",
          gameData: { ...gameData.data, questions: undefined },
          questions: gameData.data.questions.map((question) => ({
            ...question,
            answers: [],
          })),
          currentQuestion: -1,
        };
        games.push(game);
        socket.emit("game-created", game, clientSecret);
        socket.join(gameId);
      }
    });

    socket.on("set-host", (gameId, clientSecret) => {
      console.log("SETHOST");
      const game = games.find((game) => game.id === gameId);
      if (game?.host?.secret === clientSecret) {
        game.host.id = socket.id;
        socket.emit("host-set", game);
      } else {
        socket.emit("host-set", false);
      }
    });

    socket.on("rejoin-game", (clientSecret) => {
      const player = players.find(
        (player) => player.clientSecret === clientSecret
      );
      if (player) {
        player.id = socket.id;
        socket.join(player.joinedGame);
        const game = games.find((game) => game.id === player.joinedGame);
        game.inactivePlayers = game.inactivePlayers.filter(
          (inactivePlayer) => inactivePlayer.id !== player.id
        );
        if (!game.players.find((player) => player.id === socket.id)) {
          game.players.push(player);
        }
        const hostSocket = io.sockets.sockets.get(game.host.id);
        if (hostSocket) {
          hostSocket.emit("player-joined", game.players, game.inactivePlayers);
        }
        socket.emit("response-rejoin-game", player, game.currentPage, {
          ...game?.questions?.[game.currentQuestion],
          correctAnswer: undefined,
        });
      } else {
        socket.emit("response-rejoin-game", false);
      }
    });

    socket.on("next-question", (gameId) => {
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        game.currentQuestion = game?.currentQuestion + 1;
        game.currentPage = "question";

        socket.to(gameId).emit("next-question", {
          ...game?.questions?.[game.currentQuestion],
          correctAnswer: undefined,
        });
      }
    });

    socket.on("answer-question", (answer) => {
      if (answer === undefined) return;

      const player = players.find((player) => player.id === socket.id);

      if (!player) {
        return;
      }

      const game = games.find((game) => game.id === player.joinedGame);
      if (game) {
        const question = game.questions[game.currentQuestion];

        if (question?.closed) return;

        if (question.answers.find((answer) => answer.playerId === player.uuid))
          return;
        question.answers = [
          ...question.answers,
          { answer, playerId: player.uuid },
        ];

        const hostSocket = io.sockets.sockets.get(game.host.id);
        if (hostSocket) {
          hostSocket.emit("response-answer-question", question.answers);
        }
      }
    });

    socket.on("correct-answers", (gameId, openTextCorrectAnswers, callback) => {
      console.log("correct-answers");
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        const question = game.questions[game.currentQuestion];

        //check if openTextCorrectAnswers is supplied and if so, check open text question
        if (question.answerType === "OPEN_TEXT") {
          if (!openTextCorrectAnswers) return;

          openTextCorrectAnswers.forEach((openTextCorrectAnswer) => {
            question.answers.forEach((answer) => {
              if (answer.playerId === openTextCorrectAnswer.playerId) {
                answer.correct = true;
              }
            });
          });

          console.log(openTextCorrectAnswers);
        } else if (question.answerType === "ESTIMATE") {
          let leastClosesAnswer = null;
          question.answers.forEach((answer) => {
            if (!leastClosesAnswer) {
              leastClosesAnswer = answer;
            } else {
              if (
                Math.abs(answer.answer - question.correctAnswer) >
                Math.abs(leastClosesAnswer.answer - question.correctAnswer)
              ) {
                leastClosesAnswer = answer;
              }
            }
          });

          question.answers.forEach((answer) => {
            if (answer.answer !== leastClosesAnswer.answer) {
              answer.correct = true;
            }
          });

          if (question.answers.length === 1) {
            question.answers[0].correct = true;
          }
        } else {
          question.answers.forEach((answer) => {
            if (parseInt(answer.answer) === parseInt(question.correctAnswer)) {
              answer.correct = true;
            }
          });
        }

        //compare answers from question to correct answers and return answers with correct property

        callback(false, question.answers);
      } else {
        callback(true);
      }
    });

    socket.on("next-page", (gameId, page) => {
      console.log("next-page");
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        game.currentPage = page;

        if (page !== "question") {
          game.questions[game.currentQuestion].closed = true;
        }

        socket.to(gameId).emit("next-page", page);
      }
    });

    socket.on("stop-quiz", (gameId) => {
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }
        socket.to(gameId).emit("stop-quiz");

        //remove game and players
        games.filter((game) => game.id !== gameId);
        players.filter((player) => player.joinedGame !== gameId);
      }
    });

    socket.on("disconnect", () => {
      const player = players.find((player) => player.id === socket.id);
      if (player) {
        const game = games.find((game) => game.id === player.joinedGame);
        if (game) {
          game.players = game.players.filter(
            (player) => player.id !== socket.id
          );
          game.inactivePlayers = [...game.inactivePlayers, player];
          const hostSocket = io.sockets.sockets.get(game.host.id);
          if (hostSocket) {
            hostSocket.emit("player-left", game.players, game.inactivePlayers);
          }
        }
      }
      console.log("user disconnected");
    });
  });
} catch (e) {
  console.log(e);
}

server.listen(process.env.PORT, () => {
  console.log("listening on *:" + process.env.PORT);
});

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function getGameData(gameId) {
  const gameData = await fetch(
    `http://localhost:3000/api/game/getGame?gameId=${gameId}&socketSecret=${process.env.SOCKET_SECRET}`
  );
  return { result: gameData, data: await gameData.json() };
}
