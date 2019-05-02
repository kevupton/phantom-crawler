import { Cookie, Response } from 'puppeteer';
import { Controller } from '../server/Controller';
import { Exception } from '../server/exceptions/Exception';

export class BrowserController extends Controller {
  async active () {
    return {
      isActive: Phantom.instance.hasPage,
      url: await Phantom.instance.getProperty('url'),
    };
  }

  async cookies () : Promise<{
    cookies : Cookie[]
  }> {
    return {
      cookies: await this.browser.activePage.cookies(),
    };
  }

  async reset () {
    return await this.browser.reset();
  }

  async back () : Promise<Response | null> {
    return await this.browser.activePage.goBack();
  }

  async display ({ index }) {
    this.response.html(await this.browser.getContent(index));
  }

  async active_url ({ index }) {
    return { url: this.browser.getUrl(index) || null };
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
    };
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

  async refresh ({ tabIndex, options }) {
    await this.browser.refresh(tabIndex, options);
  }

  async screenshot ({ tabIndex, options }) {
    const image = await this.browser.screenshot(tabIndex, options);
    return { image };
  }

  async get ({ url, tabIndex } : { url : string, tabIndex? : number }) {
    await this.browser.open(url, tabIndex);
    return await this.browser.getContent(tabIndex);
  }

  async goto ({ url, tabIndex }) {
    return await this.browser.open(url, tabIndex);
  }

  async headers ({ headers }) {
    if (!headers) throw new Exception('Expected headers to be defined', 400);

    this.browser.headers(headers);
  }
}


