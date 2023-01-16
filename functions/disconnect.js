import PlayersManager from "../classes/PlayersManager.js";

export default function disconnect(io, socket) {
  const player = PlayersManager.getPlayerBySocketId(socket.id);
  if (player) {
    const game = player.getJoindedGame();
    if (game) {
      game.addInActivePlayer(player);
      game.removePlayer(player);

      const hostSocket = io.sockets.sockets.get(game.getHost().getSocketId());
      if (hostSocket) {
        hostSocket.emit(
          "player-left",
          game.getPlayersAsObject(),
          game.getInActivePlayersAsObject()
        );
      }
    }
  }
  console.log("disconnect", socket.id);
}
