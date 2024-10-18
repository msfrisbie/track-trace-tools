import { URLHashData } from "@/interfaces";

export function encodeHashData(hashData: URLHashData): string {
  return encodeURIComponent(JSON.stringify(hashData));
}

export function getHashData(): URLHashData {
  try {
    return JSON.parse(decodeURIComponent(window.location.hash).slice(1));
  } catch (e) {
    return {};
  }
}

function removeEmptyObjects(obj: { [key: string]: any }) {
  // Check if the given value is an object
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  // Get all keys in the object
  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    // Recursively clean nested objects
    if (typeof value === "object" && value !== null) {
      obj[key] = removeEmptyObjects(value);

      // Remove key if the value is an empty object
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  });

  return obj;
}

export function setHashData(hashData: URLHashData) {
  removeEmptyObjects(hashData);

  window.location.hash = encodeHashData(hashData);
}

export function getNonce(): string {
  return Date.now().toString();
}

export function navigationUrl(
  path: string,
  options: {
    hash?: string;
    nonce?: string;
    origin?: string;
  } = {}
): string {
  const url = new URL(options.origin ?? window.location.origin + path);
  url.searchParams.set("nonce", options.nonce ?? getNonce());
  url.hash = options.hash ?? "";

  return url.toString();
}
