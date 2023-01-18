class RoomGame extends Game {
  #rounds;

  constructor(id, pin, name, creator, players) {
    super(id, pin, name, creator, players);
    this.#rounds = [];
  }
}
