import { IAtomicService, IAuthState, PluginKeyvalCategory } from '@/interfaces';
import { debugLogFactory } from '@/utils/debug';
import { expiringCacheManager } from './expiring-cache-manager.module';

const debugLog = debugLogFactory('upsert-manager.module.ts');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

class KeyFactory {
  key: string;

  // This governs how often a key is sent
  sendIntervalMs: number;

  authState: IAuthState;

  constructor({
    key,
    sendIntervalMs,
    authState,
  }: {
    key: string;
    sendIntervalMs: number;
    authState: IAuthState;
  }) {
    this.key = key;
    this.sendIntervalMs = sendIntervalMs;
    this.authState = authState;
  }

  // The key is automatically unique per-user, per-license
  async generate(): Promise<string> {
    return `${this.authState.identity}__${this.authState.license}__${this.key}`;
  }

  async shouldSend(): Promise<boolean> {
    return !expiringCacheManager.get({ key: await this.generate() });
  }

  async recordSend() {
    expiringCacheManager.set({
      key: await this.generate(),
      value: '1',
      expirationMs: this.sendIntervalMs,
    });
  }
}

/**
 * Controls the interval at which data is sent to prevent request overflow
 */
class UpsertManager implements IAtomicService {
  async init() {}

  async willSendKeyval({
    key,
    authState,
    sendIntervalMs = ONE_HOUR_MS,
  }: {
    key: string;
    authState: IAuthState;
    sendIntervalMs?: number;
  }) {
    const keyFactory: KeyFactory = new KeyFactory({ key, sendIntervalMs, authState });

    return keyFactory.shouldSend();
  }

  async maybeSendKeyval({
    key,
    category,
    dataType,
    data,
    authState,
    sendIntervalMs = ONE_HOUR_MS,
  }: {
    key: string;
    category: PluginKeyvalCategory;
    dataType: 'json' | 'blob';
    data: any;
    authState: IAuthState;
    sendIntervalMs?: number;
  }) {
    try {
      const keyFactory: KeyFactory = new KeyFactory({ key, sendIntervalMs, authState });

      if (!(await keyFactory.shouldSend())) {
        debugLog(async () => ['Declining to send', await keyFactory.generate()]);
        return;
      }

      if (!data) {
        // Don't wipe out existing data
        return;
      }

      // await stubRequestManager.createPluginKeyval({
      //   authState,
      //   key: await keyFactory.generate(),
      //   category,
      //   dataType,
      //   data
      // });

      // keyFactory.recordSend();
    } catch (e) {
      console.error(`Failed to send keyval for ${key}`, e);
    }
  }
}

export const upsertManager = new UpsertManager();
