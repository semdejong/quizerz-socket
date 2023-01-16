import GameManager from "../classes/GameManager.js";
import PlayersManager from "../classes/PlayersManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function changePlayerName(socket, gameId, playerId, name) {
  const game = GameManager.getGameById(gameId);

  if (!game) return;
  if (!isHost(socket, game)) return;

  const player = PlayersManager.getPlayerByUuid(playerId);

  console.log(playerId, player);

  if (!player) return;

  console.log("platt");

  if (
    game.getPlayers().find((p) => p.getName() === name) &&
    game
      .getPlayers()
      .find((p) => p.getName() === name)
      .getUuid() !== playerId
  ) {
    socket.emit(
      "player-changed",
      game.getPlayersAsObject(),
      true,
      "Player name already exists"
    );
    return;
  }

  player.setName(name);
  socket.emit("player-changed", game.getPlayersAsObject(), false, "");
}
