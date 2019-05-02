import { combineLatest, Observable, pipe } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { flatMap, mapTo } from 'rxjs/operators';
import { Browser } from './Browser';
import { Manager, NewInstanceConfig } from './Manager';
import { IPagePossibilities, Page } from './Page';

export class PageManager extends Manager<Page> {

  constructor (
    private readonly browser : Browser,
  ) {
    super();
  }

  protected generateNewInstanceConfig () : NewInstanceConfig<Page> {
    const page = new Page(this.browser);
    return {
      instance: page,
      afterSetup: pipe(
        flatMap(() => page.setViewport(1800, 1200)),
        flatMap(() => page.bringToFront()),
      ),
    };
  }

  closeTab (tabToRemove : any) {
    const pages = this.instancesSubject.value;

    if (!pages.length) {
      return of(null);
    }

    return combineLatest(
      pages.map(page => page.equals(tabToRemove)
        .pipe(
          tap(isEqual => isEqual && page.destroy()),
        )),
    );
  }

  setActiveInstance (index : number) {
    return super.setActiveInstance(index)
      .pipe(
        flatMap(page => page.bringToFront()),
      );
  }

  reset () : Observable<void> {
    return super.reset()
      .pipe(
        flatMap(() => this.openNewInstance()),
        mapTo(undefined),
      );
  }

  registerPages (pagePossibilities : IPagePossibilities[]) {
    const pages = pagePossibilities.map(possibilities => new Page(this.browser, possibilities));

    return combineLatest(pages.map(page => page.setViewport(1800, 1200)))
      .pipe(
        tap(() => {
          this.instancesSubject.next([
            ...this.instancesSubject.value,
            ...pages,
          ]);
        }),
        mapTo(undefined),
      );
  }

  closeTabAtIndex (index) {
    return this.getInstance(index)
      .destroy();
  }
}
