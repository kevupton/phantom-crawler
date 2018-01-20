import { Controller } from './Controller';
import { Exception } from '../exceptions/Exception';

export class DomController extends Controller {
  async click ({query}) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    let result : any = null;

    try {
      const watch = await this.awaitPageLoad();
      result = await this.browser.click(query);
      await watch();
    }
    catch (e) {
      result = e;
    }

    return {result};
  }

  async fill ({inputs}) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);

    const result = await this.run((inputs : {[key : string] : string}) => {
      try {
        for (let key in inputs) {
          const element : any = document.querySelector(key);
          element.value = inputs[key];
        }

      } catch (e) {
        return e;
      }
    }, inputs);

    return {result};
  }
}
