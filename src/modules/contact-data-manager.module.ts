import { MessageType } from "@/consts";
import { IAtomicService } from "@/interfaces";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { extract, ExtractionType } from "@/utils/html";
import { analyticsManager } from "./analytics-manager.module";
import { authManager } from "./auth-manager.module";
import { primaryMetrcRequestManager } from "./metrc-request-manager.module";

// 30 seconds
const CONTACT_DATA_FETCH_INTERVAL_MS = 1000 * 30;

class ContactDataManager implements IAtomicService {
  async init() {
    await authManager.authStateOrError();

    const now = Date.now();

    if (
      !!store.state.contactData &&
      now - store.state.contactData.lastSuccessfulContactDataFetch < CONTACT_DATA_FETCH_INTERVAL_MS
    ) {
      console.log("User data is up to date");
      return;
    }

    let email = null;
    let phoneNumber = null;

    const response = await primaryMetrcRequestManager.getUserProfileHTML();
    const html: string = await response.data;

    const extractedData = extract(ExtractionType.CONTACT_DATA, html);

    if (extractedData && extractedData.contactData) {
      ({ email, phoneNumber } = extractedData.contactData);
    }

    if (!!email || !!phoneNumber) {
      store.commit(MutationType.SET_CONTACT_DATA, {
        email,
        phoneNumber,
        lastSuccessfulContactDataFetch: now,
      });

      analyticsManager.setUserProperties({
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
      });

      // messageBus.sendMessageToBackground(
      //     MessageType.UPDATE_UNINSTALL_URL, {
      //     email
      // });
    } else {
      analyticsManager.track(MessageType.CONTACT_DATA_PARSE_ERROR);
    }
  }
}

export const contactDataManager = new ContactDataManager();
