import { Controller } from './Controller';
import { Exception } from '../exceptions/Exception';

export class DomController extends Controller {
  async click ({query}) {
    if (!query) throw new Exception('Expected query to be defined', 400);

    const fn = await this.awaitPageLoads();
    const result = await this.run(`function () {
      try {
      
        var element = document.querySelector('${query}');
        
        if (element) {
          element.click();
          return true;
        }
        
        return false;
        
      } catch (e) {
        return e;
      }
    }`);

    await fn();

    return {result};
  }

  async fill ({inputs}) {
    if (!inputs) throw new Exception('Expected inputs to be defined', 400);

    const result = await this.run(`function () {
      try {
        var inputs = ${JSON.stringify(inputs)};

        for (var key in inputs) {
          var element = document.querySelector(key);
          element.value = inputs[key];
        }

      } catch (e) {
        return e;
      }
    }`);

    return {result};
  }
}
