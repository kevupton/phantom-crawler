import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Browser, BrowserType } from './Browser';

export class BrowserManager {
  private readonly browsersSubject = new BehaviorSubject<Browser[]>([]);

  get browsers () {
    return this.browsersSubject.value;
  }

  openNewBrowser(type : BrowserType = BrowserType.Chrome) {
    const browser = new Browser(type);

    browser.destroyed$.subscribe(() => {
      this.browsersSubject.next(
        this.browsersSubject.value.filter(b => b !== browser)
      )
    });

    this.browsersSubject.next([
      ...this.browsersSubject.value,
      browser,
    ]);

    return browser.setup();
  }
}
