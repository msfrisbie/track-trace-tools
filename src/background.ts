import { ChromeStorageKeys, MessageType } from "@/consts";
import { IBusEvent } from "@/interfaces";
import "exboost-js";
import { sendAnalyticsEvent } from "./utils/analytics";
import { expireAuthToken, getAuthTokenOrError, getOAuthUserInfoOrError } from "./utils/oauth";
import {
  appendValues,
  batchUpdate,
  batchUpdateValues,
  createSpreadsheet,
  readValues,
  writeValues,
} from "./utils/sheets";
import { slackLog } from "./utils/slack";

console.log("These events are collected only to help us make the plugin more useful for you.");

function respondToContentScript(sendResponse: any, inboundEvent: IBusEvent, outboundData: any) {
  console.log({ inboundEvent, outboundData });
  sendResponse({
    uuid: inboundEvent.uuid,
    message: { data: outboundData },
  } as IBusEvent);
}

const requestBodyMap: Map<string, any> = new Map();
const IGNORE_PATHNAMES = ["/api/system/report-error"];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);

    if (!url.pathname.startsWith("/api/")) {
      return;
    }

    if (IGNORE_PATHNAMES.includes(url.pathname)) {
      return;
    }

    if (!details.requestBody) {
      return;
    }

    if (details.method !== "POST") {
      return;
    }

    if (!details.requestBody.raw) {
      return;
    }

    if (!details.requestBody.raw[0].bytes) {
      return;
    }

    const enc = new TextDecoder("utf-8");
    const arr = new Uint8Array(details.requestBody.raw[0].bytes);
    const body = JSON.parse(enc.decode(arr));

    // Data loads are POST requests, but are formatted a specific way
    if (Object.keys(body).includes("request")) {
      return;
    }

    requestBodyMap.set(details.requestId, body);
  },
  {
    urls: ["https://*.metrc.com/*", "http://localhost:5000/*"],
  },
  ["requestBody"]
);

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const url = new URL(details.url);

    const payload = requestBodyMap.get(details.requestId);

    if (!payload) {
      return;
    }

    if (!details.requestHeaders) {
      return;
    }

    if (details.requestHeaders.find((x) => x.name === "X-T3")) {
      return;
    }

    let licenseNumber: string = "";
    const licenseHeader = details.requestHeaders.find(
      (x) => x.name.toLocaleLowerCase() === "X-Metrc-Licensenumber".toLocaleLowerCase()
    );
    if (licenseHeader) {
      licenseNumber = licenseHeader.value ?? "";
    }

    fetch("https://api.trackandtrace.tools/metrc/log-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "",
        license_number: licenseNumber,
        hostname: url.hostname,
        path: url.pathname,
        payload,
      }),
    });

    requestBodyMap.delete(details.requestId);
  },
  {
    urls: ["https://*.metrc.com/*", "http://localhost:5000/*"],
  },
  ["requestHeaders"]
);

chrome.runtime.onMessage.addListener((inboundEvent, sender, sendResponse): boolean => {
  // This will only show in the background.js console output, so leave in place for debugging
  console.log("inboundEvent:", inboundEvent);

  // It seems to be the case that async/await is causing problems when used with OAuth.
  // "Unchecked runtime.lastError: The message port closed before a response was received"
  // Seems to indicate that sendResponse is going out of scope before it is needed.
  // Other message handlers seem to be able to use it no problem, can't really explain it.
  // Attempting transition to .then()
  if (inboundEvent.message) {
    switch (inboundEvent.message.type) {
      case MessageType.KEEPALIVE:
        break;
      case MessageType.OPEN_OPTIONS_PAGE:
        if (inboundEvent.message.data.path) {
          chrome.storage.local
            .set({
              [ChromeStorageKeys.INITIAL_OPTIONS_PATH]: inboundEvent.message.data.path,
            })
            .then(() => {
              chrome.runtime.openOptionsPage();
            });
        } else {
          chrome.runtime.openOptionsPage();
        }
        break;
      case MessageType.GET_COOKIES:
        chrome.cookies.getAllCookieStores().then((cookieStores) => {
          console.log(cookieStores);

          let cookies: chrome.cookies.Cookie[] = [];

          const promises: Promise<any>[] = [];

          cookieStores.map((cookieStore) =>
            promises.push(
              chrome.cookies
                .getAll({
                  domain: inboundEvent.message.data.domain,
                  storeId: cookieStore.id,
                })
                .then((singleStoreCookies) => {
                  cookies = cookies.concat(singleStoreCookies);

                  // Backwards compat - possibly redundant
                  return cookies;
                })
            )
          );

          Promise.allSettled(promises).then(() => {
            respondToContentScript(sendResponse, inboundEvent, {
              cookies,
            });
          });
        });

        break;

      case MessageType.SET_USER_ID:
        // Amplitude is counting thousands of redundant IDs
        // Disabled until a fix can be found
        // amplitudeInstance.setUserId(inboundEvent.message.data.identity);
        respondToContentScript(sendResponse, inboundEvent, { success: true });
        break;

      case MessageType.SET_USER_PROPERTIES:
        // Amplitude is counting thousands of redundant IDs
        // Disabled until a fix can be found
        // amplitudeInstance.setUserProperties(inboundEvent.message.data);
        respondToContentScript(sendResponse, inboundEvent, { success: true });
        break;

      case MessageType.UPDATE_UNINSTALL_URL:
        chrome.runtime.setUninstallURL(
          `https://trackandtrace.tools/uninstall?metadata=${btoa(
            JSON.stringify({
              ...inboundEvent.message.data,
            })
          )}`
        );
        break;

      case MessageType.CHECK_OAUTH:
        getAuthTokenOrError({ interactive: false }).then(
          () => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              isAuthenticated: true,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );
        break;
      case MessageType.GET_OAUTH_USER_INFO_OR_ERROR:
        getOAuthUserInfoOrError(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );
        break;
      case MessageType.EXPIRE_AUTH_TOKEN:
        expireAuthToken().then(
          () => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );

        break;
      case MessageType.CREATE_SPREADSHEET:
        createSpreadsheet(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );

        break;

      case MessageType.BATCH_UPDATE_SPREADSHEET:
        batchUpdate(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );
        break;

      case MessageType.BATCH_UPDATE_SPREADSHEET_VALUES:
        batchUpdateValues(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );

        break;

      case MessageType.READ_SPREADSHEET_VALUES:
        readValues(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );

        break;

      case MessageType.WRITE_SPREADSHEET_VALUES:
        writeValues(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );

        break;

      case MessageType.APPEND_SPREADSHEET_VALUES:
        appendValues(inboundEvent.message.data).then(
          (result) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: true,
              result,
            });
          },
          (error) => {
            respondToContentScript(sendResponse, inboundEvent, {
              success: false,
            });
            console.error("Event error in background", inboundEvent, error);
          }
        );
        break;

      case MessageType.LOG_ANALYTICS_EVENT:
        console.log(inboundEvent);

        if (inboundEvent.message.options.muteAnalytics) {
          return true;
        }

        try {
          sendAnalyticsEvent(inboundEvent.message.data);

          respondToContentScript(sendResponse, inboundEvent, { success: true });
        } catch (error) {
          console.error("Event error in background", inboundEvent, error);
        }
        break;

      case MessageType.SLACK_LOG:
        slackLog(inboundEvent.data.eventName, inboundEvent.message.data.eventData);
        break;

      default:
        break;
    }
  }

  // Note: Returning true is required here!
  //  ref: http://stackoverflow.com/questions/20077487/chrome-extension-inboundEvent-passing-response-not-sent
  return true;
});

try {
  // Fired when:
  // - the extension is first installed
  // - the extension is updated to a new version
  // - the browser is updated to a new version.
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      // logEvent("UPDATED_VERSION", {}, {});
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      // logEvent("NEW_INSTALL", {}, {});

      slackLog("NEW INSTALL", {});

      // Acquire the welcome page URL
      const url = chrome.runtime.getURL("index.html");

      // Open the welcome page in a new tab
      chrome.tabs.create({ url });
    }

    chrome.runtime.setUninstallURL("https://trackandtrace.tools/uninstall");
  });
} catch (e) {
  console.error(e);
}

chrome.action.onClicked.addListener(() => {
  // Acquire the welcome page URL
  const url = chrome.runtime.getURL("index.html");

  // // Open the welcome page in a new tab .
  chrome.tabs.create({ url });
});
