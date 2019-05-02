import { PhantomJS } from 'phantom';
import { Browser as Chrome, BrowserEventObj, default as puppeteer } from 'puppeteer';
import { AsyncSubject, Observable } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { flatMap } from 'rxjs/operators';
import { EventCallback, RxjsBasicEventManager } from '../RxjsBasicEventManager';
import { ManagerItem } from './ManagerItem';
import { IPagePossibilities, Page } from './Page';
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
  reset () : Observable<void>;

  getTab (tabIndex : number) : Page;

  openNewTab () : Observable<Page>;

  setActiveTab (index) : Observable<void>;

  closeTab (index) : Observable<void>;
}

export interface IBrowserPossibilities {
  chromeBrowser? : Chrome;
  phantomBrowser? : PhantomJS;
}

export class Browser extends ManagerItem implements IBrowser {
  private readonly browserSubject = new AsyncSubject<IBrowserPossibilities>();
  private readonly pageManager    = new PageManager(this);
  private readonly eventManager   = new RxjsBasicEventManager(
    (event, fn) => this.registerEvent(event, fn),
    (event, fn) => this.deregisterEvent(event, fn),
  );

  get browser$ () {
    return this.browserSubject.asObservable();
  }

  constructor (
    public readonly browserType : BrowserType,
  ) {
    super();
  }

  on$<K extends keyof BrowserEventObj> (event : K) : Observable<[BrowserEventObj[K], ...any[]]> {
    return this.eventManager.getEvent$(event);
  }

  reset () : Observable<void> {
    return this.pageManager.reset();
  }

  getTab (tabIndex : number) {
    const tab = this.pageManager.getTab(tabIndex);
    if (!tab) {
      throw new Error('Tab does not exist');
    }
    return tab;
  }

  openNewTab () : Observable<Page> {
    return this.pageManager.openNewTab();
  }

  setActiveTab (index : any) : Observable<void> {
    return this.pageManager.setActiveTab(index);
  }

  closeTab (index : any) : Observable<void> {
    return this.pageManager.closeTabAtIndex(index);
  }

  protected handleDestruct () {
    return this.caseManager(
      chromeBrowser => from(chromeBrowser.close()),
      phantomBrowser => {
        phantomBrowser.exit();
        return of(null);
      },
    );
  }

  protected handleConstruction () {
    switch (this.browserType) {
      case BrowserType.Chrome:
        return this.launchPuppeteer();
      case BrowserType.PhantomJS:
        return this.launchPhantomJS();
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

    return from(puppeteer.launch({
      headless: !(process.env.DEBUG || process.env.OPEN_BROWSER),
      args: args,
    }))
      .pipe(
        tap(browser => {
          from(browser.version())
            .subscribe(version => {
              console.info('[INFO] Running Chromium browser version: ', version);
            });

          this.browserSubject.next({ chromeBrowser: browser });
          this.browserSubject.complete();

          this.on$('targetdestroyed')
            .pipe(
              flatMap(([target]) => from(target.page())),
            )
            .subscribe((page) => {
              this.pageManager.closeTab(page);
            });
        }),
        flatMap(browser => from(browser.pages())),
        tap(pages => this.pageManager.registerPages(
          pages.map(page => (<IPagePossibilities>{ chromePage: page })),
        )),
      );
  }

  private launchPhantomJS () {
    throw new Error('PhantomJS is not implemented at this stage');
  }

  private caseManager (
    chromeMethod : (chromeBrowser : Chrome) => Observable<any>,
    phantomMethod? : (phantomBrowser : PhantomJS) => Observable<any>,
  ) {
    return this.browserSubject.pipe(
      flatMap(({ chromeBrowser, phantomBrowser }) => {
        if (chromeBrowser) {
          return chromeMethod(chromeBrowser);
        }
        else if (phantomBrowser) {
          if (!phantomMethod) {
            throw new Error('Phantom Browser has not been implemented as of yet.');
          }
          else {
            phantomMethod(phantomBrowser);
          }
        }
      }),
    );
  }

  private registerEvent (event : string, fn : EventCallback) {
    return this.caseManager(
      chromeBrowser => {
        chromeBrowser.addListener(event, fn);
        return of(null);
      },
    );
  }

  private deregisterEvent (event : string, fn : EventCallback) {
    return this.caseManager(
      chromeBrowser => {
        chromeBrowser.removeListener(event, fn);
        return of(null);
      },
    );
  }
}
