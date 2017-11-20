import { PhantomController } from '../http/PhantomController';
import { Router } from '../system/Router';

export function www (router : Router) {
  router.get('/active', PhantomController, 'active');
}
