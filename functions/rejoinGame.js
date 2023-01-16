import PlayerManager from "../classes/PlayersManager.js";
import GameManager from "../classes/GameManager.js";

export default function rejoinGame(io, socket, clientSecret) {
  const playerFromPlayerManager =
    PlayerManager.getPlayerByClientSecret(clientSecret);

  if (playerFromPlayerManager) {
    playerFromPlayerManager.setSocketId(socket.id);
    socket.join(playerFromPlayerManager.getJoindedGame());
    const game = playerFromPlayerManager.getJoindedGame();
    if (game) {
      game.removeInActivePlayer(playerFromPlayerManager);
      if (
        !game.getPlayers().find((player) => player.getSocketId() === socket.id)
      ) {
        game.addPlayer(playerFromPlayerManager);
      }
      const hostSocket = io.sockets.sockets.get(game.getHost().getSocketId());
      if (hostSocket) {
        hostSocket.emit(
          "player-joined",
          game.getPlayersAsObject(),
          game.getInActivePlayersAsObject()
        );
      }

      const questionObject = {
        ...game?.getQuestions()?.[game?.getCurrentQuestion()],
        correctAnswer: undefined,
        answers: undefined,
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

        const playersAnswer = game
          .getCurrentQuestionAsQuestion()
          ?.answers?.find(
            (answer) => answer?.playerId === playerFromPlayerManager.getUuid()
          );

        if (playersAnswer?.answer?.includes?.(topic)) {
          replacedTopic = topic;
        }

        return replacedTopic;
      });

      socket.emit(
        "response-rejoin-game",
        playerFromPlayerManager.toObject(),
        game.getCurrentPage(),
        questionObject
      );
    } else {
      socket.emit("response-rejoin-game", false);
    }
  } else {
    socket.emit("response-rejoin-game", false);
  }
}
