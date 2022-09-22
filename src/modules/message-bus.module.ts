import { MessageType } from "@/consts";
import { IAtomicService, IBusEvent, IBusMessageOptions } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { debugLogFactory } from "@/utils/debug";
import * as Sentry from "@sentry/browser";
import { v4 } from "uuid";

const debugLog = debugLogFactory("message-bus.module.ts");

class MessageBus implements IAtomicService {
  port: any;
  handlers: Map<string, Function> = new Map();

  async init() {
    this.connect();

    // timer(0, 100).subscribe(() => {
    //   if (this.port) {
    //     this.sendMessageToBackground(MessageType.KEEPALIVE, {});
    //   }
    // });
  }

  async connect() {
    console.log("Connecting port...");

    // @ts-ignore
    this.port = browser.runtime.connect();

    this.port.onMessage.addListener((event: IBusEvent) => {
      this.handleMessageFromBackground(event);
    });
  }

  async sendMessageToBackground<T>(
    type: MessageType,
    data: any,
    options: IBusMessageOptions = {},
    transferables: any[] = []
  ): Promise<any> {
    // Options are collected here for *all* message types
    options.muteAnalytics = store.state.muteAnalytics;

    try {
      const uuid = v4();

      const responsePromise = new Promise((resolve, reject) => {
        this.handlers.set(uuid, resolve);

        const id = setTimeout(() => reject("Background message send timed out"), 5000);

        this.handlers.set(uuid, (event: any) => {
          clearTimeout(id);
          resolve(event);
        });
      });

      responsePromise
        .catch((e) => {
          console.error("Failed to send message to background (reject)", type);

          this.connect();

          Sentry.captureException(e, { tags: { type } });
        })
        .finally(() => this.handlers.delete(uuid));

      const event: IBusEvent = {
        uuid,
        message: {
          type,
          data,
          options,
        },
      };

      this.port.postMessage(event, transferables);

      return responsePromise;
    } catch (e) {
      // This is usually triggered in development when reloading the extension between page refreshes.
      console.error("Failed to send message to background (catch)", type);

      this.connect();

      Sentry.captureException(e, { tags: { type } });
    }
  }

  private handleMessageFromBackground(event: IBusEvent) {
    if (!!event.uuid) {
      // This is a response to a transmitted message
      const handler = this.handlers.get(event.uuid);

      if (handler) {
        handler(event.message);
      }

      this.handlers.delete(event.uuid);
    } else {
      // This is a standalone message from the background
      switch (event.message.type) {
        case MessageType.PERMISSIONS_ADDED:
          debugLog(async () => ["Permissions added", event]);
          break;
        default:
          console.log("Unknown event type");
      }
    }
  }
}

export let messageBus = new MessageBus();
