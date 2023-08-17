import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { ClientActions } from "@/store/page-overlay/modules/client/consts";

class ClientBuildManager implements IAtomicService {
  async init() {
    this.loadClientConfig();
  }

  async loadClientConfig() {
    store.dispatch(`client/${ClientActions.LOAD_CLIENT_VALUES}`);
  }

  assertValues(keys: string[]): boolean {
    if (!store.state.client.values) {
      return false;
    }

    for (const key of keys) {
      if (!store.state.client.values[key]) {
        return false;
      }
    }
    return true;
  }

  validateAndGetValuesOrError(keys: string[]): { [key: string]: any } {
    if (!store.state.client.values) {
      throw new Error("Missing values");
    }

    if (!this.assertValues(keys)) {
      throw new Error("Missing keys");
    }

    return store.state.client.values;
  }
}

export let clientBuildManager = new ClientBuildManager();
