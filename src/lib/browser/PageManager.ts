import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { Browser } from './Browser';
import { Page } from './Page';

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
  }

  createNewPage () {
    const page = new Page(this.browser);

    const setup$ = page.setup();

    setup$.subscribe({
      complete: () => {
        page.setViewport(1800, 1200);
      },
    });

    this.pagesSubject.next([
      ...this.pagesSubject.value,
      page,
    ]);

    return setup$;
  }

  setActivePageIndex (index : number) {
    if (this.pagesSubject.value[index] === undefined) {
      throw new Error('Invalid index provided. Out of range.');
    }

    this.activePageIndexSubject.next(index);
  }
}
