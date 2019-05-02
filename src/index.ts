import 'babel-polyfill';
import { install } from 'source-map-support';
import { BrowserManager } from './browser/BrowserManager';
import { updateEnvironment } from './lib/Environment';
import { parseArgs } from './lib/util/parseArgs';
import { Server } from './server/Server';

install();

export function startServer() {
  const browserManager = new BrowserManager();

  const server = new Server(browserManager);
  server.startServer();
}

export function readArgs() {
  updateEnvironment(parseArgs());
}

// The next line defines the sourceMapping.
//# sourceMappingURL=app.js.map
