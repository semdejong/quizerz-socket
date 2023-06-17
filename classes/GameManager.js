import Game from "./Game.js";
import Manager from "./Manager.js";

export default class GameManager extends Manager {
  static games = [];

  constructor() {
    this.games = [];
  }

  static getGames() {
    return this.games;
  }

  static setGames(games) {
    this.games = games;
  }

  static addGame(game) {
    if (game instanceof Game) {
      this.games.push(game);
    }
  }

  static removeGame(game) {
    this.games = this.games.filter((g) => g.getId() !== game.getId());
  }

  static getGameById(id) {
    return this.games.find((game) => game.getId() === id);
  }

  static getGameByPin(pin) {
    return this.games.find((game) => game.getPin() === pin);
  }
}
