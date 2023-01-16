export default class Game {
  #id;
  #host;
  #pin;
  #players;
  #InActivePlayers;
  #currentPage;
  #gameData;
  #questions;

  constructor(id, host, pin, currentPage, gameData, questions) {
    this.#id = id;
    this.#host = host;
    this.#pin = pin;
    this.#players = [];
    this.#InActivePlayers = [];
    this.#currentPage = currentPage;
    this.#gameData = gameData;
    this.#questions = questions;
  }

  getId() {
    return this.#id;
  }

  getHost() {
    return this.#host;
  }

  getPin() {
    return this.#pin;
  }

  getPlayers() {
    return this.#players;
  }

  getPlayerByUuid(uuid) {
    return this.#players.find((player) => player.getUuid() === uuid);
  }

  getPlayersAsObject() {
    const players = [];
    this.#players.forEach((player) => {
      players.push(player.toObject(true));
    });
    return players;
  }

  getInActivePlayers() {
    return this.#InActivePlayers;
  }

  getInActivePlayersAsObject() {
    const players = [];
    this.#InActivePlayers.forEach((player) => {
      players.push(player.toObject(true));
    });
    return players;
  }

  getCurrentPage() {
    return this.#currentPage;
  }

  getGameData() {
    return this.#gameData;
  }

  getQuestions() {
    return this.#questions;
  }

  setId(id) {
    this.#id = id;
  }

  setHost(host) {
    this.#host = host;
  }

  setPin(pin) {
    this.#pin = pin;
  }

  setPlayers(players) {
    this.#players = players;
  }

  setInActivePlayers(InActivePlayers) {
    this.#InActivePlayers = InActivePlayers;
  }

  setCurrentPage(currentPage) {
    this.#currentPage = currentPage;
  }

  setGameData(gameData) {
    this.#gameData = gameData;
  }

  setQuestions(questions) {
    this.#questions = questions;
  }

  addPlayer(player) {
    this.#players.push(player);
  }

  removePlayer(player) {
    this.#players = this.#players.filter((p) => p !== player);
  }

  addInActivePlayer(player) {
    this.#InActivePlayers.push(player);
  }

  removeInActivePlayer(player) {
    this.#InActivePlayers = this.#InActivePlayers.filter((p) => p !== player);
  }
}
