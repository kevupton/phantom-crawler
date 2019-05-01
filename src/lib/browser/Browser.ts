import { PhantomJS } from 'phantom';
import { Browser as Chrome, default as puppeteer } from 'puppeteer';
import { AsyncSubject, BehaviorSubject, iif, Observable } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';
import { PageManager } from './PageManager';

export enum BrowserType {
  Chrome    = 'chrome',
  PhantomJS = 'phantomjs',
}

export interface IBrowserOptions {
  screenSize? : {
    width : number;
    height : number;
  }
}

export interface IBrowser {
  getContent (index ? : number) : Observable<string>;

  reset () : Observable<void>;

  onPageNavigation (fn : Function) : void;

  offPageNavigation (fn : Function) : void;

  open (url : string, tabIndex : number) : Observable<{ status : number }>;

  openNewTab () : Observable<void>;

  setActiveTab (index) : Observable<void>;

  closeTab (index) : Observable<void>;
}

export interface IBrowserPossibilities {
  chromeBrowser : Chrome;
  phantomBrowser : PhantomJS;
}

export class Browser implements IBrowser {

  private readonly browser = new AsyncSubject<IBrowserPossibilities>();
  private readonly pageManager = new PageManager(this);

  get browser$ () {
    return this.browser.asObservable();
  }

  constructor (
    public readonly browserType : BrowserType,
  ) {
      this.setupNewBrowser();
  }

  isChromeBrowser(browser : Chrome | PhantomJS) : browser is Chrome {
    return this.browserType === BrowserType.Chrome;
  }

  isPhantomJSBrowser(browser : Chrome | PhantomJS) : browser is PhantomJS {
    return this.browserType === BrowserType.PhantomJS;
  }

  private setupNewBrowser () {
    switch (this.browserType) {
      case BrowserType.Chrome:
        this.launchPuppeteer();
        break;
      case BrowserType.PhantomJS:
        this.launchPhantomJS();
        break;
      default:
        throw new Error('Invalid browser type supplied');
    }
  }

  private launchPuppeteer () {
    if (process.env.DEBUG) {
      console.info('[DEBUG] Running Chrome in debug mode');
    }

    const args = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ];

    if (process.env.PROXY) {
      console.info('[INFO] Running Chrome on proxy ' + process.env.PROXY);
      args.push('--proxy-server=' + process.env.PROXY);
    }

    console.info('[INFO] Starting Chromium browser');

    puppeteer.launch({
      headless: !(process.env.DEBUG || process.env.OPEN_BROWSER),
      args: args,
    })
      .then(async browser => {
        console.info('[INFO] Running Chromium browser version: ', await browser.version());

        browser.on('targetdestroyed', async target => {
          try {
            const page = await target.page();
            if (page === this.activePage) {
              this.pageManager.remove(this.activePageTabSubject, 1);
            }
          }
          catch (e) {
            console.error('TargetDestroyed Error: ', e);
          }
        });

        const pages$ = from(browser.pages());

        for (let i = 0; i < this.pagesSubject.length; i++) {
          await this.setViewport(this.pagesSubject[i]);
        }

        return browser;
      })
      .catch(e => {
        console.error('New Browser Method error', e);
        return null;
      });
  }

  private launchPhantomJS () {
    throw new Error('PhantomJS is not implemented at this stage');
  }

}
