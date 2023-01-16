import GameManager from "../classes/GameManager.js";

export default function checkPin(socket, pin) {
  const game = GameManager.getGameByPin(pin);
  if (game) {
    socket.emit("response-check-pin-exists", pin);
  } else {
    socket.emit("response-check-pin-exists", false);
  }
}
