import { Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { BrowserManager } from '../browser/BrowserManager';
import { Page } from '../browser/Page';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';

export class Controller {

  get activeBrowser$ () {
    return this.browserManager.activeInstance$;
  }

  get activePage$ () {
    return this.activeBrowser$.pipe(
      flatMap(browser => browser.activePage$),
    );
  }

  constructor (
    protected readonly request : HTTPRequest,
    protected readonly response : HTTPResponse,
    protected readonly browserManager : BrowserManager,
  ) {
  }

  getActiveBrowserPage(index : number) : Observable<Page> {
    return this.activeBrowser$.pipe(
      map(browser => browser.getTab(index)),
    );
  }

  destructor () {}
}
