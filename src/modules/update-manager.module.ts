import { MessageType } from '@/consts';
import { IAtomicService } from '@/interfaces';
import { version } from '@/modules/version';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import { analyticsManager } from './analytics-manager.module';

class UpdateManager implements IAtomicService {
  async init() {
    if (!!store.state.currentVersion && store.state.currentVersion !== version) {
      this.handleUpdate();
    }

    store.commit(MutationType.SET_CURRENT_VERSION, version);
  }

  private handleUpdate() {
    console.log(`Updated to version ${version}`);

    analyticsManager.track(MessageType.UPDATED_VERSION, { version });
  }
}

export const updateManager = new UpdateManager();
