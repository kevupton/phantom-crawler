import { Express, Request, Response } from 'express';
import { Controller } from '../http/Controller';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';
import { ExceptionHandler } from '../exceptions/ExceptionHandler';
import { Exception } from '../exceptions/Exception';

export class Router {
  constructor (
    private app : Express
  ) {}

  get (path, controller : typeof Controller, method?) {
    this.call('get', path, controller, method);
  }

  post (path, controller : typeof Controller, method?) {
    this.call('post', path, controller, method);
  }

  private call (route, path, controller : typeof Controller, method?) {
    path = path.replace(/^\s*\/|\/\s*$/, '');
    if (!method) method = path;

    this.app[route](`/${path}`, async (req : Request, res : Response) => {
      const request = new HTTPRequest(req);
      const response = new HTTPResponse(res);
      try {
        const ctrl = new controller(request, response);
        if (typeof ctrl[method] === 'function') {
          const data = await ctrl[method](Object.assign(req.query, req.params, request.body));
          response.send(data || null);
        }
        else {
          throw new Exception(`${method} does not exist on Controller`);
        }
      }
      catch (e) {
        new ExceptionHandler(e, request, response);
      }
    });
  }
}
