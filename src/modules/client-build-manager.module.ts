import { clientConfig } from "@/client/config";
import { IAtomicService, IClientConfig } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { ClientActions } from "@/store/page-overlay/modules/client/consts";

class ClientBuildManager implements IAtomicService {
  private _clientConfig: IClientConfig | null = null;

  async init() {
    this.loadClientConfig();
  }

  get clientConfig() {
    return this._clientConfig;
  }

  async loadClientConfig() {
    this._clientConfig = Object.freeze(clientConfig());

    store.dispatch(`client/${ClientActions.LOAD_CLIENT_VALUES}`);
  }

  assertValues(keys: string[]): boolean {
    if (!this._clientConfig?.values) {
      return false;
    }

    for (const key of keys) {
      if (!this._clientConfig.values[key]) {
        return false;
      }
    }
    return true;
  }

  validateAndGetValuesOrError(keys: string[]): { [key: string]: any } {
    if (!clientBuildManager.clientConfig?.values) {
      throw new Error("Missing values");
    }

    if (!this.assertValues(keys)) {
      throw new Error("Missing keys");
    }

    return clientBuildManager.clientConfig.values;
  }
}

export let clientBuildManager = new ClientBuildManager();
