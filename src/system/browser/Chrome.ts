import * as puppeteer from 'puppeteer';
import { Browser, EvaluateFn, Page, PageEventObj } from 'puppeteer';

export class Chrome {

  private static _instance = null;

  static get instance () : Chrome {
    return this._instance || (this._instance = new Chrome());
  }

  private _promise : Promise<Browser>;
  private _page : Page;

  get page () {
    return this._page;
  }

  get hasPage () {
    return this._page;
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
    this._promise = puppeteer.launch({
      headless: !process.env.DEBUG,
      args: ['--no-sandbox']
    }).then(browser => {
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

  async open (url : string) : Promise<{ status : number, page : Page }> {
    if (!this.hasPage) {
      const browser = await this._promise;
      const pages   = await browser.pages();

      if (!pages.length) {
        this._page = await browser.newPage();
      }
      else {
        this._page = (await browser.pages())[0];
      }

      await this._page.setViewport({width: 1800, height: 1200});
    }

    const response = await this._page.goto(url);

    if (!response.ok) throw new Error(`${response.status}: Unable to load WebPage. ${response.text()}`);

    return {status: response.status, page: this._page};
  }

  run<R> (fn : EvaluateFn, ...args : any[]) {
    return this._page && this._page.mainFrame()
      .evaluate(fn, ...args);
  }
}
