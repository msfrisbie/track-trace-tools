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
    timer(10000).subscribe(() => this.lazyFlushExpiredValues());
  }

  managedKeys(): string[] {
    const managedKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(EXPIRING_CACHE_KEY_PREFIX)
    );

    // debugLog(async () => [managedKeys]);

    return managedKeys;
  }

  lazyFlushExpiredValues() {
    let count = 0;

    for (let k of this.managedKeys()) {
      const { expiration } = extractKeyValues(k);

      if (expiration < Date.now()) {
        ++count;
        localStorage.removeItem(k);
      }
    }

    debugLog(async () => [`Flushed ${count} expired keys`]);
  }

  get({ key }: { key: string }): any {
    for (const k of this.managedKeys()) {
      const { keyPiece, expiration } = extractKeyValues(k);

      if (keyPiece === key && expiration > Date.now()) {
        return localStorage.getItem(k);
      }
    }
  }

  set({ key, value, expirationMs }: { key: string; value: string; expirationMs: number }) {
    // Check for existing value and removeItem if it exists
    for (const k of this.managedKeys()) {
      const { keyPiece } = extractKeyValues(k);

      if (keyPiece === key) {
        localStorage.removeItem(k);
        break;
      }
    }

    localStorage.setItem(keyFactory({ keyPiece: key, expirationMs }), value);
  }
}

export let expiringCacheManager = new ExpiringCacheManager();
