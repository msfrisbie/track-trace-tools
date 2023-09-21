import OverlayWidget from "@/components/overlay-widget/OverlayWidget.vue";
import FloatingFacilityPicker from "@/components/page-overlay/FloatingFacilityPicker.vue";
import TrackTraceToolsPageOverlay from "@/components/page-overlay/TrackTraceToolsPageOverlay.vue";
import UnifiedSearchWidget from "@/components/page-overlay/UnifiedSearchWidget.vue";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { isDevelopment } from "@/modules/environment.module";
import { messageBus } from "@/modules/message-bus.module";
import { sandboxManager } from "@/modules/sandbox-manager.module";
import { storageManager } from "@/modules/storage-manager.module";
import { tabManager } from "@/modules/tab-manager.module";
import Vue from "vue";

// Decent introduction to content scripts:
// http://www.dre.vanderbilt.edu/~schmidt/android/android-4.0/external/chromium/chrome/common/extensions/docs/content_scripts.html

const TRACK_TRACE_TOOLS_ROOT_ELEMENT_ID = "track-trace-tools";
const TRACK_TRACE_TOOLS_ROOT_ELEMENT_SELECTOR = `#${TRACK_TRACE_TOOLS_ROOT_ELEMENT_ID}`;

const STATE_CODES = [
  "ak",
  "ca",
  "co",
  "dc",
  "la",
  "ma",
  "md",
  "me",
  "mi",
  "mo",
  "mt",
  "nv",
  "oh",
  "ok",
  "or",
];

const DISALLOWED_HOSTNAMES = [
  ...STATE_CODES.map((stateCode) => `wiki-${stateCode}.metrc.com`),
  ...STATE_CODES.map((stateCode) => `api-${stateCode}.metrc.com`),
  "www.metrc.com",
  "support.metrc.com",
];

console.log("Loaded T3");

storageManager.init();

messageBus.init();
tabManager.init();

async function initializeTooklit() {
  if (DISALLOWED_HOSTNAMES.includes(window.location.hostname)) {
    console.info(
      `The hostname '${window.location.hostname}' matches the disallow list, declining to render T3`
    );
    return;
  }

  if (!!document.querySelector(TRACK_TRACE_TOOLS_ROOT_ELEMENT_SELECTOR)) {
    console.error("Metrc toolkit already exists on page");
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("id", TRACK_TRACE_TOOLS_ROOT_ELEMENT_ID);
  document.body.appendChild(container);

  Vue.config.productionTip = isDevelopment();

  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", chrome.runtime.getURL("fonts/roboto.css"));
  document.head.appendChild(link);

  sandboxManager.runsBeforeVueAppMount();

  /* eslint-disable no-new */
  new Vue({
    el: TRACK_TRACE_TOOLS_ROOT_ELEMENT_SELECTOR,
    render: (h) => h(TrackTraceToolsPageOverlay),
  });

  // Overlay Widget
  const overlayWidget = document.createElement("div");
  overlayWidget.setAttribute("id", "ttt-overlay-widget");
  document.body.appendChild(overlayWidget);
  new Vue({
    el: "#ttt-overlay-widget",
    render: (h) => h(OverlayWidget),
  });

  // Everything past here should only render if authenticated
  try {
    await authManager.authStateOrError();
  } catch (e) {
    return;
  } finally {
    analyticsManager.page();
  }

  // Unified search
  const titleElement = document.querySelector(".title");
  const containerElement = titleElement?.parentElement;

  if (containerElement && titleElement && titleElement.nextSibling) {
    const packageSearchComponent = document.createElement("div");
    packageSearchComponent.setAttribute("id", "ttt-unified-search");

    containerElement.insertBefore(packageSearchComponent, titleElement.nextSibling);

    new Vue({
      el: "#ttt-unified-search",
      render: (h) => h(UnifiedSearchWidget),
    });
  }

  // Facility Picker
  const dropdownElement = document.querySelector(".facilities-dropdown");

  if (dropdownElement) {
    const facilityPickerComponent = document.createElement("div");
    facilityPickerComponent.setAttribute("id", "ttt-facility-picker");

    dropdownElement.parentElement?.appendChild(facilityPickerComponent);

    new Vue({
      el: "#ttt-facility-picker",
      render: (h) => h(FloatingFacilityPicker),
    });
  }
}

initializeTooklit();
