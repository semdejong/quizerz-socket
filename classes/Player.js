import GameManager from "./GameManager.js";

export default class Player {
  #socketId; //socket id
  #name; //username
  #uuid;
  #joindedGame; //game id
  #pin; //game pin
  #score;
  #clientSecret;

  constructor(socketId, name, uuid, joindedGame, pin, clientSecret) {
    this.#socketId = socketId;
    this.#name = name;
    this.#uuid = uuid;
    this.#joindedGame = joindedGame;
    this.#pin = pin;
    this.#score = 0;
    this.#clientSecret = clientSecret;
  }

  getSocketId() {
    return this.#socketId;
  }

  getName() {
    return this.#name;
  }

  getUuid() {
    return this.#uuid;
  }

  getJoindedGame() {
    return this.#joindedGame;
  }

  getPin() {
    return this.#pin;
  }

  getScore() {
    return this.#score;
  }

  getClientSecret() {
    return this.#clientSecret;
  }

  setSocketId(socketId) {
    this.#socketId = socketId;
  }

  setName(name) {
    this.#name = name;
  }

  setUuid(uuid) {
    this.#uuid = uuid;
  }

  setJoindedGame(joindedGame) {
    this.#joindedGame = joindedGame;
  }

  setPin(pin) {
    this.#pin = pin;
  }

  setScore(score) {
    this.#score = score;
  }

  addScore(score) {
    this.#score += score;
  }

  setClientSecret(clientSecret) {
    this.#clientSecret = clientSecret;
  }

  getJoindedGame() {
    return GameManager.getGameById(this.#joindedGame);
  }

  toObject(blur = false) {
    return {
      socketId: !blur ? this.#socketId : undefined,
      name: this.#name,
      uuid: this.#uuid,
      joindedGame: this.#joindedGame,
      pin: this.#pin,
      score: this.#score,
      clientSecret: !blur ? this.#clientSecret : undefined,
    };
  }

  toString() {
    return JSON.stringify(this);
  }
}
