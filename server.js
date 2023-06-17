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
      const game = games?.find?.((game) => game.pin === pin);
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
        score: 0,
        clientSecret,
      };

      players?.push?.(player);

      games
        ?.find?.((game) => game?.id === player?.joinedGame)
        .players?.push?.({ ...player, clientSecret: undefined });

      socket.join(game.id);

      const hostSocket = io.sockets.sockets.get(game.host.id);

      if (hostSocket) {
        hostSocket.emit("player-joined", game.players, game.inactivePlayers);
      }
      socket.emit("response-join-game", true, player, {
        ...game?.questions?.[game?.currentQuestion],
        correctAnswer: undefined,
      });
    });

    socket.on("check-pin-exists", (pin) => {
      const game = games?.find?.((game) => game?.pin === pin);
      if (game) {
        socket.emit("reponse-check-pin-exists", pin);
      } else {
        socket.emit("reponse-check-pin-exists", false);
      }
    });

    socket.on("create-game", async (gameId, clientSecret = "") => {
      let game = {};
      const gameExists = games?.find((game) => game?.id === gameId);
      if (gameExists) {
        if (gameExists?.host?.secret === clientSecret) {
          socket.emit("game-exists", { ...gameExists, host: false });
        } else {
          console.log("game exists");
          socket.emit("game-exists", false);
        }
      } else {
        const gameData = await getGameData(gameId);

        if (gameData?.result?.status !== 200) {
          socket.emit("game-exists", false);
          return;
        }

        const clientSecret = uuidv4();
        const pin = makeid(6).toUpperCase();
        game = {
          id: gameId,
          host: { id: socket?.id, secret: clientSecret },
          pin: pin,
          players: [],
          inactivePlayers: [],
          currentPage: "lobby",
          gameData: { ...gameData?.data, questions: undefined },
          questions: gameData?.data?.questions?.map?.((question) => ({
            ...question,
            answers: [],
          })),
          currentQuestion: -1,
        };
        games?.push?.(game);
        socket.emit("game-created", game, clientSecret);
        socket.join(gameId);
      }
    });

    socket.on("set-host", (gameId, clientSecret) => {
      console.log("SETHOST");
      const game = games?.find?.((game) => game?.id === gameId);
      if (game?.host?.secret === clientSecret) {
        game.host.id = socket.id;
        socket.emit("host-set", game);
      } else {
        socket.emit("host-set", false);
      }
    });

    socket.on("rejoin-game", (clientSecret) => {
      const player = players?.find?.(
        (player) => player?.clientSecret === clientSecret
      );
      if (player) {
        player.id = socket?.id;
        socket.join(player?.joinedGame);
        const game = games?.find((game) => game?.id === player?.joinedGame);
        game.inactivePlayers = game?.inactivePlayers?.filter(
          (inactivePlayer) => inactivePlayer?.id !== player?.id
        );
        if (!game?.players?.find((player) => player?.id === socket?.id)) {
          game?.players?.push?.(player);
        }
        const hostSocket = io.sockets.sockets.get(game.host.id);
        if (hostSocket) {
          hostSocket.emit(
            "player-joined",
            game?.players,
            game?.inactivePlayers
          );
        }

        const questionObject = {
          ...game?.questions?.[game?.currentQuestion],
          correctAnswer: undefined,
          answers: [],
        };

        questionObject.topics = questionObject?.topics?.map?.((topic) => {
          let replacedTopic = "";

          for (let i = 0; i < topic.length; i++) {
            if (topic[i] === " ") {
              replacedTopic += " ";
              continue;
            }
            replacedTopic += "o";
          }

          const playersAnswer = game?.questions?.[
            game?.currentQuestion
          ]?.answers?.find((answer) => answer?.playerId === player?.uuid);

          if (playersAnswer?.answer?.includes?.(topic)) {
            replacedTopic = topic;
          }

          return replacedTopic;
        });

        socket.emit(
          "response-rejoin-game",
          player,
          game.currentPage,
          questionObject
        );
      } else {
        socket.emit("response-rejoin-game", false);
      }
    });

    socket.on("next-question", (gameId) => {
      const game = games?.find((game) => game?.id === gameId);
      if (game) {
        if (game?.host?.id !== socket?.id) {
          return;
        }

        game.currentQuestion = game?.currentQuestion + 1;
        game.currentPage = "question";

        const questionObject = {
          ...game?.questions?.[game.currentQuestion],
          correctAnswer: undefined,
          answers: [],
        };

        questionObject.topics = questionObject?.topics?.map?.((topic) => {
          let replacedTopic = "";

          for (let i = 0; i < topic.length; i++) {
            if (topic[i] === " ") {
              replacedTopic += " ";
              continue;
            }
            replacedTopic += "o";
          }

          return replacedTopic;
        });

        socket.to(gameId).emit("next-question", questionObject);
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
          {
            answer,
            playerId: player.uuid,
            answered: question.answers.length + 1,
          },
        ];

        const hostSocket = io.sockets.sockets.get(game.host.id);
        if (hostSocket) {
          hostSocket.emit("response-answer-question", question.answers);
        }
      }
    });

    socket.on("answer-topic", (answer, cb) => {
      if (answer === undefined) return;

      const player = players.find((player) => player.id === socket.id);

      if (!player) {
        return;
      }

      const game = games?.find?.((game) => game?.id === player?.joinedGame);
      if (game) {
        const question = game?.questions[game?.currentQuestion];

        if (question?.closed) return;

        if (question?.answerType !== "TOPICS") return;

        const topics = question?.topics;

        const correctTopic = topics?.find((topic) => {
          const lowercasedTopic = topic
            .toLowerCase()
            .trim()
            .replaceAll(" ", "");
          const lowercasedAnswer = answer
            .toLowerCase()
            .trim()
            .replaceAll(" ", "");
          if (
            lowercasedTopic === answer?.toLowerCase().trim().replaceAll(" ", "")
          )
            return true;

          if (lowercasedTopic.length > 4 && lowercasedAnswer.length > 4) {
            if (
              lowercasedTopic?.includes(lowercasedAnswer) ||
              lowercasedAnswer?.includes(lowercasedTopic)
            )
              return true;
          }

          return false;
        });

        if (!correctTopic) {
          cb(false);
          return;
        }

        const playersCurrentAnswer = question?.answers?.find(
          (answer) => answer?.playerId === player?.uuid
        );

        if (playersCurrentAnswer) {
          let newAnswers = question?.answers?.map((answerInA) => {
            if (answerInA?.playerId === player?.uuid) {
              if (answerInA?.answer?.includes(correctTopic)) return answerInA;
              return {
                answer: [...answerInA?.answer, correctTopic],
                playerId: player?.uuid,
                answered: answerInA?.answered,
              };
            }
            return answer;
          });
          question.answers = newAnswers;
        } else {
          question.answers = [
            ...question?.answers,
            {
              answer: [correctTopic],
              playerId: player.uuid,
              answered: question?.answers?.length + 1,
            },
          ];
        }

        const hostSocket = io.sockets.sockets.get(game.host.id);
        if (hostSocket) {
          hostSocket.emit("response-answer-topic", question.answers);
        }

        cb(true, correctTopic);
      }
    });

    socket.on("correct-answers", (gameId, openTextCorrectAnswers, callback) => {
      console.log("correct-answers");
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        const question = game?.questions?.[game?.currentQuestion];

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

            console.log(
              answer.answer,
              question.correctAnswer,
              answer.answer === question.correctAnswer
            );

            if (parseInt(answer.answer) === parseInt(question.correctAnswer)) {
              answer.correct = true;
            }
          });

          if (question.answers.length === 1) {
            question.answers[0].correct = true;
          }
        } else if (question.answerType === "TOPICS") {
          let averageChars = 0;

          question?.answers?.forEach?.((answer) => {
            let chars = 0;
            answer?.answer?.forEach?.((topic) => {
              chars += topic.length;
            });
            averageChars += chars;
          });

          averageChars = averageChars / question?.answers?.length;

          console.log(averageChars);

          question?.answers?.forEach?.((answer) => {
            let chars = 0;
            answer?.answer?.forEach?.((topic) => {
              chars += topic.length;
            });
            console.log(chars, averageChars);
            if (chars >= averageChars) {
              answer.correct = true;
            }
          });
        } else {
          question.answers.forEach((answer) => {
            if (parseInt(answer.answer) === parseInt(question.correctAnswer)) {
              answer.correct = true;
            }
          });
        }

        for (const answer of question.answers) {
          if (answer.correct && answer.scored !== true) {
            const player = game.players.find(
              (player) => player.uuid === answer.playerId
            );

            const playerInPlayers = players.find(
              (player) => player.uuid === answer.playerId
            );

            if (player && playerInPlayers) {
              if (answer.answered > 5) {
                player.score += 100;
                playerInPlayers.score += 100;
              } else {
                let score = 100 + (6 - answer.answered) * 20;
                if (score < 100) {
                  score = 100;
                }
                player.score += score;
                if (player !== playerInPlayers) {
                  playerInPlayers.score += score;
                }
              }
              answer.scored = true;
            }
          }
        }

        //compare answers from question to correct answers and return answers with correct property

        callback(false, question.answers, game.players);
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

    socket.on("change-player-name", (gameId, playerId, name) => {
      console.log("change-player-name");
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        const player = game.players.find((player) => player.id === playerId);
        if (player) {
          if (
            game.players.find((player) => player.name === name) &&
            game.players.find((player) => player.name === name)?.id !== playerId
          ) {
            socket.emit(
              "player-changed",
              game.players,
              true,
              "Player name already exists"
            );
            return;
          }
          player.name = name;
          socket.emit("player-changed", game.players, false, "");
        }
      }
    });

    socket.on("kick-player", (gameId, playerId) => {
      console.log("kick-player");
      const game = games.find((game) => game.id === gameId);
      if (game) {
        if (game?.host?.id !== socket.id) {
          return;
        }

        const player = game.players.find((player) => player.id === playerId);
        const playerInPlayers = players.find(
          (player) => player.id === playerId
        );

        if (player && playerInPlayers) {
          game.players = game.players.filter(
            (player) => player.id !== playerId
          );

          players = players.filter((player) => player.id !== playerId);
          socket.emit("player-changed", game.players, false, "");
        }
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
          game.inActivePlayers = [...game.inactivePlayers, player];
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
    `https://quizerz.com/api/game/getGame?gameId=${gameId}&socketSecret=${process.env.SOCKET_SECRET}`
  );
  return { result: gameData, data: await gameData.json() };
}
