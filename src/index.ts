import 'source-map-support/register';
import { BrowserManager } from './browser/BrowserManager';
import { updateEnvironment } from './lib/Environment';
import { parseArgs } from './lib/util/parseArgs';
import { Server } from './server/Server';
export { updateEnvironment } from './lib/Environment'

export const browserManager = new BrowserManager();

export function startServer() {
  const server = new Server(browserManager);
  server.startServer();
}

export function readArgs() {
  updateEnvironment(parseArgs());
}

// The next line defines the sourceMapping.
//# sourceMappingURL=app.js.map
