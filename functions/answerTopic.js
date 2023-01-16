import PlayersManager from "../classes/PlayersManager.js";

export default function answerTopic(io, socket, answer, cb) {
  if (answer === undefined) return;

  const player = PlayersManager.getPlayerBySocketId(socket.id);

  if (!player) return;

  const game = player.getJoindedGame();

  if (!game) return;

  const question = game.getCurrentQuestionAsQuestion();

  if (question?.closed) return;

  if (question?.answerType !== "TOPICS") return;

  const topics = question?.topics;

  const correctTopic = topics?.find((topic) => {
    const lowercasedTopic = topic.toLowerCase().trim().replaceAll(" ", "");
    const lowercasedAnswer = answer.toLowerCase().trim().replaceAll(" ", "");
    if (lowercasedTopic === answer?.toLowerCase().trim().replaceAll(" ", ""))
      return true;

    if (lowercasedTopic.length > 4 && lowercasedAnswer.length > 4) {
      if (
        lowercasedTopic?.includes(lowercasedAnswer) ||
        lowercasedAnswer?.includes(lowercasedTopic)
      )
        return true;
    }

    return false;
  });

  if (!correctTopic) {
    cb(false);
    return;
  }

  const playersCurrentAnswer = question?.answers?.find(
    (answer) => answer?.playerId === player.getUuid()
  );

  if (playersCurrentAnswer) {
    let newAnswers = question?.answers?.map((answerInA) => {
      if (answerInA?.playerId === player?.getUuid()) {
        if (answerInA?.answer?.includes(correctTopic)) return answerInA;
        return {
          answer: [...answerInA?.answer, correctTopic],
          playerId: player?.getUuid(),
          answered: answerInA?.answered,
        };
      }
      return answer;
    });
    question.answers = newAnswers;
  } else {
    question.answers = [
      ...question?.answers,
      {
        answer: [correctTopic],
        playerId: player.getUuid(),
        answered: question?.answers?.length + 1,
      },
    ];
  }

  const hostSocket = io.sockets.sockets.get(game.getHost().getSocketId());

  if (hostSocket) {
    hostSocket.emit("response-answer-question", question.answers);
  }

  cb(true, correctTopic);
}
