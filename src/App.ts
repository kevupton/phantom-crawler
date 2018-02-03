import * as express from 'express';
import { routes } from './routes';
import { Router } from './system/Router';
import * as bodyParser from 'body-parser';
import { Chrome } from './system/browser/Chrome';

export class Application {

  private app = express();
  private static _instance : Application = null;
  private _browser : Chrome = null;

  private constructor (
    private config
  ) {
    Object.keys(config).forEach(key => {
      if (config[key]) {
        process.env[key.toUpperCase()] = config[key]
      }
    });

    this.configure();
    this.loadRoutes();
    this.startServer();
  }

  static get instance () {
    return Application._instance;
  }

  static instantiate (config) {
    return Application._instance = new Application(config);
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
    const port = parseInt(process.env.PORT, 10) || 3000;
    const host = process.env.HOST || 'localhost';
    this.app.listen(port, host, () => console.log(`SERVER RUNNING: ${host}:${port}`));
  }
}

