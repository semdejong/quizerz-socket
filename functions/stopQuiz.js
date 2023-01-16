import GameManager from "../classes/GameManager.js";
import PlayersManager from "../classes/PlayersManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function StopQuiz(socket, gameId) {
  const game = GameManager.getGameById(gameId);
  if (!game) return;
  if (!isHost(socket, game)) return;

  game.getPlayers().forEach((player) => {
    PlayersManager.removePlayer(player);
  });
  GameManager.removeGame(game);

  socket.to(gameId).emit("stop-quiz");
}
