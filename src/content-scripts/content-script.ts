/* eslint-disable import/no-unresolved, no-new, import/extensions, import/named */

import OverlayWidget from "@/components/overlay-widget/OverlayWidget.vue";
import FloatingFacilityPicker from "@/components/page-overlay/FloatingFacilityPicker.vue";
import TrackTraceToolsPageOverlay from "@/components/page-overlay/TrackTraceToolsPageOverlay.vue";
import UnifiedSearchWidget from "@/components/search/unified/UnifiedSearchWidget.vue";
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

const T3_AUTH_REDIRECT_TOKEN = "t3-auth-redirect";
const T3_AUTH_REDIRECT_TIMESTAMP_LOCALSTORAGE_TOKEN = "t3-auth-last-redirect";

console.log("Loaded T3");

storageManager.init();

messageBus.init();
tabManager.init();

async function initializeToolkit() {
  if (DISALLOWED_HOSTNAMES.includes(window.location.hostname)) {
    console.info(
      `The hostname '${window.location.hostname}' matches the disallow list, declining to render T3`
    );
    return;
  }

  const currentUrl = new URL(window.location.href);

  // Metrc has a stupid auth bug where it won't redirect the login page even when you're logged in
  if (
    currentUrl.pathname === "/log-in" &&
    !currentUrl.toString().includes(T3_AUTH_REDIRECT_TOKEN)
  ) {
    // Retrieve the last navigation timestamp from localStorage
    const lastNavigationTime = localStorage.getItem(T3_AUTH_REDIRECT_TIMESTAMP_LOCALSTORAGE_TOKEN);
    const currentTime = new Date().getTime();

    // Check if the last navigation occurred within the last 60 seconds
    if (!lastNavigationTime || currentTime - parseInt(lastNavigationTime, 60) > 10000) {
      fetch("/").then(
        (response) => {
          if (response.status !== 200) {
            return;
          }

          const responseUrl = new URL(response.url);

          // User is definitely logged out, exit
          if (responseUrl.pathname === "/log-in") {
            return;
          }

          responseUrl.searchParams.append(T3_AUTH_REDIRECT_TOKEN, "true");

          // Store the current timestamp in localStorage right before redirecting
          localStorage.setItem(
            T3_AUTH_REDIRECT_TIMESTAMP_LOCALSTORAGE_TOKEN,
            currentTime.toString()
          );

          window.location.href = responseUrl.toString();
        },
        () => {
          // Silently fail
        }
      );
    }
  }

  if (document.querySelector(TRACK_TRACE_TOOLS_ROOT_ELEMENT_SELECTOR)) {
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
    // analyticsManager.page();
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
  const navbarElement = document.querySelector(".navbar.navbar-fixed-top");

  if (navbarElement) {
    const facilityPickerComponent = document.createElement("div");
    facilityPickerComponent.setAttribute("id", "ttt-facility-picker");

    navbarElement?.appendChild(facilityPickerComponent);

    new Vue({
      el: "#ttt-facility-picker",
      render: (h) => h(FloatingFacilityPicker),
    });
  }
}

initializeToolkit();
