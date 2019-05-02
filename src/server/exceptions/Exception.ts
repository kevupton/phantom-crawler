export class Exception {
  name : string;
  stack : string;

  constructor (
    public message : string,
    public code = 500,
  ) {
    this.name  = this.constructor.name;
    this.stack = (new Error()).stack || 'Unknown Stack';
  }

  getReason () {
    return `Uncaught '${ this.name }': ${ this.message }`;
  }
}
