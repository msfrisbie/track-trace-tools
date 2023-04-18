import { IClientConfig } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { getMatchingDecryptedDataOrNull } from "@/utils/encryption";

export function clientConfig(): IClientConfig | null {
  if (!store.state.settings) {
    return null;
  }

  return getMatchingDecryptedDataOrNull(store.state.settings.licenseKey);
}
