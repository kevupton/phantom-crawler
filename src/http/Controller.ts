
import { Request, Response } from 'express';
import { HTTPRequest } from '../system/Request';
import { HTTPResponse } from '../system/Response';

export class Controller {

  constructor (
    protected request : HTTPRequest,
    protected response : HTTPResponse
  ) {

  }
}
