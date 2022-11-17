import { AMPLITUDE_API_KEY, MessageType } from "@/consts";
import { IBusEvent, IBusMessage, IBusMessageOptions } from "@/interfaces";
import { database } from "@/modules/indexeddb.module";
import amplitude from "amplitude-js";

console.log(`These events are collected only to help us make the plugin more useful for you.`);

// Amplitude Integration
const amplitudeInstance = amplitude.getInstance();
amplitudeInstance.init(AMPLITUDE_API_KEY);

let portFromCS: any = null;

function sendMessageToContentScript(message: IBusMessage) {
  portFromCS.postMessage({
    message,
  });
}

function respondToContentScript(inboundEvent: IBusEvent, outboundData: any) {
  portFromCS.postMessage({
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

function connected(p: any) {
  console.log("Connected");

  portFromCS = p;
  portFromCS.onMessage.addListener(async (inboundEvent: IBusEvent) => {
    // if (!portFromCS) {
    //   console.warn("Missing port");
    //   return;
    // }

    // This will only show in the background.js console output, so leave in place for debugging
    console.log("inboundEvent:", inboundEvent);

    if (inboundEvent.message) {
      switch (inboundEvent.message.type) {
        case MessageType.KEEPALIVE:
          break;
        case MessageType.SET_USER_ID:
          amplitudeInstance.setUserId(inboundEvent.message.data.identity);
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.SET_USER_PROPERTIES:
          amplitudeInstance.setUserProperties(inboundEvent.message.data);
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.PAGELOAD:
          logEvent(
            `Visited ${inboundEvent.message.data.pageName}`,
            inboundEvent.message.data.pageData,
            inboundEvent.message.options
          );
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.INDEX_PACKAGES:
          await database.indexPackages(inboundEvent.message.data.indexedPackagesData);
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.SEARCH_PACKAGES:
          // Log the search
          // logEvent(MessageType.REFRESH_PACKAGE_RESULTS, inboundEvent.message.data, inboundEvent.message.options);

          // Perform the search
          respondToContentScript(inboundEvent, {
            packages: await database.packageSearch(
              inboundEvent.message.data.query,
              inboundEvent.message.data.license,
              inboundEvent.message.data.filters
            ),
          });
          break;

        case MessageType.INDEX_TRANSFERS:
          await database.indexTransfers(inboundEvent.message.data.indexedTransfersData);
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.SEARCH_TRANSFERS:
          // Log the search
          // logEvent(MessageType.REFRESH_TRANSFER_RESULTS, inboundEvent.message.data, inboundEvent.message.options);

          // Perform the search
          respondToContentScript(inboundEvent, {
            transfers: await database.transferSearch(
              inboundEvent.message.data.query,
              inboundEvent.message.data.license,
              inboundEvent.message.data.filters
            ),
          });
          break;

        case MessageType.INDEX_TAGS:
          await database.indexTags(inboundEvent.message.data.indexedTagsData);
          respondToContentScript(inboundEvent, { success: true });
          break;

        case MessageType.SEARCH_TAGS:
          // Log the search
          logEvent(
            MessageType.SEARCH_TAGS,
            inboundEvent.message.data,
            inboundEvent.message.options
          );

          // Perform the search
          respondToContentScript(inboundEvent, {
            tags: await database.tagSearch(
              inboundEvent.message.data.query,
              inboundEvent.message.data.license,
              inboundEvent.message.data.filters
            ),
          });
          break;

        case MessageType.UPDATE_UNINSTALL_URL:
          respondToContentScript(inboundEvent, {
            success: true,
          });
          break;

        case MessageType.GET_EXTENSION_URL:
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getURL
          respondToContentScript(inboundEvent, {
            success: true,
            url: await browser.runtime.getURL(inboundEvent.message.data.path),
          });
          break;

        case MessageType.CHECK_PERMISSIONS:
          // https://chrome-apps-doc2.appspot.com/extensions/permissions.html
          respondToContentScript(inboundEvent, {
            success: true,
            hasPermissions: await browser.permissions.contains(inboundEvent.message.data),
          });
          break;

        case MessageType.OPEN_CONNECT_STANDALONE:
          // console.log(await result.data.url);
          window.open(await browser.runtime.getURL("index.html#/connect"), "_blank");
          break;

        // case MessageType.ASYNC_STORAGE_LENGTH:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.length())

        //   break;
        // case MessageType.ASYNC_STORAGE_KEY:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.key(inboundEvent.message.data.index));

        //   break;
        // case MessageType.ASYNC_STORAGE_CLEAR:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.clear());

        //   break;
        // case MessageType.ASYNC_STORAGE_GET_ITEM:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.getItem(inboundEvent.message.data.key));

        //   break;
        // case MessageType.ASYNC_STORAGE_SET_ITEM:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.setItem(inboundEvent.message.data.key, inboundEvent.message.data.data));

        //   break;
        // case MessageType.ASYNC_STORAGE_REMOVE_ITEM:
        //   respondToContentScript(inboundEvent, await CustomAsyncStorage.removeItem(inboundEvent.message.data.key));

        //   break;

        default:
          try {
            // Default behavior is to track event data in analytics
            logEvent(
              inboundEvent.message.data.eventName,
              inboundEvent.message.data.eventData,
              inboundEvent.message.options
            );

            respondToContentScript(inboundEvent, { success: true });
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

  portFromCS.onDisconnect.addListener(() => {
    portFromCS = null;
    console.error("Disconnected");
  });
}

// @ts-ignore
browser.runtime.onConnect.addListener(connected);

browser.permissions.onAdded.addListener((permissions: any) => {
  console.log("Permissions added:", permissions);
  sendMessageToContentScript({
    type: MessageType.PERMISSIONS_ADDED,
    data: permissions,
    options: {},
  });
});

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

    // TODO
    chrome.runtime.setUninstallURL("");
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
