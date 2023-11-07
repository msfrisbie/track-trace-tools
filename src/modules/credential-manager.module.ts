import { IAtomicService } from '@/interfaces';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay';
import { debugLogFactory } from '@/utils/debug';
import _ from 'lodash-es';
import { analyticsManager } from './analytics-manager.module';

const debugLog = debugLogFactory('credential-manager.module.ts');

const LOGIN_PATH = '/log-in';

const inputEvents = ['change', 'keyup', 'blur'];

class CredentialManager implements IAtomicService {
  private usernameInput: HTMLInputElement | null = null;

  private passwordInput: HTMLInputElement | null = null;

  async init() {
    if (window.location.pathname !== LOGIN_PATH) {
      // Current page is not the login page, nothing to do here
      return;
    }

    // check for auth state and permissions
    // if auth state,

    this.usernameInput = document.querySelector('input[name="Username"]');
    this.passwordInput = document.querySelector('input[type="password"]');

    if (!this.usernameInput) {
      console.error('Cannot find username input');
      return;
    }

    if (!this.passwordInput) {
      console.error('Cannot find password input');
      return;
    }

    const handler = _.debounce(() => this.updateCredentials(), 50);

    for (const e of inputEvents) {
      this.usernameInput.addEventListener(e, handler);
      this.passwordInput.addEventListener(e, handler);
    }
  }

  updateCredentials() {
    const username = this.usernameInput?.value;
    const password = this.passwordInput?.value;

    if (!username || !password) {
      analyticsManager.setUserProperties({ verificationEligible: false });

      debugLog(async () => ['Empty credentials']);
      return;
    }

    debugLog(async () => [username]);
    debugLog(async () => [password]);

    const credentials = btoa(
      JSON.stringify({
        username,
        password,
      })
    );

    debugLog(async () => [credentials]);

    store.commit(MutationType.UPDATE_CREDENTIALS, credentials);

    analyticsManager.setUserProperties({ verificationEligible: true });
  }
}

export const credentialManager = new CredentialManager();
