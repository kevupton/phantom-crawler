import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { Browser, BrowserType } from './Browser';

export class BrowserManager {
  private readonly browsersSubject = new BehaviorSubject<Browser[]>([]);

  get browsers () {
    return this.browsersSubject.value;
  }

  reset () {
    return combineLatest(this.browsersSubject.value.map(browser => browser.destroy()));
  }

  openNewBrowser(type : BrowserType = BrowserType.Chrome) {
    return new Observable<Browser>(subscriber => {
      const browser = new Browser(type);

      subscriber.add(browser.setup().subscribe({
        complete: () => {
          browser.destroyed$.subscribe(() => {
            this.browsersSubject.next(
              this.browsersSubject.value.filter(b => b !== browser)
            )
          });

          this.browsersSubject.next([
            ...this.browsersSubject.value,
            browser,
          ]);

          subscriber.next(browser);
          subscriber.complete();
        }
      }));
    });
  }
}
