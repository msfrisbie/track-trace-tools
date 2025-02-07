import { AnalyticsEvent, MessageType, METRC_INDUSTRY_LICENSE_PATH_REGEX } from "@/consts";
import { IAtomicService, IAuthState } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import { version } from "@/modules/version";
import { debugLogFactory } from "@/utils/debug";
import { hasPlusImpl } from "@/utils/plus";

const hostname: string = window.location.hostname;
const path: string = window.location.pathname;
const url: string = window.location.href;

const debugLog = debugLogFactory("analytics-manager.module.ts");

interface IUserProperties {
  version?: string;
  hostname?: string;
  license?: string;
  email?: string;
  phoneNumber?: string;
  hasAccountPermissions?: boolean;
  verificationEligible?: boolean;
  totalFacilities?: number;
  facilities?: string;
  vuexBlobSize?: number;
  hasPlus?: boolean;
}

class AnalyticsManager implements IAtomicService {
  private authState: IAuthState | null = null;

  private identity: string | null = null;

  private userProperties: IUserProperties = {};

  async init() {}

  // This cannot depend on authManager, so pass the authstate
  // in when it becomes available
  setAuthState({ authState }: { authState: IAuthState }) {
    this.authState = authState;
  }

  async identify(identity: string) {
    this.identity = identity;
    messageBus.sendMessageToBackground(MessageType.SET_USER_ID, {
      identity,
    });
  }

  async setUserProperties(userProperties: IUserProperties) {
    const hasPlus = hasPlusImpl();

    this.userProperties = {
      ...this.userProperties,
      ...userProperties,
      hasPlus,
      version,
      hostname,
    };

    messageBus.sendMessageToBackground(MessageType.SET_USER_PROPERTIES, this.userProperties);
  }

  async page() {
    let pageName = path;
    let license = this.authState?.license;

    const match = path.match(METRC_INDUSTRY_LICENSE_PATH_REGEX);

    if (match) {
      if (!license) {
        license = match[1];
      }
      pageName = match[2];
    }

    let metrcVersion = null;
    try {
      const metrcFooter: HTMLElement | null = document.querySelector("#footer_center");

      const footerText = metrcFooter?.innerText;
      if (footerText) {
        const pieces = footerText.split("|");
        if (pieces.length === 2) {
          metrcVersion = pieces[1].trim();
        }
      }
    } catch (e) {}

    const pageData = {
      path,
      pageName,
      metrcVersion,
    };

    this.track(AnalyticsEvent.PAGELOAD, pageData);
  }

  async track(eventName: AnalyticsEvent, eventProperties: any = {}) {
    const license = this.authState?.license;

    eventProperties = {
      ...eventProperties,
      version,
      hostname,
      url,
      license,
    };

    debugLog(async () => [eventName, eventProperties]);

    messageBus.sendMessageToBackground(MessageType.LOG_ANALYTICS_EVENT, {
      eventName,
      eventProperties,
      userId: this.identity,
      userProperties: this.userProperties,
    });
  }
}

export const analyticsManager = new AnalyticsManager();
