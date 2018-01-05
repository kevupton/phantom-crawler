import { HTTPRequest } from '../system/HTTPRequest';
import { HTTPResponse } from '../system/HTTPResponse';
import { Phantom } from '../system/browser/Phantom';
import { Deferred } from '../util/Deferred';
import { Chrome } from '../system/browser/Chrome';
import { EvaluateFn, PageEventObj } from 'puppeteer';
import { Application } from '../App';

interface IEventStore {
  eventName : string;
  fn : Function;
}

export class Controller {

  private _events : IEventStore[] = [];

  constructor (
    protected request : HTTPRequest,
    protected response : HTTPResponse,
    private _app : Application
  ) {

  }

  get browser () {
    return this._app.browser;
  }

  async awaitPageLoads () : Promise<() => Promise<any>> {
    let changing_pages = false;

    const deferred = new Deferred();
    await this.on('request', () => changing_pages = true);
    await this.on('requestfinished', () => deferred.resolve());

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

  on (eventName : keyof PageEventObj, fn : (e: PageEventObj[keyof PageEventObj], ...args: any[]) => void) {
    this._events.push({
      eventName,
      fn
    });

    return Chrome.instance.on(eventName, fn);
  }

  run (fn: EvaluateFn, ...args: any[]) {
    return Chrome.instance.run(fn, ...args);
  }
}
