import { HTTPRequest } from '../system/HTTPRequest';
import { HTTPResponse } from '../system/HTTPResponse';
import { Phantom } from '../system/Phantom';
import { Deferred } from '../util/Deferred';

interface IEventStore {
  eventName : string;
  fn : Function;
}

export class Controller {

  private _events : IEventStore[] = [];

  constructor (
    protected request : HTTPRequest,
    protected response : HTTPResponse
  ) {

  }

  run (script : any) {
    return Phantom.instance.run(script);
  }

  on (eventName : string, fn : Function) {
    this._events.push({
      eventName,
      fn
    });

    return Phantom.instance.on(eventName, fn);
  }

  async awaitPageLoads () : Promise<() => Promise<any>> {
    let changing_pages = false;

    const deferred = new Deferred();
    await this.on('onNavigationRequested', () => changing_pages = true);
    await this.on('onLoadFinished', () => deferred.resolve());

    return () => {
      setTimeout(() => {
        if (!changing_pages) {
          deferred.resolve()
        }
      }, 10);
      return deferred.promise;
    }
  }

  destructor () {
    this._events.forEach(event => Phantom.instance.off(event.eventName, event.fn));
  }
}
