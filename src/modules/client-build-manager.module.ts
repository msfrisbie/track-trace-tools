import { clientConfig } from "@/client/config";
import { IAtomicService, IClientConfig } from "@/interfaces";

class ClientBuildManager implements IAtomicService {
  private _clientConfig: IClientConfig | null = null;

  async init() {
    this._clientConfig = Object.freeze(await clientConfig());
  }

  get clientConfig() {
    return this._clientConfig;
  }
}

export let clientBuildManager = new ClientBuildManager();
