import { Controller } from './Controller';
import { Phantom } from '../system/Phantom';

export class PhantomController extends Controller {
  async active () {
    return {
      isActive: Phantom.instance.hasPage,
      url: await Phantom.instance.getProperty('url')
    };
  }

  async get ({url}) {
    const {page} = await Phantom.instance.open(url);
    return await page.property('content');
  }

  async cookies () {
    return {
      cookies: await Phantom.instance.getProperty('cookies', null)
    };
  }

  async setCookies (params, body) {
    return body;
  }
}


