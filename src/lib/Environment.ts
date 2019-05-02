import { camelCase } from 'lodash';
import { BrowserType } from '../browser/Browser';

export function updateEnvironment(variables : Environment) {
  Object.keys(variables).forEach(key => {
    environment[camelCase(key)] = variables[key];
  });
}

interface Environment {
  browserType : BrowserType;
  host: string;
  port: string;
  debug: boolean;
  proxy?: string;
}

export const environment : Environment = {
  host: '127.0.0.1',
  port: '1001',
  debug: false,
  browserType: BrowserType.Chrome,
};

// Assign the environment variables to the env
updateEnvironment(<any>process.env);

