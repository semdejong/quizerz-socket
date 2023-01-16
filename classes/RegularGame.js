import Game from "./Game.js";

export default class RegularGame extends Game {
  #currentQuestion;

  constructor(id, host, pin, currentPage, gameData, questions) {
    super(id, host, pin, currentPage, gameData, questions);
    this.#currentQuestion = -1;
  }

  getCurrentQuestion() {
    return this.#currentQuestion;
  }

  getCurrentQuestionAsQuestion() {
    return this.getQuestions()[this.#currentQuestion];
  }

  setCurrentQuestion(question) {
    this.#currentQuestion = question;
  }

  nextQuestion() {
    this.#currentQuestion += 1;
  }

  toObject() {
    return {
      id: this.getId(),
      host: this.getHost(),
      pin: this.getPin(),
      players: this.getPlayers().map((player) => player.toObject()),
      InActivePlayers: this.getInActivePlayers().map((player) =>
        player.toObject()
      ),
      currentPage: this.getCurrentPage(),
      gameData: this.getGameData(),
      questions: this.getQuestions(),
      currentQuestion: this.#currentQuestion,
    };
  }
}
