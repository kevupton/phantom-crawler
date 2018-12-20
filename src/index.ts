import { Application } from './App';
import 'babel-polyfill';
import { ArgumentParser } from 'argparse';
import { install } from 'source-map-support';

install();

function readArgs () {
  const parser = new ArgumentParser({
    version: '1.1.10',
    addHelp:true,
    description: 'Phantom Server'
  });

  parser.addArgument(
    [ '-H', '--host' ],
    {
      help: 'The host that the server should run on'
    }
  );

  parser.addArgument(
    [ '-P', '--port' ],
    {
      help: 'The port that the server should listen to'
    }
  );

  parser.addArgument(
    [ '--proxy' ],
    {
      help: 'The proxy server'
    }
  );

  parser.addArgument(
    [ '--debug' ],
    {
      help: 'The proxy server'
    }
  );

  return parser.parseArgs();
}

export function run(loadArgs = false) {
  Application.instantiate(loadArgs ? readArgs() : {});
}


