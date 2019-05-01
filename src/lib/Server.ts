import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Application } from '../App';
import { routes } from '../routes';
import { Router } from './routing/Router';

export class Server {
  private readonly server = express();

  constructor (
    private readonly app : Application,
  ) {
    this.configure();
    this.loadRoutes();
  }

  configure () {
    this.server.use(bodyParser.json()); // support json encoded bodies
    this.server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  }

  loadRoutes () {
    routes(new Router(this.server, this.app));
  }

  startServer () {
    const port = parseInt(process.env.PORT, 10) || 3000;
    const host = process.env.HOST || 'localhost';
    this.server.listen(port, host, () => console.log(`SERVER RUNNING: ${ host }:${ port }`));
  }
}
