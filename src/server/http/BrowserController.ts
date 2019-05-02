import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs/internal/observable/combineLatest';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { flatMap, map } from 'rxjs/operators';
import { Controller } from '../Controller';

export class BrowserController extends Controller {
  active () {
    return this.activePage$.pipe(
      flatMap(page => page.getUrl()),
      map(url => ({ url })),
    );
  }

  cookies () {
    return this.activePage$.pipe(
      flatMap(page => page.getCookies()),
      map(cookies => ({ cookies })),
    );
  }

  reset () {
    return this.activeBrowser$.pipe(
      tap(browser => browser.reset()),
    );
  }

  back () {
    return this.activePage$.pipe(
      tap(page => page.back()),
    );
  }

  display ({ tabIndex } : any) {
    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.getContent()),
        tap(content => this.response.html(content)),
      );
  }

  active_url ({ tabIndex } : any) {
    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.getUrl()),
        map(url => ({ url })),
      );
  }

  download () {
    return this.activePage$.pipe(
      flatMap(page => page.getContent()),
      tap(content => {
        this.response.file(content, 'content.html');
      }),
    );
  }

  getTabs () {
    return this.activeBrowser$.pipe(
      flatMap(browser => combineLatest(browser.pages.map(page => page.getUrl()))),
      map(urls => ({
        pages: urls.map((page, index) => ({ index, page })),
      })),
    );
  }

  setActiveTab ({ tabIndex } : any) {
    return this.activeBrowser$.pipe(
      flatMap(browser => browser.setActiveTab(tabIndex)),
    );
  }

  closeTab ({ tabIndex } : any) {
    return this.activeBrowser$.pipe(
      flatMap(browser => browser.closeTab(tabIndex)),
    );
  }

  openNewTab ({ url } : any) {
    return this.activeBrowser$.pipe(
      flatMap(browser => browser.openNewTab(url)),
    );
  }

  refresh ({ tabIndex, options } : any) {
    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.refresh(options)),
      );
  }

  screenshot ({ tabIndex, options } : any) {
    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.captureScreenshot(options)),
        map(image => ({ image })),
      );
  }

  get ({ url, tabIndex } : any) {
    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap((page) => {
          let obs : Observable<any> = of(null);
          if (url) {
            obs = page.open(url);
          }
          return obs.pipe(flatMap(() => page.getContent()));
        }),
      );
  }

  goto ({ url, tabIndex } : any) {
    return this.getActiveBrowserPage(tabIndex).pipe(
      flatMap(page => page.open(url)),
    );
  }
}


