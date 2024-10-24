import { IApiKeyState, IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { extract, ExtractionType } from "@/utils/html";
import { BehaviorSubject, timer } from "rxjs";
import { filter, map, take } from "rxjs/operators";
import { analyticsManager } from "./analytics-manager.module";
import { primaryMetrcRequestManager } from "./metrc-request-manager.module";

const debugLog = debugLogFactory("api-key-manager.module.ts");

/**
 * This module operates as if permissions can be added or revoked at any time
 *
 * A user's Metrc API key will only be accessed if they connect T3
 *
 * When an account is enabled, it should immediately enable access to account features, but the
 * API key will be fetched asynchronously. Other modules may attempt to access this key immediately.
 *
 * The solution is to have the primary observable emit a *promise*, which will resolve to the API key.
 */
class ApiKeyManager implements IAtomicService {
  private _apiKeyStateSubject: BehaviorSubject<Promise<IApiKeyState | null> | null | undefined> =
    new BehaviorSubject<Promise<IApiKeyState | null> | null | undefined>(undefined);

  private _apiKeyState: Promise<IApiKeyState | null> | null = null;

  public async init() {
    throw new Error("This module is causing bugs, do not use");

    // await authManager.authStateOrError();

    // if (!this._apiKeyState) {
    //   this.getApiKeyState();
    // }

    // this._apiKeyStateSubject.next(this._apiKeyState);

    // debugLog(async () => ["API key state", await this._apiKeyState]);
  }

  private async getApiKeyState() {
    debugLog(async () => ["getApiKeyState"]);

    this._apiKeyState = new Promise(async (resolve, reject) => {
      const rejectSubscription = timer(10000).subscribe(() => reject("API key state timed out"));

      const apiKeyHtml: string = await primaryMetrcRequestManager
        .getApiKeyHTML()
        .then((response) => response.data);

      // { apiKeyData: { apiKey: "..." } }
      const extractedData = extract(ExtractionType.API_KEY_DATA, apiKeyHtml);

      const apiKey = extractedData?.apiKeyData?.apiKey;

      debugLog(async () => ["apiKey", apiKey]);

      let apiKeyState: IApiKeyState | null = null;

      if (apiKey) {
        // API key found, use it
        apiKeyState = { metrcApiKey: apiKey };
      } else {
        // There is no API key, generate it for them
        debugLog(async () => ["generating API key"]);

        const generateApiKeyText: string = await primaryMetrcRequestManager
          .generateApiKey()
          .then((response) => response.data);

        // Key returns with bookend quotes
        if (
          generateApiKeyText[0] === '"' &&
          generateApiKeyText[generateApiKeyText.length - 1] === '"'
        ) {
          apiKeyState = { metrcApiKey: generateApiKeyText.slice(1, -1) };
        } else {
          apiKeyState = { metrcApiKey: generateApiKeyText };
        }

        analyticsManager.track(AnalyticsEvent.TTT_MANAGEMENT_EVENT, {
          description: "Automatically generated API key",
        });
      }

      if (apiKeyState) {
        resolve(apiKeyState);
      } else {
        reject("Could not obtain API key");

        this._apiKeyState = null;
      }

      rejectSubscription.unsubscribe();
    });
  }

  async apiKeyStateOrNull(): Promise<IApiKeyState | null> {
    debugLog(async () => ["apiKeyStateOrNull"]);

    return this._apiKeyStateSubject
      .pipe(
        // Typing isn't smart enough to fix the types
        filter((x: Promise<IApiKeyState | null> | null | undefined) => x !== undefined),
        map((x) => x as Promise<IApiKeyState | null> | null),
        take(1)
      )
      .toPromise();
  }

  async apiKeyStateOrError(errorMessage: string = "Missing apiKey state"): Promise<IApiKeyState> {
    const apiKeyState = await this.apiKeyStateOrNull();

    if (!apiKeyState) {
      throw new Error(errorMessage);
    }

    return apiKeyState;
  }
}

export const apiKeyManager = new ApiKeyManager();
