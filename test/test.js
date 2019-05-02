const { browserManager, updateEnvironment } = require('../lib/app');
const { flatMap, tap } = require('rxjs/operators');
const { combineLatest } = require('rxjs');
const fs = require('fs');
const path = require('path');

// const content = fs.readFileSync(path.join(__dirname, './test.html'), 'utf-8');

updateEnvironment({ debug: true });

browserManager.activeInstance$.pipe(
  flatMap(browser => browser.activePage$),
  flatMap(page => combineLatest([
    page.open('https://www.agtrader.com.au'),
    page.awaitPageLoad(),
  ]).pipe(
    flatMap(() => page.getContent()),
  )),
  // flatMap(() => browserManager.activeInstance$),
  // flatMap(browser => browser.openNewTab()),
  // flatMap(page => page.open('https://www.google.com').pipe(
  //   flatMap(() => combineLatest([
  //       page.setContent(content),
  //       page.awaitPageLoad(),
  //     ])
  //   ))),
).subscribe(content => {
  fs.writeFileSync(path.join(__dirname, './output.html'), content);
});
