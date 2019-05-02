import 'babel-polyfill';
import { install } from 'source-map-support';
import { updateEnvironment } from './lib/Environment';
import { parseArgs } from './lib/util/parseArgs';
import { Server } from './server/Server';

install();

export function startServer() {
  const server = new Server();
  server.startServer();
}

export function readArgs() {
  updateEnvironment(parseArgs());
}

// The next line defines the sourceMapping.
//# sourceMappingURL=app.js.map
