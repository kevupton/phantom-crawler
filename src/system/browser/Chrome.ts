import * as puppeteer from 'puppeteer';
import { Browser, ClickOptions, EvaluateFn, Page, PageEventObj } from 'puppeteer';
import { Dispatcher } from '../../lib/dispatcher/dispatcher';

const PAGE_NAVIGATION_EVENT = 'onPageNavigation';
const PAGE_NAVIGATION_KEY = Symbol();

export class Chrome {
  private _dispatcher = new Dispatcher();
  private static _instance = null;

  static get instance () : Chrome {
    return this._instance || (this._instance = new Chrome());
  }

  private _promise : Promise<Browser>;
  private _page : Page;

  get url () {
    return this._page && this._page.url();
  }

  get page () {
    return this._page;
  }

  get hasPage () {
    return !!this._page;
  }

  get content () {
    return this._page && this._page.content();
  }

  get cookies () {
    return this._page && this._page.cookies();
  }

  private constructor () {
    if (process.env.DEBUG) {
      console.info('[DEBUG] Running Chrome in debug mode')
    }

    const args = ['--no-sandbox'];

    if (process.env.PROXY) {
      console.info('[INFO] Running Chrome on proxy '  + process.env.PROXY);
      args.push('--proxy-server=' + process.env.PROXY)
    }

    console.info('[INFO] Starting Chromium browser');
    this._promise = puppeteer.launch({
      headless: !process.env.DEBUG,
      args: args,
    }).then(async browser => {
      console.info('[INFO] Running Chromium browser version: ', await browser.version());

      browser.on('targetdestroyed', async target => {
        const page = await target.page();

        if (page === this._page) {
          this._page = null;
        }
      });
      return browser;
    });
  }

  headers (extra) {
    this._page && this._page.setExtraHTTPHeaders(extra);
  }

  off (eventName : string, fn : (...args : any[]) => void) {
    return this._page && this._page.removeListener(eventName, fn);
  }

  on (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    return this._page && this._page.on(eventName, fn);
  }

  once (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    return this._page && this._page.once(eventName, fn);
  }

  async makePage () {
    const browser = await this._promise;
    const pages = await browser.pages();

    const page = pages.length ? pages[0] : await browser.newPage();

    if (!page[PAGE_NAVIGATION_KEY]) {
      page[PAGE_NAVIGATION_KEY] = true;
      await page.evaluateOnNewDocument(name => {
        window.addEventListener('beforeunload', () => {
          window[name]();
        });
      }, PAGE_NAVIGATION_EVENT);
    }

    return page;
  }

  async onPageNavigation (fn : Function) {
    try {
      await this._page.exposeFunction(PAGE_NAVIGATION_EVENT, () => {
        this._dispatcher.trigger(PAGE_NAVIGATION_EVENT);
      });
    }
    catch (e) {
    }

    this._dispatcher.on(PAGE_NAVIGATION_EVENT, fn);
  }

  offPageNavigation (fn : Function) {
    this._dispatcher.remove(PAGE_NAVIGATION_EVENT, fn);
  }

  async open (url : string) : Promise<{ status : number, page : Page }> {
    if (!this.hasPage) {
      this._page = await this.makePage();
      await this._page.setViewport({width: 1800, height: 1200});
    }

    const response = await this._page.goto(url, {timeout: 120000});

    if (!response.ok) throw new Error(`${response.status}: Unable to load WebPage. ${response.text()}`);

    return {status: response.status(), page: this._page};
  }

  run<R> (fn : EvaluateFn, ...args : any[]) {
    return this._page && this._page.mainFrame()
      .evaluate(fn, ...args);
  }

  async click (selector : string, options? : ClickOptions, xpath = false) {
    if (!this._page) {
      return;
    }

    if (xpath) {
      const items = await this._page.$x(selector);
      return items.length && items[0].click(options) || null;
    }
    return this._page.click(selector, options);
  }

  async hover (selector: string, xpath = false) {
    if (!this._page) {
      return;
    }

    if (xpath) {
      const element = await this._page.$x(selector);
      return element.length && element[0].hover();
    }
    return this._page.hover(selector);
  }

  async type (selector: string, text : string, options : {delay: number} = {delay: 20}) {
    return this._page && this._page.type(selector, text, options);
  }

  async awaitPageLoad () {
    return this._page && this._page.waitForNavigation({timeout: 120000});
  }

  async scrollTo (query : string, xpath = false) {
    if (!this._page) {
      return;
    }

    return this._page.mainFrame().evaluate(function (query, xpath) {
      let item = null;
      if (xpath) {
        const items = $x(query);
        if (items.length) {
          item = items[0];
        }
      }
      else {
        item = document.querySelector(query);
      }

      if (item) {
        item.scrollIntoView({block: 'start', behavior: 'smooth'});
      }
    }, query, xpath)
  }
}
