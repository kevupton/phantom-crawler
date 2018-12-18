import * as fs from "fs";
import * as path from "path";
import { HTTPRequest } from '../system/HTTPRequest';
import { HTTPResponse } from '../system/HTTPResponse';

export class ExceptionHandler {
  constructor (
    private error : Error,
    private request : HTTPRequest,
    private response : HTTPResponse
  ) {
    console.error(`[ERROR]: Uncaught '${error.name}': ${error.message}`);
    response.error(error);

    if (process.env.DEBUG) {
      console.error(error);
    }

    fs.appendFileSync(path.join(process.cwd(), '/phantom-error.log'), `${new Date()}\n${error.stack}\n\n`);
  }
}
