import { HTTPRequest } from '../system/HTTPRequest';
import { HTTPResponse } from '../system/HTTPResponse';

export class ExceptionHandler {
  constructor (
    private error : Error,
    private request : HTTPRequest,
    private response : HTTPResponse
  ) {
    console.error(`[ERROR]: Uncaught '${error.name}': ${error.message}`);
    console.error(error);
    response.error(error);
  }
}
