import * as puppeteer from 'puppeteer';
import {
  Browser,
  ClickOptions,
  ElementHandle,
  EvaluateFn,
  NavigationOptions,
  Page,
  ScreenshotOptions,
} from 'puppeteer';
import { BehaviorSubject } from 'rxjs';

export class Chrome {
  private static _instance = null;

  static get instance () : Chrome {
    return this._instance || (this._instance = new Chrome());
  }

  private readonly browser              = new BehaviorSubject<Browser | null>(null);
  private readonly activePageTabSubject = new BehaviorSubject<number>(0);
  private readonly pagesSubject         = new BehaviorSubject<Page[]>([]);

  get activePage () {
    return this.pagesSubject.value[this.activePageTabSubject.value];
  }

  get url () {
    return this.activePage && this.activePage.url();
  }

  get hasPage () {
    return !!this.activePage;
  }

  get content () {
    return this.activePage && this.activePage.content();
  }

  get cookies () {
    return this.activePage && this.activePage.cookies();
  }

  getContent (index ? : number) {
    if (index) {
      if (this.pagesSubject[index]) {
        return this.pagesSubject.value[index].content();
      }
      return null;
    }

    return this.content;
  }

  async reset () {
    const promise = this.browser;

    this.browser.next(null);
    this.pagesSubject.next([]);
    this.activePageTabSubject.next(0);

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

  async open (url : string, tabIndex = this.activePageTabSubject) : Promise<{ status : number }> {
    await this.getBrowser();

    const page = this.pagesSubject[tabIndex];

    if (!page) {
      throw new Error('Page with index does not exist');
    }

    const response = await page.goto(url, { timeout: 300000 });

    if (!response.ok) throw new Error(`${ response.status }: Unable to load WebPage. ${ response.text() }`);

    return { status: response.status() };
  }

  run<R> (fn : EvaluateFn, ...args : any[]) {
    return this.activePage && this.activePage.mainFrame()
      .evaluate(fn, ...args)
      .catch(e => {
        console.error('Run Method Error', e);
      });
  }

  async contains (selector : string, xpath = false, tabIndex = this.activePageTabSubject) {
    const page = this.pagesSubject[tabIndex];

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

  async getValues (selector : string, xpath = false, tabIndex = this.activePageTabSubject) {
    const page = this.pagesSubject[tabIndex];

    if (!page) {
      return;
    }

    let items : ElementHandle[] | null = null;

    try {
      if (xpath) {
        items = await page.$x(selector);
      }
      else {
        items = await page.$$(selector);
      }
    }
    catch (e) {
      return [];
    }

    if (!items.length) {
      return [];
    }

    try {
      return await page.evaluate((...elements) => {
        return elements.map(element => element.value || element.nodeValue || element.textContent);
      }, ...items);
    }
    catch (e) {
      return [];
    }
  }

  async click (
    selector : string,
    options? : ClickOptions,
    xpath = false,
    tabIndex : number = this.activePageTabSubject,
  ) {
    const page = this.pagesSubject[tabIndex];

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
          if (window[name]) {
            window[name]();
          }
        });
      }, PAGE_NAVIGATION_EVENT)
        .catch(err => {
          console.error('OpenNewTab Method Error', err);
        });
    }

    await this.setViewport(page);
    const index = this.pagesSubject.length;
    this.pagesSubject.push(page);

    return index;
  }

  async setActiveTab (index) {
    if (!this.pagesSubject[index]) {
      return;
    }

    this.activePageTabSubject = index;
    await this.activePage.bringToFront();
  }

  async closeTabIndex (index) {
    if (!this.pagesSubject[index]) {
      return;
    }

    if (this.pagesSubject.length === 1) {
      await this.reset();
      return;
    }

    const page = this.pagesSubject.splice(index, 1)[0];
    await page.close();

    if (index <= this.activePageTabSubject) {
      this.activePageTabSubject = Math.max(this.activePageTabSubject - 1, 0);
    }
  }

  async hover (selector : string, xpath = false) {
    if (!this.activePage) {
      return;
    }

    try {
      if (xpath) {
        const element = await this.activePage.$x(selector);
        return element.length && element[0].hover();
      }
      return this.activePage.hover(selector);
    }
    catch (e) {
    }
  }

  async focus (selector : string, xpath = false, tabIndex = this.activePageTabSubject) {
    const page = this.pagesSubject[tabIndex];

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
    tabIndex                     = this.activePageTabSubject,
  ) {
    const page = this.pagesSubject[tabIndex];

    try {
      return await page && page.type(selector, text, options);
    }
    catch (e) {
      return e.message;
    }
  }

  async awaitPageLoad () {
    return this.activePage && this.activePage.waitForNavigation({ timeout: 120000 });
  }

  async scrollTop (query : string, top : number) {
    if (!this.activePage) {
      return;
    }

    return this.activePage.evaluate(`(() => {
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
    if (!this.activePage) {
      return;
    }

    return this.activePage.evaluate(`(() => {
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

  async screenshot (tabIndex = this.activePageTabSubject, options? : ScreenshotOptions) {
    const page = this.pagesSubject[tabIndex];

    if (!page) {
      return null;
    }

    try {
      return await page.screenshot(options);
    }
    catch (e) {
      return null;
    }
  }

  async refresh (tabIndex = this.activePageTabSubject, options? : NavigationOptions) {
    const page = this.pagesSubject[tabIndex];

    if (!page) {
      return;
    }

    await page.reload(options);
  }

  public getUrl (index = this.activePageTabSubject) {
    const page = this.pagesSubject[index];

    if (!page) {
      return null;
    }

    return page.url();
  }

  private async getBrowser () : Promise<Browser> {
    const browser = await this.browser;
    if (!browser) {
      this.createNewBrowser();
      return await this.browser;
    }
    return browser;
  }

  private createNewBrowser () {

  }

  private async setViewport (page : Page) {
    await page.setViewport({ width: 1800, height: 1200 });
    return page;
  }
}
