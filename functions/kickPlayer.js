import GameManager from "../classes/GameManager.js";
import PlayersManager from "../classes/PlayersManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function kickPlayer(socket, gameId, playerId) {
  const game = GameManager.getGameById(gameId);
  if (!game) return;
  if (!isHost(socket, game)) return;
  const player = PlayersManager.getPlayerByUuid(playerId);
  if (!player) return;
  game.removePlayer(player);
  game.removeInActivePlayer(player);
  PlayersManager.removePlayer(player);
  socket.emit("player-changed", game.getPlayersAsObject(), false, "");
}
