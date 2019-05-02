import { PhantomJS } from 'phantom';
import { Browser as Chrome, BrowserEventObj, default as puppeteer } from 'puppeteer';
import { AsyncSubject, from, Observable } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { flatMap, mapTo } from 'rxjs/operators';
import { environment } from '../lib/Environment';
import { EventCallback, RxjsBasicEventManager } from '../lib/RxjsBasicEventManager';
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

  openNewTab () : Observable<void>;

  setActiveTab (tabIndex : number) : Observable<void>;

  closeTab (tabIndex : number) : Observable<void>;
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

  public readonly activePage$ = this.pageManager.activeInstance$;

  get pages () {
    return this.pageManager.instances;
  }

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

  getTab (tabIndex? : number) {
    return this.pageManager.getInstance(tabIndex);
  }

  openNewTab (url? : string) : Observable<void> {
    return this.pageManager.openNewInstance()
      .pipe(
        flatMap(page => {
          if (url) {
            return page.open(url);
          }

          return of(null);
        }),
        mapTo(undefined),
      );
  }

  setActiveTab (index : any) : Observable<void> {
    return this.pageManager.setActiveInstance(index)
      .pipe(mapTo(undefined));
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
    if (environment.debug) {
      console.info('[DEBUG] Running Chrome in debug mode');
    }

    const args = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ];

    if (environment.proxy) {
      console.info('[INFO] Running Chrome on proxy ' + environment.proxy);
      args.push('--proxy-server=' + environment.proxy);
    }

    console.info('[INFO] Starting Chromium browser');

    return from(puppeteer.launch({
      headless: !(environment.debug || environment.openBrowser),
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

          const eventSubscription = this.on$('targetdestroyed')
            .pipe(
              flatMap(([target]) => from(target.page())),
            )
            .subscribe((page) => {
              this.pageManager.closeTab(page);
            });

          this.unsubscribeOnDestroy(eventSubscription);
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
            return phantomMethod(phantomBrowser);
          }
        }
        else {
          throw new Error('Something went wrong with the case manager for the Browser');
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
