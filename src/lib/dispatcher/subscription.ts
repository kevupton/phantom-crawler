import { AutoBind } from '../../decorators/auto-bind';
import { Dispatcher } from './dispatcher';

@AutoBind
export class Subscription {
  constructor (
    private _dispatcher : Dispatcher,
    private _eventName : string|number,
    private _fn : Function,
    private _key? : string
  ) {}

  unsubscribe () {
    this._dispatcher.remove(this._eventName, this._fn, this._key);
  }
}
