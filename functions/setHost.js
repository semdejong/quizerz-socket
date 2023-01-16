import GameManager from "../classes/GameManager.js";

export default function setHost(socket, gameId, clientSecret) {
  const game = GameManager.getGameById(gameId);

  if (game && game?.getHost()?.getSecret() === clientSecret) {
    game.getHost().setSocketId(socket.id);
    socket.emit("host-set", game.toObject());
  } else {
    socket.emit("host-set", false);
  }
}
