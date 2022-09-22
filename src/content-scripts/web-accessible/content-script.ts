import Vue from "vue";
import { analyticsManager } from "~/src/modules/analytics-manager.module";
import { authManager } from "~/src/modules/auth-manager.module";
import { isDevelopment } from "~/src/modules/environment.module";
import { messageBus } from "~/src/modules/message-bus.module";
import { storageManager } from "~/src/modules/storage-manager.module";
import { tabManager } from "~/src/modules/tab-manager.module";
import { DISALLOWED_HOSTNAMES, TTT_ROOT_ELEMENT_SELECTOR } from "../../consts";
import { renderFacilityPicker } from "./facility-picker";
import { renderOverlayWidget } from "./overlay-widget";
import { renderTTTOverlay } from "./ttt-overlay";
import { renderUnifiedSearch } from "./unified-search";

console.log("Loaded TTT");

storageManager.init();

messageBus.init();
tabManager.init();

async function initializeTooklit() {
  if (DISALLOWED_HOSTNAMES.includes(window.location.hostname)) {
    console.info(
      `The hostname '${window.location.hostname}' matches the disallow list, declining to render TTT`
    );
    return;
  }

  if (!!document.querySelector(TTT_ROOT_ELEMENT_SELECTOR)) {
    console.error("Metrc toolkit already exists on page");
    return;
  }

  Vue.config.productionTip = isDevelopment();

  renderTTTOverlay();
  renderOverlayWidget();

  // Everything past here should only render if authenticated
  try {
    await authManager.authStateOrError();
  } catch (e) {
    return;
  } finally {
    analyticsManager.page();
  }

  renderUnifiedSearch();
  renderFacilityPicker();
}

initializeTooklit();
