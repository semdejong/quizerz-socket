export default class PlayersManager {
  static players = [];

  constructor() {
    this.players = [];
  }

  static addPlayer(player) {
    this.players.push(player);
  }

  static removePlayer(player) {
    this.players = this.players.filter((p) => p.getUuid() !== player.getUuid());
  }

  static getPlayerByUuid(uuid) {
    return this.players.find((p) => p.getUuid() === uuid);
  }

  static getPlayerByClientSecret(clientSecret) {
    return this.players.find((p) => p.getClientSecret() === clientSecret);
  }

  static getPlayerBySocketId(socketId) {
    return this.players.find((p) => p.getSocketId() === socketId);
  }

  static getPlayers() {
    return this.players;
  }
}
