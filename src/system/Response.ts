
import { Response } from 'express';

export class HTTPResponse {
  responseObj = {
    status: 200,
    data: null
  };

  constructor (
    private response : Response
  ) {}

  send (data) {
    this.response.send(JSON.stringify(Object.assign({}, this.responseObj, {data})));
  }
}
