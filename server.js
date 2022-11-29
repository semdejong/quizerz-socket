const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const { v4: uuidv4 } = require("uuid");

let players = [];
let games = [];

io.on("connection", (socket) => {
  socket.on("join-game", (userName, pin) => {
    console.log("join-game", pin, userName);
    const game = games.find((game) => game.pin === pin);
    if (!game) {
      socket.emit("response-join-game", false, "Game not found");
      return;
    }

    if (game.players.find((player) => player.name === userName)) {
      socket.emit("response-join-game", false, "Username already taken");
      return;
    }

    const clientSecret = uuidv4();

    const player = {
      id: socket.id,
      name: userName,
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

    hostSocket.emit("player-joined", game.players);

    socket.emit("response-join-game", true, player);
  });

  socket.on("check-pin-exists", (pin) => {
    const game = games.find((game) => game.pin === pin);
    if (game) {
      socket.emit("reponse-check-pin-exists", pin);
    } else {
      socket.emit("reponse-check-pin-exists", false);
    }
  });

  socket.on("create-game", (gameId, clientSecret = "") => {
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
      const clientSecret = uuidv4();
      const pin = makeid(6).toUpperCase();
      game = {
        id: gameId,
        host: { id: socket.id, secret: clientSecret },
        pin: pin,
        players: [],
        currentPage: "lobby",
      };
      games.push(game);
      socket.emit("game-created", game, clientSecret);
      socket.join(gameId);
    }
  });

  socket.on("set-host", (gameId, clientSecret) => {
    console.log("SETHOST");
    const game = games.find((game) => game.id === gameId);
    if (game.host.secret === clientSecret) {
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
      game.players.push(player);
      const hostSocket = io.sockets.sockets.get(game.host.id);
      hostSocket.emit("player-joined", game.players);
      socket.emit("response-rejoin-game", player, game.currentPage);
    } else {
      socket.emit("response-rejoin-game", false);
    }
  });

  socket.on("next-question", (questionId, gameId) => {
    const game = games.find((game) => game.id === gameId);
    game.currentPage = "question";
    if (game) {
      socket.to(gameId).emit("next-question", questionId);
    }
  });

  socket.on("disconnect", () => {
    const player = players.find((player) => player.id === socket.id);
    if (player) {
      const game = games.find((game) => game.id === player.joinedGame);
      if (game) {
        game.players = game.players.filter((player) => player.id !== socket.id);
        const hostSocket = io.sockets.sockets.get(game.host.id);
        hostSocket.emit("player-left", game.players);
      }
    }
    console.log("user disconnected");
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
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
