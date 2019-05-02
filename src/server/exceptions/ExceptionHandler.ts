import * as fs from 'fs';
import * as path from 'path';
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

    if (process.env.DEBUG) {
      console.error(error);
    }

    fs.appendFileSync(path.join(process.cwd(), '/phantom-error.log'), `${ new Date() }\n${ error.stack }\n\n`);
  }
}
