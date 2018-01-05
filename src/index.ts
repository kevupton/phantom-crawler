import { Application } from './App';
import 'babel-polyfill';
import { ArgumentParser } from 'argparse';

const parser = new ArgumentParser({
  version: '1.1.2',
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

const args = parser.parseArgs();

Application.instantiate(args);
