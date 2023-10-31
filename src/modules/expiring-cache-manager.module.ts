import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { timer } from "rxjs";

const debugLog = debugLogFactory("modules/expiring-cache-manager.module.ts");

const EXPIRING_CACHE_KEY_PREFIX = "tttexpcachekeypfx";

function keyFactory({
  keyPiece,
  expirationMs,
}: {
  keyPiece: string;
  expirationMs: number;
}): string {
  if (keyPiece.includes(":")) {
    throw new Error("Invalid cache key piece");
  }

  return `${EXPIRING_CACHE_KEY_PREFIX}::${keyPiece}::${Date.now() + expirationMs}`;
}

function extractKeyValues(key: string): { keyPiece: string; expiration: number } {
  const match = key.match(/[^:]+::([^:]+)::(\d+)/);

  if (!match) {
    throw new Error("Could not extract");
  }

  return { keyPiece: match[1], expiration: parseInt(match[2], 10) };
}

class ExpiringCacheManager implements IAtomicService {
  async init() {
    this.inMemoryCache = {};
    this.persistedCache.setItem(EXPIRING_CACHE_KEY_PREFIX, "{}");

    timer(10000).subscribe(() => this.lazyFlushExpiredValues());
  }

  set inMemoryCache(value: any) {
    // @ts-ignore
    globalThis[EXPIRING_CACHE_KEY_PREFIX] = value;
  }

  get inMemoryCache(): { [key: string]: any } {
    // @ts-ignore
    return globalThis[EXPIRING_CACHE_KEY_PREFIX] || {};
  }

  get persistedCache(): Storage {
    return localStorage;
  }

  managedKeys(): string[] {
    return [
      ...new Set(
        ...Object.keys(this.inMemoryCache || {}),
        ...Object.keys(JSON.parse(this.persistedCache.getItem(EXPIRING_CACHE_KEY_PREFIX) || "{}"))
      ),
    ];
  }

  lazyFlushExpiredValues() {
    let count = 0;

    for (const k of this.managedKeys()) {
      const { expiration } = extractKeyValues(k);

      if (expiration < Date.now()) {
        ++count;
        this.persistedCache.removeItem(k);
        this.inMemoryCache[k] = null;
      }
    }

    debugLog(async () => [`Flushed ${count} expired keys`]);
  }

  get({ key }: { key: string }): any {
    for (const k of this.managedKeys()) {
      const { keyPiece, expiration } = extractKeyValues(k);

      if (keyPiece === key && expiration > Date.now()) {
        return this.inMemoryCache[k] || this.persistedCache.getItem(k);
      }
    }

    return null;
  }

  set({
    key,
    value,
    expirationMs,
    persist = false,
  }: {
    key: string;
    value: string;
    expirationMs: number;
    persist?: boolean;
  }) {
    // Check for existing value and removeItem if it exists
    for (const k of this.managedKeys()) {
      const { keyPiece } = extractKeyValues(k);

      if (keyPiece === key) {
        if (persist) {
          this.persistedCache.removeItem(k);
        }
        break;
      }
    }

    this.persistedCache.setItem(keyFactory({ keyPiece: key, expirationMs }), value);
  }
}

export const expiringCacheManager = new ExpiringCacheManager();
