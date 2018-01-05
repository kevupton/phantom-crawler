import * as express from 'express';
import { routes } from './routes';
import { Router } from './system/Router';
import * as bodyParser from 'body-parser';
import { Chrome } from './system/browser/Chrome';

export class Application {

  private app = express();
  private static _instance : Application = null;
  private _browser : Chrome = null;

  private constructor () {
    this.configure();
    this.loadRoutes();
    this.startServer();
  }

  static get instance () {
    return Application._instance || (Application._instance = new Application());
  }

  static instantiate () {
    return this.instance;
  }

  get browser () {
    return this._browser || (this._browser = Chrome.instance);
  }

  configure () {
    this.app.use(bodyParser.json()); // support json encoded bodies
    this.app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
  }

  loadRoutes () {
    routes(new Router(this.app, this));
  }

  startServer () {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => console.log(`SERVER RUNNING: localhost:${port}`));
  }
}

