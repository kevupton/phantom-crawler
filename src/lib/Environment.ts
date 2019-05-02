import { camelCase } from 'lodash';
import { BrowserType } from '../browser/Browser';

export function updateEnvironment(variables : Environment) {
  Object.keys(variables).forEach(key => {
    environment[camelCase(key)] = variables[key];
  });
}

interface Environment {
  appEnv: string;
  browserType : BrowserType;
  host: string;
  port: string;
  debug: boolean;
  proxy?: string;
  openBrowser?: boolean;
}

export const environment : Environment = {
  appEnv: 'development',
  host: 'localhost',
  port: '1001',
  debug: false,
  browserType: BrowserType.Chrome,
};

// Assign the environment variables to the env
updateEnvironment(<any>process.env);

