/**
 * Deferred class, used for deferring a promise
 */
export class Deferred<T> {
  private _promise : Promise<T>;
  private _reject : Function;
  private _resolve : Function;

  get promise () : Promise<T> {
    return this._promise;
  }

  get reject () : Function {
    return this._reject;
  }

  get resolve () : Function {
    return this._resolve;
  }

  constructor () {
    this._promise = new Promise<T>((re, rj) => {
      this._resolve = re;
      this._reject  = rj;
    });
  }

  extend (fn : (val : any) => any) {
    this._promise = this._promise.then(fn);
  }
}
