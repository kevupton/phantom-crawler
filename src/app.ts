import * as express from 'express';
import { loadRoutes } from './routes/index';

class Application {
  app = express();

  constructor () {
    const port = process.env.PORT || 3000;

    loadRoutes(this.app);

    this.app.listen(port, () => console.log(`SERVER RUNNING: localhost:${port}`));
  }
}

new Application();
