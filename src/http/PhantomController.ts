import { Controller } from './Controller';

export class PhantomController extends Controller {
  active () {
    this.response.send([
      'test'
    ]);
  }
}


