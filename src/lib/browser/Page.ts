import { PhantomJS, WebPage as PhantomPage } from 'phantom';
import {
  Browser as Chrome,
  ClickOptions,
  EvaluateFn,
  NavigationOptions,
  Page as ChromePage,
  ScreenshotOptions,
} from 'puppeteer';
import { AsyncSubject, combineLatest, Observable, throwError } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { flatMap, map, mapTo } from 'rxjs/operators';
import { Browser } from './Browser';
import { Setup } from './Setup';

export interface IPage {
  run<R> (fn : EvaluateFn, ...args : any[]) : Observable<void>;

  contains (options : DomOptions) : Observable<boolean>;

  getValues (options : DomOptions) : Observable<[]>;

  click (options : DomOptions & { options? : ClickOptions }) : Observable<void>;

  hover (options : DomOptions) : Observable<void>;

  focus (options : DomOptions) : Observable<void>;

  type (options : DomOptions & TypeOptions) : Observable<void>;

  awaitPageLoad (duration : number) : Observable<void>;

  setScrollTop (query : string, top : number) : Observable<void>;

  scrollTo (options? : DomOptions & ScrollTopOptions) : Observable<void>;

  captureScreenshot (options? : ScreenshotOptions) : Observable<Buffer>;

  refresh (options? : NavigationOptions) : Observable<void>;

  getUrl () : Observable<string>;

  setViewport (width : number, height : number) : Observable<void>;
}

interface IPagePossibilities {
  phantomPage? : PhantomPage;
  chromePage? : ChromePage;
}

interface DomOptions {
  selector : string;
  xpath? : boolean;
}

interface TypeOptions {
  options? : {
    delay : number;
  };
  text : string;
}

interface ScrollTopOptions {
  top : number;
}

export class Page extends Setup implements IPage {

  private readonly pageSubject = new AsyncSubject<IPagePossibilities>();

  constructor (
    private readonly browser : Browser,
  ) {
    super();
  }


  hover ({ selector, xpath } : DomOptions) {
    return this.caseManager(
      chromePage => {
        if (xpath) {
          return from(chromePage.$x(selector))
            .pipe(flatMap(elements => {
              if (!elements.length) {
                return;
              }
              const hovers = elements.map(element => from(element.hover()));
              return combineLatest(hovers);
            }));
        }
        return from(chromePage.hover(selector));
      }
    )
  }

  focus ({ selector, xpath } : DomOptions) {
    return this.caseManager(
      chromePage => {
        if (xpath) {
          return from(chromePage.$x(selector))
            .pipe(flatMap(elements => {
              if (!elements.length) {
                return;
              }
              const focuses = elements.map(element => from(element.focus()));
              return combineLatest(focuses);
            }));
        }
        return from(chromePage.focus(selector));
      }
    );
  }

  type ({ xpath, selector, options, text } : DomOptions & TypeOptions) {
    return this.caseManager(
      chromePage => {
        if (xpath) {
          return from(chromePage.$x(selector))
            .pipe(flatMap(elements => {
              if (!elements.length) {
                return;
              }
              const typings = elements.map(element => from(element.type(text, options)));
              return combineLatest(typings);
            }));
        }
        return from(chromePage.type(selector, text, options));
      }
    );
  }

  awaitPageLoad () {
    return this.caseManager(
      chromePage => from(chromePage.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 120000,
      }))
    );
  }

  setScrollTop ({ selector, xpath, top } : DomOptions & ScrollTopOptions) {
    const xpathCmd = `() => {
      const top = ${ JSON.stringify(top) };
      const item = $x();
        
    })()`;
    const querySelectorCmd = `(() => {
      const top = ${ JSON.stringify(top) };
      const item = document.querySelectorAll(${ JSON.stringify(selector) });
      
      if (!item) {
        return false;
      }
      
      item.scrollTop = top;
      return true;
    })()`;

    return this.activePage.evaluate()
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

  captureScreenshot (options? : ScreenshotOptions) : Observable<Buffer> {
    return this.caseManager(
      chromePage => from(chromePage.screenshot(options))
    );
  }

  refresh (options? : NavigationOptions) : Observable<void> {
    return this.caseManager(
      chromePage => from(chromePage.reload(options))
    );
  }

  getUrl () {
    return this.caseManager(
      chromePage => of(chromePage.url())
    );
  }

  setViewport (width : number, height : number) : Observable<void> {
    return this.caseManager(chromePage => {
      return from(chromePage.setViewport({ width, height }));
    });
  }

  handleDestruct () {
    return of(null);
  }

  handleSetup () {
    return this.browser.browser$.pipe(
      flatMap(({ chromeBrowser, phantomBrowser }) => {
        if (chromeBrowser) {
          return this.createNewChromiumPage(chromeBrowser);
        }
        else if (phantomBrowser) {
          throw new Error('PhantomJS Page not implemented');
        }
        else {
          throw new Error('Not sure how we got here...');
        }
      }),
    );
  }

  createNewChromiumPage (browser : Chrome) {
    return from(browser.newPage())
      .pipe(
        tap(page => this.pageSubject.next({ chromePage: page })),
        mapTo(null),
      );
  }

  private caseManager (chromeMethod : (page : ChromePage) => Observable<any>, phantomMethod? : (page : PhantomPage) => Observable<any>) {
    return this.pageSubject.pipe(
      flatMap(({ chromePage, phantomPage }) => {
        if (chromePage) {
          return chromeMethod(chromePage);
        }
        else if (phantomPage) {
          if (!phantomMethod) {
            throw new Error('Set viewport not implemented for PhantomJS');
          }
          else {
            phantomMethod(phantomPage);
          }
        }
      }),
    );
  }
}
