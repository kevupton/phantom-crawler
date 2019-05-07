import { camelCase } from 'lodash';
import { BrowserType } from '../browser/Browser';

export function updateEnvironment(variables : Partial<Environment>) {
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
  headless: boolean;
}

export const environment : Readonly<Environment> = {
  appEnv: 'development',
  host: 'localhost',
  port: '1001',
  debug: false,
  browserType: BrowserType.Chrome,
  headless: true,
};

// Assign the environment variables to the env
updateEnvironment(<any>process.env);
