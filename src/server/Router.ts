import { Express, Request, Response } from 'express';
import { environment } from '../lib/Environment';
import { Controller } from './Controller';
import { HTTPRequest } from './HTTPRequest';
import { HTTPResponse } from './HTTPResponse';
import { ExceptionHandler } from './exceptions/ExceptionHandler';
import { Exception } from './exceptions/Exception';

export class Router {
  constructor (
    private express : Express,
  ) {}

  /**
   * Get request
   *
   * @param path
   * @param controller
   * @param method
   */
  get (path, controller : typeof Controller, method?) {
    this.call('get', path, controller, method);
  }

  /**
   * Post request
   *
   * @param path
   * @param controller
   * @param method
   */
  post (path, controller : typeof Controller, method?) {
    this.call('post', path, controller, method);
  }

  private call (route, path, controller : typeof Controller, method?) {
    path = path.replace(/^\s*\/|\/\s*$/, '');
    if (!method) method = path.split('/')[0];

    this.express[route](`/${path}`, async (req : Request, res : Response) => {
      const request  = new HTTPRequest(req);
      const response = new HTTPResponse(res);

      if (environment.debug) {
        console.log(`[LOG] Received request for ${path}.`);
      }

      try {
        const ctrl = new controller(request, response);
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
