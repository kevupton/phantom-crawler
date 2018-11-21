import { Deferred } from '../../util/deferred';
import { isDefined } from '../../util/isDefined';

interface IKeyStore {
  [key : string] : Function[];
}

export class Register {
  private _keys : IKeyStore = {};
  private locked : Deferred<any>;

  private get isLocked () {
    return !!this.locked;
  }

  private get until () : Promise<any> {
    return this.locked && this.locked.promise || Promise.resolve();
  }

  add (fn : Function, key? : string) {
    const exec = () => (this._keys[key] || (this._keys[key] = [])).push(fn);

    if (this.isLocked) {
      this.until.then(exec);
    }
    else {
      exec();
    }
  }

  remove (fn : Function, key? : string) {
    const exec = () => {
      const index = this._keys[key].indexOf(fn);

      if (index >= 0) {
        this._keys[key].splice(index, 1);
      }
    };

    if (this.isLocked) {
      this.until.then(exec);
    }
    else {
      exec();
    }
  }

  empty () {
    this._keys = {};
  }

  execute (args : any[], key? : string, handler? : (error : any) => void) {
    let result : any = undefined;

    this.lock();

    this.getFns(key)
      .forEach(fn => {
        // have error catching here so the events continue even on error
        try {
          result = fn(...args.concat(isDefined(result) ? result : []));
        }
        catch (e) {
          if (handler) {
            handler(e);
          }
          else {
            console.error(e);
          }
        }
      });

    this.unlock();

    return result;
  }

  private getFns (key : string) {
    const defaultKey     = <string>void 0;
    const defaultFns     = this._keys[defaultKey] || [];
    let fns : Function[] = [];

    if (isDefined(key)) {
      fns = this._keys[key] || [];
    }

    return fns.concat(defaultFns);
  }

  private lock () {
    if (this.isLocked) return;

    this.locked = new Deferred();
  }

  private unlock () {
    if (!this.isLocked) return;

    this.locked.resolve();

    this.locked = null;
  }
}
