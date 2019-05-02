import { map } from 'rxjs/operators';
import { BrowserManager } from '../browser/BrowserManager';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';

export class Controller {

  get activeBrowser$ () {
    return this.browserManager.getActiveBrowser();
  }

  get activePage$ () {
    return this.activeBrowser$.pipe(
      map(browser => browser.getActiveTab())
    )
  }

  constructor (
    protected readonly request : HTTPRequest,
    protected readonly response : HTTPResponse,
    protected readonly browserManager : BrowserManager,
  ) {
  }

  destructor() {

  }
}
