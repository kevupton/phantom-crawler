import { Exception } from '../exceptions/Exception';
import { Phantom } from '../system/browser/Phantom';
import { Controller } from './Controller';

export class PhantomController extends Controller {
  async active () {
    return {
      isActive: Phantom.instance.hasPage,
      url: await Phantom.instance.getProperty('url'),
    };
  }

  async cookies () {
    return {
      cookies: await this.browser.page.cookies,
    };
  }

  async back () {
    return await this.browser.page.goBack();
  }

  async display () {
    this.response.html(await this.browser.content);
  }

  async active_url () {
    return { url: this.browser.url || null };
  }

  async download () {
    this.response.file(await this.browser.content, 'content.html');
  }

  async getTabs () {
    return {
      pages: this.browser.pages.map((page, index) => ({
        index,
        page: page.url(),
      })),
    }
  }

  async setActiveTab ({ index }) {
    await this.browser.setActiveTab(index);
  }

  async closeTab ({ index }) {
    await this.browser.closeTabIndex(index);
  }

  async openNewTab ({ url }) {
    const index = await this.browser.openNewTab();
    await this.browser.setActiveTab(index);

    if (url) {
      return await this.get({ url });
    }
  }

  async get ({ url }) {
    const { page } = await this.browser.open(url);
    return await page.content();
  }

  async headers ({ headers }) {
    if (!headers) throw new Exception('Expected headers to be defined', 400);

    this.browser.headers(headers);
  }
}


