import { Express, Request, Response } from 'express';
import { Controller } from '../http/Controller';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';
import { ExceptionHandler } from '../exceptions/ExceptionHandler';
import { Exception } from '../exceptions/Exception';
import { Application } from '../App';

export class Router {
  constructor (
    private express : Express,
    private _app : Application
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

    this.express[route](`/${path}`, async (req : Request, res : Response) => {
      const request  = new HTTPRequest(req);
      const response = new HTTPResponse(res);

      if (this._app.isDebug) {
        console.log(`[LOG] Received request for ${path}.`);
      }

      try {
        const ctrl = new controller(request, response, this._app);
        let error  = null;

        if (typeof ctrl[method] === 'function') {
          try {
            const data = await ctrl[method](Object.assign(req.query, req.params, request.body));
            response.send(data || null);
          }
          catch (e) {
            error = e;
          }
        }
        else {
          throw new Exception(`${method} does not exist on Controller`);
        }

        ctrl.destructor();
        if (error) throw error;
      }
      catch (e) {
        new ExceptionHandler(e, request, response);
      }
    });
  }
}
