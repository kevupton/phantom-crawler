import * as puppeteer from 'puppeteer';
import {
  Browser,
  ClickOptions,
  ElementHandle,
  EvaluateFn,
  NavigationOptions,
  Page,
  PageEventObj,
  ScreenshotOptions,
} from 'puppeteer';
import { Dispatcher } from '../../lib/dispatcher/dispatcher';

const PAGE_NAVIGATION_EVENT = 'onPageNavigation';
const PAGE_NAVIGATION_KEY   = Symbol();

export class Chrome {
  private static _instance = null;

  static get instance () : Chrome {
    return this._instance || (this._instance = new Chrome());
  }

  private _dispatcher     = new Dispatcher();
  private _browser : Promise<Browser> | null;
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

  async reset () {
    const promise = this._browser;

    this._browser       = null;
    this._pages         = [];
    this._activePageTab = 0;

    const browser = await promise;

    if (!browser) {
      return;
    }

    try {
      await browser.close();
    }
    catch (e) {
      console.error(e);
    }
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
    await this.getBrowser();

    if (!this.hasPage) {
      await this.openNewTab();
    }

    const response = await this.page.goto(url, { timeout: 120000 });

    if (!response.ok) throw new Error(`${ response.status }: Unable to load WebPage. ${ response.text() }`);

    return { status: response.status(), page: this.page };
  }

  run<R> (fn : EvaluateFn, ...args : any[]) {
    return this.page && this.page.mainFrame()
      .evaluate(fn, ...args)
      .catch(e => {
        console.error('Run Method Error', e);
      });
  }

  async contains (selector : string, xpath = false, tabIndex = this._activePageTab) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    try {
      if (xpath) {
        const items = await page.$x(selector);
        return items.length > 0;
      }
      else {
        return !!await page.$(selector);
      }
    }
    catch (e) {
      return false;
    }
  }

  async getValues (selector : string, xpath = false, tabIndex = this._activePageTab) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    let items : ElementHandle[] | null = null;

    try {
      if (xpath) {
        items = await page.$x(selector);
      }
      else {
        items = await page.$$(selector)
      }
    }
    catch (e) {
      return [];
    }

    if (!items.length) {
      return [];
    }

    return await page.evaluate((...elements) => {
      return elements.map(element => element.value || element.nodeValue || element.textContent);
    }, ...items);
  }

  async click (selector : string, options? : ClickOptions, xpath = false, tabIndex : number = this._activePageTab) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    try {
      if (xpath) {
        const items = await page.$x(selector);
        return items.length && items[0].click(options) || null;
      }
      return page.click(selector, options);
    }
    catch (e) {
    }
  }

  async openNewTab () {
    const browser = await this.getBrowser();
    const page    = await browser.newPage();

    if (!page[PAGE_NAVIGATION_KEY]) {
      page[PAGE_NAVIGATION_KEY] = true;
      await page.evaluateOnNewDocument(name => {
        window.addEventListener('beforeunload', () => {
          window[name]();
        });
      }, PAGE_NAVIGATION_EVENT)
        .catch(err => {
          console.error('OpenNewTab Method Error', err);
        });
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
    await this.page.bringToFront();
  }

  async closeTabIndex (index) {
    if (!this._pages[index]) {
      return;
    }

    if (this._pages.length === 1) {
      await this.reset();
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

    try {
      if (xpath) {
        const element = await this.page.$x(selector);
        return element.length && element[0].hover();
      }
      return this.page.hover(selector);
    }
    catch (e) {
    }
  }

  async focus (selector : string, xpath = false, tabIndex = this._activePageTab) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    try {
      if (xpath) {
        const element = await page.$x(selector);
        return element.length && element[0].focus();
      }
      await page.focus(selector);
    }
    catch (e) {
    }
  }

  async type (
    selector : string,
    text : string,
    options : { delay : number } = { delay: 20 },
    tabIndex                     = this._activePageTab,
  ) {
    const page = this._pages[tabIndex];
    return page && page.type(selector, text, options);
  }

  async awaitPageLoad () {
    return this.page && this.page.waitForNavigation({ timeout: 120000 });
  }

  async scrollTop (query : string, top : number) {
    if (!this.page) {
      return;
    }

    return this.page.evaluate(`(() => {
      const top = ${ JSON.stringify(top) };
      const item = document.querySelector(${ JSON.stringify(query) });
      
      if (!item) {
        return false;
      }
      
      item.scrollTop = top;
      return true;
    })()`)
      .catch(err => {
        console.error('ScrollTop Method Error', err);
      });
  }

  async scrollTo (query : string) {
    if (!this.page) {
      return;
    }

    return this.page.evaluate(`(() => {
      const query = ${ JSON.stringify(query) };
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
    })()`)
      .catch(err => {
        console.error('ScrollTo Method Error', err);
      });
  }

  async screenshot (tabIndex = this._activePageTab, options? : ScreenshotOptions) {
    const page = this._pages[tabIndex];

    if (!page) {
      return null;
    }

    return await page.screenshot(options);
  }

  async refresh (tabIndex = this._activePageTab, options? : NavigationOptions) {
    const page = this._pages[tabIndex];

    if (!page) {
      return;
    }

    await page.reload(options);
  }

  private async getBrowser () : Promise<Browser> {
    const browser = await this._browser;
    if (!browser) {
      this.createNewBrowser();
      return await this._browser;
    }
    return browser;
  }

  private createNewBrowser () {
    if (process.env.DEBUG) {
      console.info('[DEBUG] Running Chrome in debug mode')
    }

    const args = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ];

    if (process.env.PROXY) {
      console.info('[INFO] Running Chrome on proxy ' + process.env.PROXY);
      args.push('--proxy-server=' + process.env.PROXY)
    }

    console.info('[INFO] Starting Chromium browser');

    this._browser = puppeteer.launch({
      headless: !(process.env.DEBUG || process.env.OPEN_BROWSER),
      args: args,
    })
      .then(async browser => {
        console.info('[INFO] Running Chromium browser version: ', await browser.version());

        browser.on('targetdestroyed', async target => {
          try {
            const page = await target.page();
            if (page === this.page) {
              this._pages.splice(this._activePageTab, 1);
            }
          }
          catch (e) {
            console.error('rip', e);
          }
        });

        this._pages = await browser.pages();

        for (let i = 0; i < this._pages.length; i++) {
          await this.setViewport(this._pages[i]);
        }

        return browser;
      })
      .catch(e => {
        console.error('New Browser Method error', e);
        return null;
      });
  }

  private async setViewport (page : Page) {
    await page.setViewport({ width: 1800, height: 1200 });
    return page;
  }
}
