import { VUEX_KEY } from '@/consts';
import { IAtomicService } from '@/interfaces';
import { debugLogFactory } from '@/utils/debug';
import { interval } from 'rxjs';

const debugLog = debugLogFactory('storage-manager.module');

const KEEPALIVE_PREFIX = 'tttkeepalive::';
const KEEPALIVE_EXPIRATION_MS = 30 * 1000;

// Metrc leaves a bunch of bullshit in localStorage and doesn't clear it.
// Clears out old items that aren't used.
//
// This happens in metrc.kendo.js
class StorageManager implements IAtomicService {
  async init() {
    this.testWrite();

    this.startKeepaliveSignal();
  }

  get keepaliveKey(): string {
    return `${KEEPALIVE_PREFIX}${this.keepalivePath}`;
  }

  get keepalivePath(): string {
    if (window.location.pathname.startsWith('/industry')) {
      return window.location.pathname.split('/').slice(1, 3).join('/');
    }
    return window.location.pathname.slice(1);
  }

  private testWrite() {
    // Test enter a blob of text roughly the size of the settings JSON.
    // If an error is thrown, wipe out the entire localstorage
    try {
      const testKey = 'foo';
      const testValue = 'x'.repeat(5000);

      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
    } catch (e) {
      console.error(e);
      const errorMessage = (e as Error).toString();

      if (
        errorMessage.includes('QuotaExceededError')
        || errorMessage.includes('exceeded the quota')
        || errorMessage.includes('quota has been exceeded')
      ) {
        console.error('Purging keys');
        for (const key of this.storageKeys(localStorage)) {
          if (key !== VUEX_KEY) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }

  private startKeepaliveSignal() {
    // Slightly less than an exact divisor of the expiration timeout
    interval(9000).subscribe(() => {
      localStorage.setItem(this.keepaliveKey, (Date.now() + KEEPALIVE_EXPIRATION_MS).toString());

      this.destroyExpiredKeys();

      this.destroyExpiredBlobs();
    });
  }

  private destroyExpiredKeys() {
    for (const key of this.storageKeys(localStorage)) {
      if (!key.startsWith(KEEPALIVE_PREFIX)) {
        continue;
      }

      const value = localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const expirationTime = parseInt(value, 10);

      if (Date.now() > expirationTime) {
        debugLog(async () => ['Removing expired', key]);

        localStorage.removeItem(key);
      }
    }
  }

  private destroyExpiredBlobs() {
    debugLog(async () => ['LocalStorage size:', this.storageSize(localStorage)]);

    // The active data blobs that should remain will have this prefix
    const WHITELISTED_PREFIXES: string[] = this.whitelistedPrefixes();

    for (const key of this.storageKeys(localStorage)) {
      if (!key) {
        continue;
      }

      if (!key.startsWith('industry/')) {
        continue;
      }

      let whitelistMatch = false;
      for (const prefix of WHITELISTED_PREFIXES) {
        if (key.includes(prefix)) {
          whitelistMatch = true;
          break;
        }
      }
      if (whitelistMatch) {
        continue;
      }

      localStorage.removeItem(key);
    }

    debugLog(async () => ['LocalStorage size:', this.storageSize(localStorage)]);
  }

  private whitelistedPrefixes() {
    return [
      this.keepaliveKey,
      ...this.storageKeys(localStorage).filter((key) => key.startsWith(KEEPALIVE_PREFIX)),
    ].map((key) => key.split(KEEPALIVE_PREFIX)[1]);
  }

  private storageKeys(storage: Storage): string[] {
    const keys = [];

    for (let i = 0; i < storage.length; ++i) {
      const key = storage.key(i);

      if (!key) {
        continue;
      }

      keys.push(key);
    }

    return keys;
  }

  private storageSize(storage: Storage): number {
    let size = 0;

    for (const key of this.storageKeys(storage)) {
      size += storage.getItem(key)?.length || 0;
    }

    return size;
  }
}

export const storageManager = new StorageManager();
