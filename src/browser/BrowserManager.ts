import { environment } from '../lib/Environment';
import { Browser } from './Browser';
import { Manager, NewInstanceConfig } from './Manager';

export class BrowserManager extends Manager<Browser> {
  protected generateNewInstanceConfig () : NewInstanceConfig<Browser> {
    return {
      instance: new Browser(environment.browserType),
    };
  }
}
