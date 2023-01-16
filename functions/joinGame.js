import GameManager from "../classes/GameManager.js";
import RegularGame from "../classes/RegularGame.js";
import PlayersManager from "../classes/PlayersManager.js";
import Player from "../classes/Player.js";
import { v4 as uuidv4 } from "uuid";

export default function joinGame(io, socket, userName, pin) {
  const game = GameManager.getGameByPin(pin);
  if (!game) {
    socket.emit("response-join-game", false, "Game not found");
    return;
  }

  if (
    game.getPlayers().find((player) => player.getName() === userName) ||
    game.getInActivePlayers().find((player) => player.getName() === userName)
  ) {
    socket.emit("response-join-game", false, "User name already taken");
    return;
  }

  const clientSecret = uuidv4();

  const player = new Player(
    socket.id,
    userName,
    uuidv4(),
    game.getId(),
    pin,
    clientSecret
  );

  PlayersManager.addPlayer(player);
  game.addPlayer(player);

  socket.join(game.getId());

  const hostSocket = io.sockets.sockets.get(game.getHost().getSocketId());

  if (hostSocket) {
    hostSocket.emit(
      "player-joined",
      game.getPlayersAsObject(),
      game.getInActivePlayersAsObject()
    );
  }

  socket.emit("response-join-game", true, player.toObject(), {
    ...game?.getQuestions()?.[game?.getCurrentQuestion()],
    correctAnswer: undefined,
  });
}
