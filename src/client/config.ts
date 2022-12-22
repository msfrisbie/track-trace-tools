import { IClientConfig } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { getMatchingDecryptedDataOrNull } from "@/utils/encryption";

export async function clientConfig(): Promise<IClientConfig | null> {
  return getMatchingDecryptedDataOrNull(store.state.settings?.licenseKey);
}
