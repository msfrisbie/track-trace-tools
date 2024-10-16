import { URLHashData } from "@/interfaces";

export function getHashData(): URLHashData {
  try {
    return JSON.parse(decodeURIComponent(window.location.hash).slice(1));
  } catch (e) {
    return {};
  }
}

export function setHashData(hashData: URLHashData) {
  window.location.hash = encodeURIComponent(JSON.stringify(hashData));
}

// export function getTrimmedHash() {
//   if (window.location.hash.startsWith("#")) {
//     return window.location.hash.substring(1);
//   }
//   return window.location.hash;
// }

// export function mergeHashValues(newHashValues: { [key: string]: string }): {
//   [key: string]: string;
// } {
//   const currentHashValues = Object.fromEntries(new URLSearchParams(getTrimmedHash()));

//   return {
//     ...currentHashValues,
//     ...newHashValues,
//   };
// }

// export function updateHash(newHashValues: { [key: string]: string }) {
//   const mergedHashValues = mergeHashValues(newHashValues);

//   window.location.hash = new URLSearchParams(mergedHashValues).toString();
// }

// export function readHashValueOrNull(key: string) {
//   const values = new URLSearchParams(getTrimmedHash());

//   if (!values.has(key)) {
//     return null;
//   }

//   return values.get(key);
// }

export function getNonce(): string {
  return Date.now().toString();
}

export function navigationUrl(
  path: string,
  options: {
    hashValues?: { [key: string]: string };
    nonce?: string;
    origin?: string;
  } = {}
): string {
  const url = new URL(options.origin ?? window.location.origin + path);
  url.searchParams.set("nonce", options.nonce ?? getNonce());
  url.hash = new URLSearchParams(options.hashValues ?? {}).toString();

  return url.toString();
}
