import { Controller } from './Controller';
import { Phantom } from '../system/browser/Phantom';
import { Exception } from '../exceptions/Exception';

export class PhantomController extends Controller {
  async active () {
    return {
      isActive: Phantom.instance.hasPage,
      url: await Phantom.instance.getProperty('url')
    };
  }

  async cookies () {
    return {
      cookies: await this.browser.page.cookies
    };
  }

  async display () {
    this.response.html(await this.browser.content);
  }

  async active_url () {
    return {url: this.browser.url || null};
  }

  async download () {
    this.response.file(await this.browser.content, 'content.html');
  }

  async get ({url}) {
    const {page} = await this.browser.open(url);
    return await page.content();
  }

  async headers ({headers}) {
    if (!headers) throw new Exception('Expected headers to be defined', 400);

    this.browser.headers(headers);
  }
}


