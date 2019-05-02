import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';

export class Controller {
  constructor (
    protected readonly request : HTTPRequest,
    protected readonly response : HTTPResponse,
  ) {
  }

  destructor() {

  }
}
