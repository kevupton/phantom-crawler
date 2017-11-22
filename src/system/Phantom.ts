import * as phantom from 'phantom';
import { PhantomJS, WebPage } from 'phantom';

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
    this._promise = (<any>phantom).create(
      ['--ignore-ssl-errors=yes', '--load-images=no', '--ssl-protocol=any', '--web-security=no'],
      {logLevel: 'error'}
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
      await this._page.property('viewportSize', {width: 1800, height: 1200});
    }

    await (<any>this._page).invokeMethod('clearMemoryCache');
    const status = await this._page.open(url);

    if (status !== 'success') throw new Error(`${status}: Unable to load WebPage`);

    return {status, page: this._page};
  }

  run<R> (fn : any) {
    return this._page && this._page.evaluate<R>(fn);
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
