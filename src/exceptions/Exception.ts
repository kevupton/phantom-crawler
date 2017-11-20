export class Exception {
  name : string;
  stack : string;

  constructor (
    public message,
    public code = 500
  ) {
    this.name = this.constructor.name;
    this.stack = (new Error()).stack;
  }

  getReason () {
    return `Uncaught '${this.name}': ${this.message}`;
  }
}
