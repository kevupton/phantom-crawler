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

  async awaitPageLoad () : Promise<() => Promise<any>> {
    let changing_pages = false;
    const changer = () => changing_pages = true;

    const deferred = new Deferred();

    deferred.promise.then(()=> this.browser.offPageNavigation(changer));

    await this.browser.onPageNavigation(changer);
    await this.on('requestfinished', () => changing_pages && deferred.resolve());

    return () => {
      setTimeout(async () => {
        if (changing_pages) {
          await this.browser.awaitPageLoad().catch(() => {});
        }
        deferred.resolve()
      }, 100);
      return deferred.promise;
    }
  }

  destructor () {
    this._events.forEach(event => Phantom.instance.off(event.eventName, event.fn));
  }

  on (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    this._events.push({
      eventName,
      fn
    });

    return Chrome.instance.on(eventName, fn);
  }

  once (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    this._events.push({
      eventName,
      fn
    });

    return Chrome.instance.once(eventName, fn);
  }

  run (fn : EvaluateFn, ...args : any[]) {
    return Chrome.instance.run(fn, ...args);
  }
}
