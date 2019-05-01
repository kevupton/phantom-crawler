import * as phantom from 'Phantom';
import { PhantomJS, WebPage } from 'Phantom';

export class Phantom {

  private static _instance = null;

  static get instance () : Phantom {
    return this._instance || (this._instance = new Phantom());
  }

  private _promise : Promise<PhantomJS>;
  private _page : WebPage;

  get page () {
    return this._page;
  }

  get hasPage () {
    return !!this._page;
  }

  private constructor () {
    if (process.env.DEBUG) {
      console.info('[DEBUG] Running phantom in debug mode')
    }
    this._promise = (<any>phantom).create(
      ['--load-images=yes', '--ssl-protocol=any'].concat(process.env.DEBUG ? '--remote-debugger-port=9000' : []),
      {logLevel: 'info'}
    );
  }

  getProperty (property : string, defaultValue? : any) {
    return this._page && this._page.property(property) || defaultValue;
  }

  off (eventName : string, fn : Function) : Promise<any> {
    return this._page && (<any>this._page).off(eventName, fn);
  }

  on (eventName : string, fn : Function) : Promise<any> {
    return this._page && (<any>this._page).on(eventName, fn);
  }

  async open (url : string) : Promise<{ status : string, page : WebPage }> {
    if (!this.hasPage) {
      const instance : PhantomJS = await this._promise;
      this._page                 = await instance.createPage();

      await this._page.setting('userAgent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36');
      await this._page.property('viewportSize', {width: 1800, height: 1200});
      await this._page.setting('clearMemoryCaches', true);
    }

    await (<any>this._page).invokeMethod('clearMemoryCache');
    const status = await this._page.open(url);

    if (status !== 'success') throw new Error(`${status}: Unable to load WebPage`);

    return {status, page: this._page};
  }

  run<R> (fn : any) {
    return this._page && this._page.evaluate<R>(fn);
  }

  setProperty (key : string, value : any) {
    this._page && this.page.property(key, value);
  }
}

//
// (async function () {
//
//   if (status !== 'success') {
//     console.log(status + ': unable to load page');
//   }
//   else {
//     let timeout = false;
//     let timeoutId = setTimeout(() => {
//       timeout = true;
//     }, 5000);
//
//     const content = await waitForID('channel_panels_contain');
//
//     clearTimeout(timeoutId);
//
//     function waitForID (id) {
//       const deferred = Promise.defer();
//
//       wait();
//
//       function wait () {
//         if (timeout) {
//           deferred.resolve('');
//           return;
//         }
//
//         setTimeout(function () {
//           page.evaluateJavaScript(`function () {
//                         const element = document.getElementById('${id}');
//                         return element ? element.innerHTML : null;
//                     }`)
//             .then(content => {
//               if (content) deferred.resolve(content);
//               else wait();
//             });
//         });
//       }
//
//       return deferred.promise;
//     }
//
//     // const content = await page.property('content');
//     if (content.indexOf(key) !== -1) {
//       console.log('SUCCESS');
//     }
//     else {
//       console.log('FAILED');
//     }
//   }
//
//   await instance.exit();
// }());
