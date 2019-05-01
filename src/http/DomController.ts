import { Exception } from '../lib/routing/exceptions/Exception';
import { Controller } from '../lib/routing/Controller';

export class DomController extends Controller {
  async click ({ query, button, xpath, tabIndex, awaitPageLoad = true }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;

    button = button || 'left';
    if (![ 'left', 'right', 'middle' ].includes(button)) {
      throw new Exception('Invalid button type. Expected left, right or middle', 400);
    }

    try {
      let watch : () => Promise<any> | null;
      if (awaitPageLoad) {
        watch = await this.awaitPageLoad();
      }
      result = await this.browser.click(query, { button }, xpath, tabIndex);
      if (watch) {
        await watch();
      }
    }
    catch (e) {
      result = e;
    }

    return { result };
  }

  async hover ({ query, xpath }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;
    try {
      result = await this.browser.hover(query, xpath);
    }
    catch (e) {
      result = e;
    }

    return { result };
  }

  async scrollTop ({ query, top }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    top = top || 0;

    const result  = await this.browser.scrollTop(query, top);

    return { result };
  }

  async contains({ selector, xpath, tabIndex }) {
    if (!selector) throw new Exception('Expected an Selector value', 400);

    return {
      result: await this.browser.contains(selector, xpath, tabIndex),
    }
  }

  async values ({ elements, xpath, tabIndex }) {
    if (!elements) throw new Exception('Expected an elements object', 400);

    const results = {};

    for (let key of Object.keys(elements)) {
      results[key] = await this.browser.getValues(elements[key], xpath, tabIndex);
    }

    return { results };
  }

  async scrollTo ({ query }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    const result = await this.browser.scrollTo(query);

    return { result };
  }

  async focus ({ query, xpath, tabIndex }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    const result = await this.browser.focus(query, xpath, tabIndex);

    return { result };
  }

  async type ({ inputs, delay, tabIndex }) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);
    delay = delay || 20;

    const queries = Object.keys(inputs);
    const results = {};

    for (let query of queries) {
      results[ query ] = await this.browser.type(query, inputs[ query ], { delay }, tabIndex);
    }

    return { results };
  }

  async fill ({ inputs }) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);

    const result = await this.run((inputs : { [key : string] : string }) => {
      try {
        for (let key in inputs) {
          const element : any = document.querySelector(key);
          element.value       = inputs[ key ];
        }

      }
      catch (e) {
        return e;
      }
    }, inputs);

    return { result };
  }

  async rightClick ({ query }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;

    try {
      const watch = await this.awaitPageLoad();
      result      = await this.browser.click(query);
      await watch();
    }
    catch (e) {
      result = e;
    }

    return { result };
  }
}
