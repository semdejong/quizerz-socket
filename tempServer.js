import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import https from "https";
import { Server } from "socket.io";
import fs from "fs";

import joinGame from "./functions/joinGame.js";
import checkPin from "./functions/checkPin.js";
import createGame from "./functions/createGame.js";
import setHost from "./functions/setHost.js";
import rejoinGame from "./functions/rejoinGame.js";
import disconnect from "./functions/disconnect.js";
import nextQuestion from "./functions/nextQuestion.js";
import nextPage from "./functions/nextPage.js";
import answerQuestion from "./functions/answerQuestion.js";
import answerTopic from "./functions/answerTopic.js";
import correctAnswers from "./functions/correctAnswers.js";
import changePlayerName from "./functions/changePlayerName.js";
import kickPlayer from "./functions/kickPlayer.js";
import StopQuiz from "./functions/stopQuiz.js";

const app = express();

var httpsOptions = {
  ca: fs.readFileSync("ca-bundle.crt"),
  key: fs.readFileSync("private.key"),
  cert: fs.readFileSync("socket_quizerz_com.crt"),
};

const server = https.createServer(httpsOptions, app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

try {
  io.on("connection", (socket) => {
    socket.on("join-game", (userName, pin) => {
      joinGame(io, socket, userName, pin);
    });

    socket.on("check-pin-exists", (pin) => {
      checkPin(socket, pin);
    });

    socket.on("create-game", async (gameId, clientSecret = "") => {
      createGame(socket, gameId, clientSecret);
    });

    socket.on("set-host", (gameId, clientSecret) => {
      setHost(socket, gameId, clientSecret);
    });

    socket.on("rejoin-game", (clientSecret) => {
      rejoinGame(io, socket, clientSecret);
    });

    socket.on("next-question", (gameId) => {
      nextQuestion(socket, gameId);
    });

    socket.on("next-page", (gameId, page) => {
      nextPage(socket, gameId, page);
    });

    socket.on("answer-question", (answer) => {
      answerQuestion(io, socket, answer);
    });

    socket.on("answer-topic", (answer, cb) => {
      answerTopic(io, socket, answer, cb);
    });

    socket.on("correct-answers", (gameId, openTextCorrectAnswers, cb) => {
      correctAnswers(socket, gameId, openTextCorrectAnswers, cb);
    });

    socket.on("change-player-name", (gameId, playerId, name) => {
      changePlayerName(socket, gameId, playerId, name);
    });

    socket.on("kick-player", (gameId, playerId) => {
      kickPlayer(socket, gameId, playerId);
    });

    socket.on("stop-quiz", (gameId) => {
      StopQuiz(socket, gameId);
    });

    socket.on("disconnect", () => {
      disconnect(io, socket);
    });
  });
} catch (error) {
  console.log(error);
}

server.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});
