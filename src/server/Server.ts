import * as bodyParser from 'body-parser';
import express from 'express';
import { BrowserManager } from '../browser/BrowserManager';
import { environment } from '../lib/Environment';
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
    const port = parseInt(environment.port, 10) || 3000;
    const host = environment.host;
    this.server.listen(port, host, () => console.log(`SERVER RUNNING: ${ host }:${ port }`));
  }
}
