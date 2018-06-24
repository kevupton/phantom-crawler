import { Controller } from './Controller';
import { Exception } from '../exceptions/Exception';

export class DomController extends Controller {
  async click ({query, button, xpath}) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;

    button = button || 'left';
    if (!['left', 'right', 'middle'].includes(button)) {
      throw new Exception('Invalid button type. Expected left, right or middle', 400);
    }

    try {
      const watch = await this.awaitPageLoad();
      result = await this.browser.click(query, {button}, xpath);
      await watch();
    }
    catch (e) {
      result = e;
    }

    return {result};
  }

  async hover ({query, xpath}) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;
    try {
      result = await this.browser.hover(query, xpath);
    }
    catch (e) {
      result = e;
    }

    return {result};
  }

  async scrollTo ({ query }) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    await this.browser.scrollTo(query);
  }

  async type ({inputs, delay}) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);
    delay = delay || 20;

    const queries = Object.keys(inputs);
    const results = {};

    for (let query of queries) {
      results[query] = await this.browser.type(query, inputs[query], {delay});
    }

    return {results};
  }

  async fill ({inputs}) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);

    const result = await this.run((inputs : { [key : string] : string }) => {
      try {
        for (let key in inputs) {
          const element : any = document.querySelector(key);
          element.value       = inputs[key];
        }

      }
      catch (e) {
        return e;
      }
    }, inputs);

    return {result};
  }

  async rightClick ({query}) {
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

    return {result};
  }
}
