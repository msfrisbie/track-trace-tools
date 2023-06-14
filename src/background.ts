import { AMPLITUDE_API_KEY, ChromeStorageKeys, MessageType } from "@/consts";
import { IBusEvent, IBusMessageOptions } from "@/interfaces";
import { database } from "@/modules/indexeddb.module";
import amplitude from "amplitude-js";
import { expireAuthToken, getAuthTokenOrError, getOAuthUserInfoOrError } from "./utils/oauth";
import {
  appendValues,
  batchUpdate,
  batchUpdateValues,
  createSpreadsheet,
  writeValues,
} from "./utils/sheets";

console.log(`These events are collected only to help us make the plugin more useful for you.`);

// Amplitude Integration
const amplitudeInstance = amplitude.getInstance();
amplitudeInstance.init(AMPLITUDE_API_KEY);

// let portFromCS: any = null;

// function sendMessageToContentScript(message: IBusMessage) {
//   chrome.runtime.sendMessage()
//   portFromCS.postMessage({
//     message,
//   });
// }

function respondToContentScript(sendResponse: any, inboundEvent: IBusEvent, outboundData: any) {
  console.log({ inboundEvent, outboundData });
  sendResponse({
    uuid: inboundEvent.uuid,
    message: { data: outboundData },
  } as IBusEvent);
}

function logEvent(event: string, data: any, options: IBusMessageOptions) {
  console.log(event, data, options);

  if (options.muteAnalytics) {
    return;
  }

  amplitudeInstance.logEvent(event, data);
}

chrome.runtime.onMessage.addListener((inboundEvent, sender, sendResponse) => {
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
        chrome.cookies.getAll({}).then((cookies) => {
          respondToContentScript(sendResponse, inboundEvent, {
            cookies,
          });
        });
        break;

      case MessageType.SET_USER_ID:
        amplitudeInstance.setUserId(inboundEvent.message.data.identity);
        respondToContentScript(sendResponse, inboundEvent, { success: true });
        break;

      case MessageType.SET_USER_PROPERTIES:
        amplitudeInstance.setUserProperties(inboundEvent.message.data);
        respondToContentScript(sendResponse, inboundEvent, { success: true });
        break;

      case MessageType.PAGELOAD:
        logEvent(
          `Visited ${inboundEvent.message.data.pageName}`,
          inboundEvent.message.data.pageData,
          inboundEvent.message.options
        );
        respondToContentScript(sendResponse, inboundEvent, { success: true });
        break;

      case MessageType.INDEX_PACKAGES:
        database.indexPackages(inboundEvent.message.data.indexedPackagesData).then(() => {
          respondToContentScript(sendResponse, inboundEvent, { success: true });
        });
        break;

      // case MessageType.SEARCH_PACKAGES:
      //   // Log the search
      //   // logEvent(MessageType.REFRESH_PACKAGE_RESULTS, inboundEvent.message.data, inboundEvent.message.options);

      //   // Perform the search
      //   respondToContentScript(sendResponse, inboundEvent, {
      //     packages: await database.packageSearch(
      //       inboundEvent.message.data.query,
      //       inboundEvent.message.data.license,
      //       inboundEvent.message.data.filters
      //     ),
      //   });
      //   break;

      case MessageType.INDEX_TRANSFERS:
        database.indexTransfers(inboundEvent.message.data.indexedTransfersData).then(() => {
          respondToContentScript(sendResponse, inboundEvent, { success: true });
        });
        break;

      case MessageType.SEARCH_TRANSFERS:
        // Log the search
        // logEvent(MessageType.REFRESH_TRANSFER_RESULTS, inboundEvent.message.data, inboundEvent.message.options);

        // Perform the search
        database
          .transferSearch(
            inboundEvent.message.data.query,
            inboundEvent.message.data.license,
            inboundEvent.message.data.filters
          )
          .then((transfers) => {
            respondToContentScript(sendResponse, inboundEvent, {
              transfers,
            });
          });

        break;

      case MessageType.INDEX_TAGS:
        database.indexTags(inboundEvent.message.data.indexedTagsData).then(() => {
          respondToContentScript(sendResponse, inboundEvent, { success: true });
        });
        break;

      case MessageType.SEARCH_TAGS:
        // Log the search
        logEvent(MessageType.SEARCH_TAGS, inboundEvent.message.data, inboundEvent.message.options);

        // Perform the search
        database
          .tagSearch(
            inboundEvent.message.data.query,
            inboundEvent.message.data.license,
            inboundEvent.message.data.filters
          )
          .then((tags) => {
            respondToContentScript(sendResponse, inboundEvent, {
              tags,
            });
          });

        break;

      case MessageType.UPDATE_UNINSTALL_URL:
        respondToContentScript(sendResponse, inboundEvent, {
          success: true,
        });
        break;

      // case MessageType.GET_EXTENSION_URL:
      //   // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getURL
      //   respondToContentScript(sendResponse, inboundEvent, {
      //     success: true,
      //     url: await browser.runtime.getURL(inboundEvent.message.data.path),
      //   });
      //   break;

      // case MessageType.CHECK_PERMISSIONS:
      //   // https://chrome-apps-doc2.appspot.com/extensions/permissions.html
      //   respondToContentScript(sendResponse, inboundEvent, {
      //     success: true,
      //     hasPermissions: await browser.permissions.contains(inboundEvent.message.data),
      //   });
      //   break;

      //   break;
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

      default:
        try {
          // Default behavior is to track event data in analytics
          logEvent(
            inboundEvent.message.data.eventName,
            inboundEvent.message.data.eventData,
            inboundEvent.message.options
          );

          respondToContentScript(sendResponse, inboundEvent, { success: true });
        } catch (error) {
          console.error("Event error in background", inboundEvent, error);
        }
        break;
    }
  }

  // Note: Returning true is required here!
  //  ref: http://stackoverflow.com/questions/20077487/chrome-extension-inboundEvent-passing-response-not-sent
  return true;
});

//   portFromCS.onDisconnect.addListener(() => {
//     portFromCS = null;
//     console.log("Disconnected");
//   });
// }

// @ts-ignore
// browser.runtime.onConnect.addListener(connected);
// chrome.runtime.onMessage.addListener(messageHandler);

// chrome.permissions.onAdded.addListener((permissions: any) => {
//   console.log("Permissions added:", permissions);
//   sendMessageToContentScript({
//     type: MessageType.PERMISSIONS_ADDED,
//     data: permissions,
//     options: {},
//   });
// });

try {
  // Fired when:
  // - the extension is first installed
  // - the extension is updated to a new version
  // - the browser is updated to a new version.
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      logEvent(`UPDATED_VERSION`, {}, {});
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      logEvent(`NEW_INSTALL`, {}, {});

      // Acquire the welcome page URL
      let url = chrome.runtime.getURL("index.html");

      // // Open the welcome page in a new tab .
      chrome.tabs.create({ url });
    }

    chrome.runtime.setUninstallURL("https://trackandtrace.tools/uninstall");
  });
} catch (e) {
  console.error(e);
}

chrome.action.onClicked.addListener(() => {
  // Acquire the welcome page URL
  let url = chrome.runtime.getURL("index.html");

  // // Open the welcome page in a new tab .
  chrome.tabs.create({ url });
});
