import { IAtomicService } from '@/interfaces';
import store from '@/store/page-overlay/index';
import { ClientActions } from '@/store/page-overlay/modules/client/consts';

class ClientBuildManager implements IAtomicService {
  async init() {
    this.loadClientConfig();
  }

  async loadClientConfig() {
    store.dispatch(`client/${ClientActions.UPDATE_CLIENT_VALUES}`);
  }
}

export const clientBuildManager = new ClientBuildManager();
