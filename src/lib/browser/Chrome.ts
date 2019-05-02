import * as puppeteer from 'puppeteer';
import {
  Browser,
  ClickOptions,
  ElementHandle,
  EvaluateFn,
  NavigationOptions,
  Page,
  ScreenshotOptions,
} from 'puppeteer';
import { BehaviorSubject } from 'rxjs';

export class Chrome {


  async openNewTab () {
    const browser = await this.getBrowser();
    const page    = await browser.newPage();

    if (!page[PAGE_NAVIGATION_KEY]) {
      page[PAGE_NAVIGATION_KEY] = true;
      await page.evaluateOnNewDocument(name => {
        window.addEventListener('beforeunload', () => {
          if (window[name]) {
            window[name]();
          }
        });
      }, PAGE_NAVIGATION_EVENT)
        .catch(err => {
          console.error('OpenNewTab Method Error', err);
        });
    }

    await this.setViewport(page);
    const index = this.pagesSubject.length;
    this.pagesSubject.push(page);

    return index;
  }
}
