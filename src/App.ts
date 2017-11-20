import * as express from 'express';
import { routes } from './routes/index';
import { Router } from './system/Router';

export class Application {
  app = express();

  constructor () {
    this.loadRoutes();
    this.startServer();
  }

  loadRoutes () {
    routes(new Router(this.app));
  }

  startServer () {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => console.log(`SERVER RUNNING: localhost:${port}`));
  }
}
