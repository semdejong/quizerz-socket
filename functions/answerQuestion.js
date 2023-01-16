import PlayersManager from "../classes/PlayersManager.js";

export default function answerQuestion(io, socket, answer) {
  if (answer === undefined) return;

  const player = PlayersManager.getPlayerBySocketId(socket.id);

  if (!player) return;

  const game = player.getJoindedGame();

  if (!game) return;

  const question = game.getCurrentQuestionAsQuestion();

  if (question?.closed) return;

  if (question?.answers?.find((answer) => answer.playerId === player.getUuid()))
    return;

  question.answers.push({
    answer,
    playerId: player.getUuid(),
    answered: question.answers.length + 1,
  });

  const hostSocket = io.sockets.sockets.get(game.getHost().getSocketId());

  if (hostSocket) {
    hostSocket.emit("response-answer-question", question.answers);
  }
}
