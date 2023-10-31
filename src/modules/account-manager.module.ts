import { IAtomicService, IPluginUserData } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { PluginAuthGetters } from "@/store/page-overlay/modules/plugin-auth/consts";
import { debugLogFactory } from "@/utils/debug";
import { interval } from "rxjs";
import { apiKeyManager } from "./api-key-manager.module";
import { authManager } from "./auth-manager.module";

const debugLog = debugLogFactory("account-manager.module.ts");

class AccountManager implements IAtomicService {
  async init() {
    await authManager.authStateOrError();
  }

  private async maybeAuthenticate() {
    interval(60 * 1000).subscribe(async () => {
      const isAuthenticated = store.getters[`pluginAuth/${PluginAuthGetters.IS_AUTHENTICATED}`];
    });

    const credentials = store.state.credentials;

    if (!credentials) {
      debugLog(async () => ["credentials do not exist"]);
      return;
    }

    const { username, password } = JSON.parse(atob(credentials));
    if (!username || !password) {
      debugLog(async () => ["unable to extract credentials", { username, password }]);
    }
  }

  async pluginUserDataOrError(): Promise<IPluginUserData> {
    const authState = await authManager.authStateOrError();

    // const { metrcApiKey } = await apiKeyManager.apiKeyStateOrError();

    const pluginUserData: IPluginUserData = {
      metrcId: authState.identity,
      licenseNumber: authState.license,
      state: window.location.hostname,
      // apiKey: metrcApiKey,
    };

    return pluginUserData;
  }
}

export const accountManager = new AccountManager();
