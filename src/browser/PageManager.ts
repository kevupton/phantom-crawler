import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { tap } from 'rxjs/internal/operators/tap';
import { distinctUntilChanged, flatMap, map, mapTo, shareReplay } from 'rxjs/operators';
import { Browser } from './Browser';
import { IPagePossibilities, Page } from './Page';

export class PageManager {
  private readonly pagesSubject           = new BehaviorSubject<Page[]>([]);
  private readonly activePageIndexSubject = new BehaviorSubject(0);

  public readonly activePage$ = combineLatest([
    this.pagesSubject.asObservable(),
    this.activePageIndexSubject.asObservable(),
  ])
    .pipe(
      map(([pages, activeIndex]) => pages[activeIndex]),
      distinctUntilChanged(),
      shareReplay(1),
    );

  public readonly hasPages$ = this.pagesSubject
    .pipe(
      map((pages) => pages.length > 0),
      distinctUntilChanged(),
      shareReplay(1),
    );

  constructor (
    private readonly browser : Browser,
  ) {
    this.keepActiveIndexInsideBounds();
  }

  openNewTab () {
    return new Observable<Page>(subscriber => {
      const page = new Page(this.browser);

      subscriber.add(page.setup().pipe(
        flatMap(() => page.setViewport(1800, 1200))
      ).subscribe({
        complete: () => {
          page.destroyed$.subscribe(() => {
            this.pagesSubject.next(
              this.pagesSubject.value.filter(p => p !== page),
            );
          });

          this.pagesSubject.next([
            ...this.pagesSubject.value,
            page,
          ]);

          subscriber.next(page);
          subscriber.complete();
        },
      }));
    });


  }

  closeTab (tabToRemove : any) {
    const pages = this.pagesSubject.value;

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

  getTab (index? : number) {
    index     = index || this.activePageIndexSubject.value;
    const tab = this.pagesSubject.value[index];

    if (!tab) {
      throw new Error('Invalid tab index provided. Or invalid active tab index.');
    }

    return tab;
  }

  setActiveTab (index : number) {
    return this.getTab(index)
      .bringToFront()
      .pipe(
        tap(() => this.activePageIndexSubject.next(index)),
      );
  }

  reset () : Observable<void> {
    const pagesToClose = this.pagesSubject.value;

    return this.openNewTab()
      .pipe(
        flatMap(() => combineLatest(
          pagesToClose.map(page => page.destroy()),
        )),
        tap(() => this.activePageIndexSubject.next(0)),
        mapTo(undefined),
      );
  }

  registerPages (pagePossibilities : IPagePossibilities[]) {
    const pages = pagePossibilities.map(possibilities => new Page(this.browser, possibilities));

    return combineLatest(pages.map(page => page.setViewport(1800, 1200)))
      .pipe(
        tap(() => {
          this.pagesSubject.next([
            ...this.pagesSubject.value,
            ...pages,
          ]);
        }),
        mapTo(undefined),
      );
  }

  closeTabAtIndex (index) {
    return this.getTab(index).destroy();
  }

  private keepActiveIndexInsideBounds () {
    this.pagesSubject.subscribe(pages => {
      const activeIndex = this.activePageIndexSubject.value;
      if (activeIndex < 0) {
        this.activePageIndexSubject.next(0);
      }
      else if (activeIndex > pages.length - 1) {
        this.activePageIndexSubject.next(pages.length - 1);
      }
    });
  }
}
