import GameManager from "../classes/GameManager.js";
import RegularGame from "../classes/RegularGame.js";
import Host from "../classes/Host.js";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

export default async function createGame(socket, gameId, clientSecret = "") {
  const gameExists = GameManager.getGameById(gameId);
  if (gameExists) {
    if (gameExists?.getHost()?.getSecret() === clientSecret) {
      socket.emit("game-exists", { ...gameExists.toObject(), host: false });
    } else {
      socket.emit("game-exists", false);
    }
  } else {
    const gameData = await getGameData(gameId);

    if (gameData?.result?.status !== 200) {
      socket.emit("game-exists", false);
      return;
    }

    const clientSecret = uuidv4();

    const pin = makeid(6).toUpperCase();

    const game = new RegularGame(
      gameId,
      new Host(socket.id, clientSecret),
      pin,
      "lobby",
      { ...gameData?.data, questions: undefined },
      gameData?.data?.questions?.map?.((question) => ({
        ...question,
        answers: [],
      }))
    );

    GameManager.addGame(game);
    socket.emit("game-created", game.toObject(), clientSecret);
    socket.join(game.getId());
  }
}

async function getGameData(gameId) {
  const gameData = await fetch(
    `https://quizerz.com/api/game/getGame?gameId=${gameId}&socketSecret=${process.env.SOCKET_SECRET}`
  );
  return { result: gameData, data: await gameData.json() };
}

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
