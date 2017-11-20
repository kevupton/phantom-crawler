import { Controller } from './Controller';
import { Phantom } from '../system/Phantom';

export class PhantomController extends Controller {
  async active () {
    const page = Phantom.instance.page;

    const response = {
      isActive: !!page,
      url: null
    };

    if (page) {
      response.url = await page.property('url');
    }

    return response;
  }

  async get ({url}) {
    const {page, status} = await Phantom.instance.open(url);
    return await page.property('content');
  }
}


