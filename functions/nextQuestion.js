import GameManager from "../classes/GameManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function nextQuestion(socket, gameId) {
  const game = GameManager.getGameById(gameId);
  if (game) {
    if (!isHost(socket, game)) {
      return;
    }
    game.nextQuestion();

    game.setCurrentPage("question");

    const questionObject = {
      ...game.getCurrentQuestionAsQuestion(),
      correctAnswer: undefined,
      answers: [],
    };

    questionObject.topics = questionObject?.topics?.map?.((topic) => {
      let replacedTopic = "";

      for (let i = 0; i < topic.length; i++) {
        if (topic[i] === " ") {
          replacedTopic += " ";
          continue;
        }
        replacedTopic += "o";
      }

      return replacedTopic;
    });

    console.log("next-question", questionObject);

    socket.to(gameId).emit("next-question", questionObject);
  }
}
