import GameManager from "../classes/GameManager.js";
import PlayersManager from "../classes/PlayersManager.js";
import { isHost } from "./utils/gameUtils.js";

export default function correctAnswers(
  socket,
  gameId,
  openTextCorrectAnswers,
  callback
) {
  const game = GameManager.getGameById(gameId);

  console.log(gameId, game, "yeahh");

  if (!game) {
    callback(true);
    return;
  }

  if (!isHost(socket, game)) return;

  const question = game.getCurrentQuestionAsQuestion();

  if (question.answerType === "OPEN_TEXT") {
    if (!openTextCorrectAnswers) return;

    openTextCorrectAnswers.forEach((answer) => {
      question.answers.forEach((questionAnswer) => {
        if (questionAnswer.playerId === answer.playerId) {
          questionAnswer.correct = true;
        }
      });
    });
  } else if (question.answerType === "ESTIMATE") {
    let leastClosesAnswer = null;
    question.answers.forEach((answer) => {
      if (!leastClosesAnswer) {
        leastClosesAnswer = answer;
      } else {
        if (
          Math.abs(answer.answer - question.correctAnswer) >
          Math.abs(leastClosesAnswer.answer - question.correctAnswer)
        ) {
          leastClosesAnswer = answer;
        }
      }
    });

    question.answers.forEach((answer) => {
      if (answer.answer !== leastClosesAnswer.answer) {
        answer.correct = true;
      }

      if (parseInt(answer.answer) === parseInt(question.correctAnswer)) {
        answer.correct = true;
      }
    });

    if (question.answers.length === 1) {
      question.answers[0].correct = true;
    }
  } else if (question.answerType === "TOPICS") {
    let averageChars = 0;

    question?.answers?.forEach?.((answer) => {
      let chars = 0;
      answer?.answer?.forEach?.((topic) => {
        chars += topic.length;
      });
      averageChars += chars;
    });

    averageChars = averageChars / question?.answers?.length;

    question?.answers?.forEach?.((answer) => {
      let chars = 0;
      answer?.answer?.forEach?.((topic) => {
        chars += topic.length;
      });
      if (chars >= averageChars) {
        answer.correct = true;
      }
    });
  } else {
    question.answers.forEach((answer) => {
      if (parseInt(answer.answer) === parseInt(question.correctAnswer)) {
        answer.correct = true;
      }
    });
  }

  for (const answer of question.answers) {
    if (answer.correct && answer.scored !== true) {
      const player = PlayersManager.getPlayerByUuid(answer.playerId);

      if (player) {
        if (answer.answered > 5) {
          player.addScore(100);
        } else {
          let score = 100 + (6 - answer.answered) * 20;
          if (score < 100) {
            score = 100;
          }

          player.addScore(score);
        }

        answer.scored = true;
      }
    }
  }

  callback(false, question.answers, game.getPlayersAsObject());
}
