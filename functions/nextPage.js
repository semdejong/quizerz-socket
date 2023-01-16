import GameManager from "../classes/GameManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function nextPage(socket, gameId, page) {
  const game = GameManager.getGameById(gameId);
  if (game) {
    if (!isHost(socket, game)) {
      return;
    }

    game.setCurrentPage(page);

    if (page !== "question") {
      game.getCurrentQuestionAsQuestion().closed = true;
    }

    socket.to(gameId).emit("next-page", page);
  }
}
