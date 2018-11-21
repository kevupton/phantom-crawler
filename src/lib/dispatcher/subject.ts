import { Observable } from './observable';
import { Subscription } from './subscription';

export class Subject<T = any> extends Observable<T> {

  private _value : T;

  get value () {
    return this._value;
  }

  constructor (value : T) {
    super();
    this._value = value;
  }

  getValue () {
    return this._value;
  }

  next (value : T) {
    this.emit(value);
  }

  emit (value : T) {
    this._value = value;
    super.emit(value);
  }

  reset (initialValue : T) {
    this._value = initialValue;
    this.clear();
  }

  subscribe (fn : (...args : T[]) => any) : Subscription {
    fn(this._value);
    return super.subscribe(fn);
  }
}
