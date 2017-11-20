import { Express } from 'express';
import { Controller } from '../http/Controller';
import { HTTPRequest } from './Request';
import { HTTPResponse } from './Response';

export class Router {
  constructor (
    private app : Express
  ) {}

  get (path, controller : typeof Controller, method) {
    this.app.get(path, (req, res) => {
      const ctrl = new controller(new HTTPRequest(req), new HTTPResponse(res));
      if (typeof ctrl[method] === 'function') {
        ctrl[method]();
      }
      else {
        res.send('no propert');
      }

    });
  }
}
