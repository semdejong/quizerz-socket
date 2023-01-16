export default class Host {
  #socketId;
  #secret;

  constructor(socketId, secret) {
    this.#socketId = socketId;
    this.#secret = secret;
  }

  getSocketId() {
    return this.#socketId;
  }

  getSecret() {
    return this.#secret;
  }

  setSocketId(socketId) {
    this.#socketId = socketId;
  }

  setSecret(secret) {
    this.#secret = secret;
  }

  toObject() {
    return {
      socketId: this.#socketId,
      secret: this.#secret,
    };
  }
}
