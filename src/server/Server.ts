import * as bodyParser from 'body-parser';
import * as express from 'express';
import { BrowserManager } from '../browser/BrowserManager';
import { routes } from './routes';
import { Router } from './Router';

export class Server {
  private readonly server = express();

  constructor (
    private readonly browserManager : BrowserManager,
  ) {
    this.configure();
    this.loadRoutes();
  }

  private configure () {
    this.server.use(bodyParser.json()); // support json encoded bodies
    this.server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  }

  private loadRoutes () {
    routes(new Router(this.server, this.browserManager));
  }

  startServer () {
    const port = parseInt(process.env.PORT, 10) || 3000;
    const host = process.env.HOST || 'localhost';
    this.server.listen(port, host, () => console.log(`SERVER RUNNING: ${ host }:${ port }`));
  }
}
