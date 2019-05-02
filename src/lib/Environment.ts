import { camelCase } from 'lodash';

export function updateEnvironment(variables : any) {
  Object.keys(variables).forEach(key => {
    environment[camelCase(key)] = variables[key];
  });
}

interface Environment {
  host: string;
  port: string;
  debug: boolean;
  proxy?: string;
}

export const environment : Environment = {
  host: '127.0.0.1',
  port: '1001',
  debug: false,
};

// Assign the environment variables to the env
updateEnvironment(process.env);

