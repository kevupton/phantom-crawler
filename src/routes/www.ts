import { PhantomController } from '../http/PhantomController';
import { Router } from '../system/Router';

export function www (router : Router) {
  router.get('active', PhantomController);
  router.get('cookies', PhantomController);
  router.post('cookies', PhantomController, 'setCookies');
  router.get('get/:url', PhantomController, 'get');
}
