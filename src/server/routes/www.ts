import { BrowserController } from '../../http/BrowserController';
import { Router } from '../Router';
import { PageController } from '../../http/PageController';

export function www (router : Router) {
  router.get('active', BrowserController);
  router.get('active_url', BrowserController);
  router.get('active_url/:index', BrowserController);
  router.get('cookies', BrowserController);
  router.get('download', BrowserController);
  router.get('display/:index', BrowserController);
  router.get('display', BrowserController);
  router.get('back', BrowserController);
  router.get('get/:url', BrowserController);
  router.get('getTabs', BrowserController);
  router.post('headers', BrowserController);
  router.post('goto', BrowserController);
  router.post('setActiveTab', BrowserController);
  router.post('openNewTab', BrowserController);
  router.post('closeTab', BrowserController);
  router.post('reset', BrowserController);
  router.post('screenshot', BrowserController);
  router.post('refresh', BrowserController);

  // Dom manipulation
  router.post('contains', PageController);
  router.post('values', PageController);
  router.post('click', PageController);
  router.post('fill', PageController);
  router.post('type', PageController);
  router.post('hover', PageController);
  router.post('scrollTo', PageController);
  router.post('scrollTop', PageController);
  router.post('focus', PageController);
}
