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

  async download () {
    this.response.file(await Phantom.instance.getProperty('content'), 'content.html');
  }

  async display () {
    this.response.html(await Phantom.instance.getProperty('content'));
  }
}


