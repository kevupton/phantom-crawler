import { EvaluateFn, Page, PageEventObj } from 'puppeteer';
import { Subject, Subscription } from 'rxjs';
import { first } from 'rxjs/internal/operators/first';
import { Application } from '../../App';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';

interface IEventStore {
  eventName : string;
  fn : Function;
}

export class Controller {

  private readonly subscriptions : Subscription = new Subscription();

  constructor (
    protected readonly request : HTTPRequest,
    protected readonly response : HTTPResponse,
    protected readonly app : Application,
  ) {

  }

  async awaitPageLoad () : Promise<() => Promise<any>> {
    page.click("button[type=submit]"),
    page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  on (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) : Page {
    this.subscriptions.push({
      eventName,
      fn,
    });

    return this.app.browser.instance.on(eventName, fn);
  }

  once (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) : Page {
    this.subscriptions.push({
      eventName,
      fn,
    });

    return Chrome.instance.once(eventName, fn);
  }
}
