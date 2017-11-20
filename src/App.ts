import * as express from 'express';
import { routes } from './routes/index';
import { Router } from './system/Router';
import * as bodyParser from 'body-parser';

export class Application {
  app = express();

  constructor () {
    this.configure();
    this.loadRoutes();
    this.startServer();
  }

  configure () {
    this.app.use(bodyParser.json()); // support json encoded bodies
    this.app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  }

  loadRoutes () {
    routes(new Router(this.app));
  }

  startServer () {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => console.log(`SERVER RUNNING: localhost:${port}`));
  }
}

