export default class Manager {
  constructor() {
    this._data = [];
  }
  add(item) {
    this._data.push(item);
  }
  get(index) {
    return this._data[index];
  }
  remove(index) {
    this._data.splice(index, 1);
  }
  get length() {
    return this._data.length;
  }
}
