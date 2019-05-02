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

  private async getBrowser () : Promise<Browser> {
    const browser = await this.browser;
    if (!browser) {
      this.createNewBrowser();
      return await this.browser;
    }
    return browser;
  }
}
