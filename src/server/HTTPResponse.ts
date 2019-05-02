import { Response } from 'express';
import { Exception } from './exceptions/Exception';

export class HTTPResponse {
  responseObj = {
    status_code: 200
  };

  private _sent = false;

  constructor (
    private response : Response
  ) {}

  error (error : any) {
    const obj : any = {
      status_code: 500,
      error_message: `Uncaught '${error.name}': ${error.message}`
    };
    if (error instanceof Exception) {
      obj.status_code = error.code;
    }
    if (process.env.APP_ENV !== 'production') {
      obj.stack_trace = error.stack;
    }
    this._send(obj);
  }

  file (content : string, name : string) {
    if (this._sent) return;
    this._sent = true;
    this.response.set({'Content-Disposition': `attachment; filename="${name}"`});
    this.response.send(content);
  }

  html (content : string) {
    if (this._sent) return;
    this._sent = true;
    this.response.set({'Content-Type': 'text/html'});
    this.response.send(content);
  }

  send (data : any) {
    this._send({data});
  }

  private _makeResponse (obj : any) {
    return Object.assign({}, this.responseObj, obj);
  }

  private _send (obj : any) {
    if (this._sent) return;
    this._sent = true;
    this.response.status(obj.status_code || 200);
    this.response.header({'Content-type': 'application/json'});
    this.response.send(JSON.stringify(this._makeResponse(obj)));
  }
}
