import Game from "../../classes/Game.js";

export function isHost(socket, game) {
  if (game instanceof Game) {
    if (game.getHost().getSocketId() === socket.id) {
      return true;
    }
  }
}
