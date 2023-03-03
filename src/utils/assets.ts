// const urlCache: Map<string, string> = new Map();

/**
 *
 * @param path MUST BE require("@/...")
 */
export async function getUrl(path: string) {
  return chrome.runtime.getURL(path);

  // if (urlCache.has(path)) {
  //     return urlCache.get(path);
  // }

  // const downloadIconResult = await messageBus.sendMessageToBackground(
  //     MessageType.GET_EXTENSION_URL,
  //     {
  //         //https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/
  //         path,
  //     }
  // );
  // const url = downloadIconResult.data.url;

  // urlCache.set(path, url);

  // return url;
}
