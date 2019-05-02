import { Request } from 'express';

export class HTTPRequest {
  get body () {
    try {
      return JSON.parse(this.request.body);
    }
    catch (e) {
      return this.request.body;
    }
  }

  constructor (
    public request : Request
  ) {

  }
}
