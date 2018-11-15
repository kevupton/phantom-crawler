import * as puppeteer from 'puppeteer';
import { Browser, ClickOptions, EvaluateFn, Page, PageEventObj } from 'puppeteer';
import { Dispatcher } from '../../lib/dispatcher/dispatcher';

const PAGE_NAVIGATION_EVENT = 'onPageNavigation';
const PAGE_NAVIGATION_KEY   = Symbol();

export class Chrome {
  private static _instance = null;

  static get instance () : Chrome {
    return this._instance || (this._instance = new Chrome());
  }

  private _dispatcher      = new Dispatcher();
  private _browser : Promise<Browser>;
  private _activePageTab  = 0;
  private _pages : Page[] = [];

  get page () {
    return this._pages[this._activePageTab];
  }

  get url () {
    return this.page && this.page.url();
  }

  get hasPage () {
    return !!this.page;
  }

  get pages () {
    return this._pages;
  }

  get content () {
    return this.page && this.page.content();
  }

  get cookies () {
    return this.page && this.page.cookies();
  }

  private constructor () {
    if (process.env.DEBUG) {
      console.info('[DEBUG] Running Chrome in debug mode')
    }

    const args = ['--no-sandbox', '--disable-dev-shm-usage'];

    if (process.env.PROXY) {
      console.info('[INFO] Running Chrome on proxy ' + process.env.PROXY);
      args.push('--proxy-server=' + process.env.PROXY)
    }

    console.info('[INFO] Starting Chromium browser');
    this._browser = puppeteer.launch({
      headless: !process.env.DEBUG,
      args: args,
    })
      .then(async browser => {
        console.info('[INFO] Running Chromium browser version: ', await browser.version());

        browser.on('targetdestroyed', async target => {
          const page = await target.page();

          if (page === this.page) {
            this._pages.splice(this._activePageTab, 1);
          }
        });

        this._pages = await browser.pages();

        for (let i = 0; i < this._pages.length; i++) {
          await this.setViewport(this._pages[i]);
        }

        return browser;
      });
  }

  getContent (index ? : number) {
    if (index) {
      if (this._pages[index]) {
        return this._pages[index].content();
      }
      return null;
    }

    return this.content;
  }

  headers (extra) {
    this.page && this.page.setExtraHTTPHeaders(extra);
  }

  off (eventName : string, fn : (...args : any[]) => void) {
    return this.page && this.page.removeListener(eventName, fn);
  }

  on (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    return this.page && this.page.on(eventName, fn);
  }

  once (eventName : keyof PageEventObj, fn : (e : PageEventObj[keyof PageEventObj], ...args : any[]) => void) {
    return this.page && this.page.once(eventName, fn);
  }

  async onPageNavigation (fn : Function) {
    try {
      await this.page.exposeFunction(PAGE_NAVIGATION_EVENT, () => {
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
    await this._browser;

    if (!this.hasPage) {
      await this.openNewTab();
    }

    const response = await this.page.goto(url, { timeout: 120000 });

    if (!response.ok) throw new Error(`${response.status}: Unable to load WebPage. ${response.text()}`);

    return { status: response.status(), page: this.page };
  }

  run<R> (fn : EvaluateFn, ...args : any[]) {
    return this.page && this.page.mainFrame()
      .evaluate(fn, ...args);
  }

  async click (selector : string, options? : ClickOptions, xpath = false, tabIndex : number = this._activePageTab) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    if (xpath) {
      const items = await page.$x(selector);
      return items.length && items[0].click(options) || null;
    }
    return page.click(selector, options);
  }

  async openNewTab () {
    const browser = await this._browser;
    const page    = await browser.newPage();

    if (!page[PAGE_NAVIGATION_KEY]) {
      page[PAGE_NAVIGATION_KEY] = true;
      await page.evaluateOnNewDocument(name => {
        window.addEventListener('beforeunload', () => {
          window[name]();
        });
      }, PAGE_NAVIGATION_EVENT);
    }

    await this.setViewport(page);
    const index = this._pages.length;
    this._pages.push(page);

    return index;
  }

  async setActiveTab (index) {
    if (!this._pages[index]) {
      return;
    }

    this._activePageTab = index;
  }

  async closeTabIndex (index) {
    if (!this._pages[index]) {
      return;
    }

    const page = this._pages.splice(index, 1)[0];
    await page.close();

    if (index <= this._activePageTab) {
      this._activePageTab = Math.max(this._activePageTab - 1, 0);
    }
  }

  async hover (selector : string, xpath = false) {
    if (!this.page) {
      return;
    }

    if (xpath) {
      const element = await this.page.$x(selector);
      return element.length && element[0].hover();
    }
    return this.page.hover(selector);
  }

  async type (selector : string, text : string, options : { delay : number } = { delay: 20 }) {
    return this.page && this.page.type(selector, text, options);
  }

  async awaitPageLoad () {
    return this.page && this.page.waitForNavigation({ timeout: 120000 });
  }

  async scrollTop (query : string, top : number) {
    if (!this.page) {
      return;
    }

    return this.page.evaluate(`(() => {
      const top = ${JSON.stringify(top)};
      const item = document.querySelector(${JSON.stringify(query)});
      
      if (!item) {
        return false;
      }
      
      item.scrollTop = top;
      return true;
    })()`);
  }

  async scrollTo (query : string) {
    if (!this.page) {
      return;
    }

    return this.page.evaluate(`(() => {
      const query = ${JSON.stringify(query)};
      const item = document.querySelector(query);
      const parent = item.parentElement;
      
      return new Promise(res => {
        if (!item) {
          res({ error: 'No item found', scrolled: false });
          return;
        }
        
        const bounds = item.getBoundingClientRect();
        item.scrollIntoView({ block: 'start', behavior: 'smooth' });
        setTimeout(() => {
          if (bounds.top !== item.getBoundingClientRect().top) {
            try {
              res({ scrolled: true, scrollTop: parent.scrollTop });
            }
            catch (e) {
              res({ scrolled: true, error: e + "", t });
            }
          }
          else {
            res({ scrolled: false, error: 'Already at bottom' });
          }
        }, 500);
      });
    })()`);
  }

  private async setViewport (page : Page) {
    await page.setViewport({ width: 1800, height: 1200 });
    return page;
  }
}
