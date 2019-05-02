const { browserManager, updateEnvironment } = require('../lib/app');
const { flatMap, tap } = require('rxjs/operators');

updateEnvironment({ debug: true });

browserManager.activeInstance$.pipe(
  flatMap(browser => browser.activePage$),
  flatMap(page => page.open('https://google.com')),
).subscribe(result => {
  console.log(result);
});
