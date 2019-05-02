import { combineLatest } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { flatMap, map, mapTo } from 'rxjs/operators';
import { Controller } from '../server/Controller';
import { Exception } from '../server/exceptions/Exception';

export class PageController extends Controller {
  click ({ selector, button, xpath, tabIndex, awaitPageLoad = true }) {
    if (!selector) throw new Exception('Expected query to be defined', 400);

    button = button || 'left';
    if (!['left', 'right', 'middle'].includes(button)) {
      throw new Exception('Invalid button type. Expected left, right or middle', 400);
    }

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.click({ selector, xpath, options: { button } })
          .pipe(
            flatMap((result) => {
              const obs$ = awaitPageLoad ? of(null) : page.awaitPageLoad();
              return obs$.pipe(mapTo({ result }));
            }))),
      );
  }

  hover ({ selector, xpath, tabIndex }) {
    if (!selector) throw new Exception('Expected query to be defined', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.hover({ selector, xpath })),
        map(result => ({ result })),
      );
  }

  scrollTop ({ selector, xpath, top, tabIndex }) {
    if (!selector) throw new Exception('Expected query to be defined', 400);

    top = top || 0;

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.setScrollTop({ selector, xpath, top })),
        map(result => ({ result })),
      );
  }

  contains ({ selector, xpath, tabIndex }) {
    if (!selector) throw new Exception('Expected an Selector value', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.contains({ selector, xpath })),
        map(result => ({ result })),
      );
  }

  values ({ elements, xpath, tabIndex }) {
    if (!elements) throw new Exception('Expected an elements object', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => {
          return combineLatest(
            Object.keys(elements)
              .map(key => {
                return page.getValues({ selector: elements[key], xpath })
                  .pipe(
                    map(value => ({ key, value })),
                  );
              }),
          );
        }),
        map(pairs => {
          const results = {};
          pairs.forEach(({ key, value }) => results[key] = value);
          return results;
        }),
      );
  }

  scrollTo ({ selector, tabIndex, xpath }) {
    if (!selector) throw new Exception('Expected query to be defined', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.scrollTo({ selector, xpath })),
        map(result => ({ result })),
      );
  }

  focus ({ selector, xpath, tabIndex }) {
    if (!selector) throw new Exception('Expected query to be defined', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.focus({ selector, xpath })),
        map(result => ({ result })),
      );
  }

  type ({ inputs, delay, xpath, tabIndex }) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);
    delay = delay || 20;

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => {
          return combineLatest(
            Object.keys(inputs)
              .map(selector => page.type({
                selector,
                text: inputs[selector],
                xpath,
                options: { delay },
              })
                .pipe(
                  map(result => ({ result, selector })),
                )),
          );
        }),
        map(results => ({ results })),
      );
  }

  fill ({ inputs, tabIndex }) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);

    return this.getActiveBrowserPage(tabIndex)
      .pipe(
        flatMap(page => page.run((inputs : { [key : string] : string }) => {
          try {
            for (let key in inputs) {
              const element : any = document.querySelector(key);
              element.value       = inputs[key];
            }

          }
          catch (e) {
            return e;
          }
        }, inputs)),
        map(result => ({ result })),
      );
  }
}
