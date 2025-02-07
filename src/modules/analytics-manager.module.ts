import { AnalyticsEvent, MessageType, METRC_INDUSTRY_LICENSE_PATH_REGEX } from "@/consts";
import { IAtomicService, IAuthState } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import { version } from "@/modules/version";
import { debugLogFactory } from "@/utils/debug";

const hostname: string = window.location.hostname;
const path: string = window.location.pathname;
const url: string = window.location.href;

const debugLog = debugLogFactory("analytics-manager.module.ts");

interface IUserProperties {
  license?: string;
  email?: string;
  phoneNumber?: string;
  hasAccountPermissions?: boolean;
  verificationEligible?: boolean;
  totalFacilities?: number;
  facilities?: string;
  vuexBlobSize?: number;
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
    const mergedProperties = {
      ...userProperties,
      version,
      hostname,
      url,
    };

    this.userProperties = mergedProperties;

    messageBus.sendMessageToBackground(MessageType.SET_USER_PROPERTIES, mergedProperties);
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
      url,
      path,
      version,
      hostname,
      license,
      metrcVersion,
    };

    this.track(AnalyticsEvent.PAGELOAD, { eventName: `Visited ${pageName}`, eventData: pageData });

    // messageBus.sendMessageToBackground(MessageType.PAGELOAD, { pageName, pageData });
  }

  async track(eventName: AnalyticsEvent, eventData: any = {}) {
    const license = this.authState?.license;
    const identity = this.authState?.identity;

    eventData = {
      ...eventData,
      version,
      hostname,
      url,
      license,
      identity,
    };

    debugLog(async () => [eventName, eventData]);

    messageBus.sendMessageToBackground(MessageType.LOG_ANALYTICS_EVENT, {
      eventName,
      eventData,
      userId: this.identity,
      userProperties: this.userProperties,
    });
  }
}

export const analyticsManager = new AnalyticsManager();
