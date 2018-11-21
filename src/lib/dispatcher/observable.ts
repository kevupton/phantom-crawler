import { AutoBind } from '../../decorators/auto-bind';
import { Dispatcher } from './dispatcher';
import { Subscription } from './subscription';

@AutoBind
export class Observable<T = any> {
  constructor (
    private _dispatcher                  = new Dispatcher(),
    private _eventName : string | number = '',
    private _key? : string
  ) {
  }

  subscribe (fn : (...val : T[]) => any) : Subscription {
    return this._dispatcher.on(this._eventName, fn, this._key);
  }

  once (fn : (...val : T[]) => any) {
    return this._dispatcher.temporaryOn(this._eventName, fn, 1, undefined, undefined, this._key);
  }

  subscribeTemporarily (handle : (...val : T[]) => any, execTimes? : number, duration? : number, promise? : Promise<void>) {
    return this._dispatcher.temporaryOn(this._eventName, handle, execTimes, duration, promise, this._key);
  }

  unsubscribe (fn : (...val : T[]) => any) {
    return this._dispatcher.remove(this._eventName, fn, this._key);
  }

  emit (...args : T[]) {
    return this._dispatcher.trigger(this._eventName, args, this._key);
  }

  clear () {
    this._dispatcher.removeAll(this._eventName);
  }

  bindEmit (...args : T[]) {
    return this.emit.bind(this, ...args);
  }
}
