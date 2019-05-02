import { ArgumentParser } from 'argparse';

export function parseArgs () {
  const parser = new ArgumentParser({
    version: '2.0.0',
    addHelp:true,
    description: 'Headless Browser'
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
