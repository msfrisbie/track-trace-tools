import store from "@/store/page-overlay/index";

type StorageKey = string;

export enum StorageKeyType {
  ACTIVE_PACKAGES = "ACTIVE_PACKAGES",
  INACTIVE_PACKAGES = "INACTIVE_PACKAGES",
}

export function storageKeyFactory(values: {
  license: string;
  keyType: string;
  keyProperty: "timestamp" | "data";
}): StorageKey {
  return `${values.license}::${values.keyType}::${values.keyProperty}`;
}

export async function writeData({
  data,
  license,
  keyType,
}: {
  data: any;
  license: string;
  keyType: StorageKeyType;
}) {
  const dataStorageKey: StorageKey = storageKeyFactory({
    license,
    keyType,
    keyProperty: "data",
  });

  await simpleSet(dataStorageKey, data);

  const timestampStorageKey: StorageKey = storageKeyFactory({
    license,
    keyType,
    keyProperty: "timestamp",
  });

  await simpleSet(timestampStorageKey, Date.now());
}

/**
 *
 * Reads and returns the data if it exists and is fresh, otherwise returns null.
 * Performs minimal reads.
 */
export async function readDataOrNull<T>({
  license,
  keyType,
  ttlMs,
  validatorFn,
}: {
  license: string;
  keyType: StorageKeyType;
  ttlMs: number;
  validatorFn?: (data: any) => boolean;
}): Promise<T | null> {
  if (!store.state.settings.usePersistedCache) {
    return null;
  }

  if (ttlMs === 0) {
    return null;
  }

  const timestampStorageKey: StorageKey = storageKeyFactory({
    license,
    keyType,
    keyProperty: "timestamp",
  });

  const timestamp = await simpleGet<number | null>(timestampStorageKey);

  if (timestamp === null) {
    console.log(`${timestampStorageKey} not set`);
    return null;
  }

  if (timestamp < Date.now() - ttlMs) {
    console.log(`${timestampStorageKey} expired`);
    return null;
  }

  const dataStorageKey: StorageKey = storageKeyFactory({
    license,
    keyType,
    keyProperty: "data",
  });

  const data = await simpleGet<T>(dataStorageKey);

  if (!data) {
    console.log(`${dataStorageKey} not set`);
    return null;
  }

  if (validatorFn && !validatorFn(data)) {
    console.log(`Data failed validation`);
    return null;
  }

  return data;
}

async function simpleGet<T>(key: StorageKey, defaultValue?: T): Promise<T> {
  const result = await chrome.storage.local.get([key]);
  return result[key] || defaultValue;
}

async function simpleHas(key: StorageKey) {
  return (await simpleGet<any>(key)) !== undefined;
}

async function simpleSet<T>(key: StorageKey, value: T) {
  await chrome.storage.local.set({
    [key]: value,
  });
}

// export async function simplePrepend<T>(key: StorageKey, value: T, maxLength: number = 500) {
//   const current: T[] = await simpleGet<T[]>(key, []);
//   await simpleSet<T[]>(key, [value, ...current].slice(0, maxLength));
// }

// export async function simpleAppend<T>(key: StorageKey, value: T, maxLength: number = 500) {
//   const current: T[] = await simpleGet<T[]>(key, []);
//   await simpleSet<T[]>(key, [...current, value].slice(-maxLength));
// }

// export async function clear() {
//   chrome.storage.local.clear();
// }

// export async function watch<T>(
//   key: StorageKey,
//   callback: (storageChange: chrome.storage.StorageChange) => void
// ) {
//   chrome.storage.onChanged.addListener((changes) => {
//     for (let [k, v] of Object.entries(changes)) {
//       if (k === key) {
//         callback(v);
//       }
//     }
//   });

//   callback({ newValue: await simpleGet<T>(key) });
// }
