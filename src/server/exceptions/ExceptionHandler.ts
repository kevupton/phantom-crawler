import * as fs from 'fs';
import * as path from 'path';
import { environment } from '../../lib/Environment';
import { HTTPRequest } from '../HTTPRequest';
import { HTTPResponse } from '../HTTPResponse';
import { Exception } from './Exception';

export class ExceptionHandler {
  constructor (
    error : Exception,
    request : HTTPRequest,
    response : HTTPResponse,
  ) {
    console.error(`[ERROR]: Uncaught '${ error.name }': ${ error.message }`);
    response.error(error);

    if (environment.debug) {
      console.error(error);
    }

    fs.appendFileSync(path.join(process.cwd(), '/phantom-error.log'), `${ new Date() }\n${ error.stack }\n\n`);
  }
}
