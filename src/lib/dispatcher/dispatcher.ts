import { temporaryEvent } from '../../util/temporaryEvent';
import { Observable } from './observable';
import { Subscription } from './subscription';
import { Register } from './register';

interface IRegistry {
  [key : string] : Register;
}

export class Dispatcher<T extends string | number = string | number> {
  private registry : IRegistry = {};

  constructor (
    private errorHandler : (e : any) => void = null
  ) {
  }

  on (name : T, handle : Function, key? : string) {
    this.getRegister(name)
      .add(handle, key);
    return new Subscription(this, name, handle, key);
  }

  reset () {
    this.registry = {};
  }

  remove (name : T, handle : Function, key? : string) {
    this.getRegister(name)
      .remove(handle, key);
  }

  removeAll (name : T) {
    if (!this.registry.hasOwnProperty(name)) return;
    this.getRegister(name)
      .empty();
  }

  temporaryOn (
    name : T,
    handle : Function,
    execTimes? : number,
    duration? : number,
    promise? : Promise<void>,
    key? : string
  ) {
    return temporaryEvent(
      fn => this.on(name, fn, key),
      fn => this.remove(name, fn),
      handle,
      execTimes,
      duration,
      promise
    );
  }

  setErrorHandler (handler : (error : any) => void) {
    this.errorHandler = handler;
  }

  createTrigger (name : T, args : Array<any> = []) {
    return (...args2 : any[]) => {
      return this.trigger(
        name,
        args2.concat(args)
      );
    };
  }

  trigger (name : T, args : Array<any> = [], key? : string, errorHandler? : (error : any) => void) {
    return this.getRegister(name)
      .execute(args, key, errorHandler || this.errorHandler);
  }

  observeEvent (event : T) {
    return new Observable<any>(this, event);
  }

  protected load () : void {}

  protected unload () : void {
    this.registry = {};
  }

  private getRegister (name : T) : Register {
    const key = name.toString();
    return this.registry[key] || (this.registry[key] = new Register());
  }
}
