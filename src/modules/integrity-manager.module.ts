import { MessageType } from '@/consts';
import { IAtomicService } from '@/interfaces';
import { analyticsManager } from './analytics-manager.module';
import { authManager } from './auth-manager.module';

// Checks for plugin health
class IntegrityManager implements IAtomicService {
  async init() {
    if (window.location.href.includes('/packages')) {
      try {
        await authManager.authStateOrError();
      } catch (e) {
        analyticsManager.track(MessageType.INTEGRITY_ERROR, {
          context: 'Auth state failed on a path including /packages'
        });
      }
    }
  }
}

export const integrityManager = new IntegrityManager();
