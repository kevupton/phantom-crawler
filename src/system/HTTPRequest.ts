
import { Request } from 'express';

export class HTTPRequest {
  constructor (
    public request : Request
  ) {

  }

  get body () {
    try {
      return JSON.parse(this.request.body);
    }
    catch (e) {
      return this.request.body;
    }
  }
}
