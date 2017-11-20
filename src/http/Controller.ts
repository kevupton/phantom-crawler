
import { Request, Response } from 'express';
import { HTTPRequest } from '../system/HTTPRequest';
import { HTTPResponse } from '../system/HTTPResponse';

export class Controller {

  constructor (
    protected request : HTTPRequest,
    protected response : HTTPResponse
  ) {

  }
}
