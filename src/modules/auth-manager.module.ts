import { MessageType } from "@/consts";
import { IAtomicService, IAuthState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { customFetch } from "@/modules/fetch-manager.module";
import store from "@/store/page-overlay";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { isIdentityAllowedToUseTtt } from "@/utils/access-control";
import { debugLogFactory } from "@/utils/debug";
import { extract, ExtractionType } from "@/utils/html";

// Plugin scripts are sandboxed from the window variables.
// It would be more efficient to pull them from the window.$.ajaxSettings,
// but this would require a background.js relay
//
// https://bugsdb.com/_en/debug/0900b7e92628668f766f637cec8fa822
//
// authState.license = ajaxSettings.headers["X-Metrc-LicenseNumber"];
// authState.apiVerificationToken = ajaxSettings.headers["ApiVerificationToken"];

const debugLog = debugLogFactory("auth-manager.module.ts");

class AuthManager implements IAtomicService {
  private _authStatePromise: Promise<IAuthState | null>;
  private _authStateResolver: any;

  constructor() {
    // Assumes that the auth can be in exactly one state per page load
    this._authStatePromise = new Promise((resolve, reject) => {
      // If auth state cant be acquired in 10s, timeout
      const id = setTimeout(() => reject("Auth state timed out"), 10000);

      this._authStateResolver = (authState: any) => {
        clearTimeout(id);
        resolve(authState);
      };
    });

    this._authStatePromise.then((authState) =>
      store.dispatch(`pluginAuth/${PluginAuthActions.SET_AUTH}`, { authState })
    );
  }

  public async init() {
    // Options:
    //
    // - Authstate is visible in the page.
    //       Definitly authenticated
    // - Authstate is not visible in the page, no auth in state.
    //       Definitely logged out
    // - Authstate is not visible in the page, auth in state.
    //       Send test request to find if authenticated.

    let identity: string | null = null,
      license: string | null = null,
      apiVerificationToken: string | null = null;

    let extractedAuthData = extract(ExtractionType.AUTH_DATA, document.body.innerHTML);

    if (extractedAuthData && extractedAuthData.authData) {
      ({ identity, license, apiVerificationToken } = extractedAuthData.authData);
    }

    if (!identity || !license || !apiVerificationToken) {
      debugLog(async () => ["Fetching remote auth data"]);
      // Data was not found in the page.
      // Piggyback on browser cookies/redirect and load the initial logged in page, which should have credentials
      const loadedHTML = await customFetch(window.location.origin).then((response) =>
        response.text()
      );

      extractedAuthData = extract(ExtractionType.AUTH_DATA, loadedHTML);

      if (extractedAuthData && extractedAuthData.authData) {
        ({ identity, license, apiVerificationToken } = extractedAuthData.authData);
      }
    }

    // Check if identity matches blacklist. Identity matching will only work in CA
    if (!!identity) {
      if (!isIdentityAllowedToUseTtt({ identity, hostname: window.location.hostname })) {
        analyticsManager.track(MessageType.MATCHED_BLACKLIST_HOSTNAME, {
          identity,
        });

        this.resolveAuthState(null);
        return;
      }
    }

    if (!!identity && !!license && !!apiVerificationToken) {
      this.resolveAuthState({
        identity,
        license,
        apiVerificationToken,
        hostname: window.location.hostname,
      });

      return;
    }

    this.resolveAuthState(null);
  }

  private async resolveAuthState(authState: IAuthState | null) {
    debugLog(async () => ["Resolving:", authState]);

    this._authStateResolver(authState);
  }

  async authStateOrNull(): Promise<IAuthState | null> {
    try {
      if (store.state.pluginAuth.authState) {
        return store.state.pluginAuth.authState;
      }

      return await this._authStatePromise;
    } catch (e) {
      return null;
    }
  }

  syncAuthStateOrError(errorMessage: string = "Missing auth state") {
    if (store.state.pluginAuth.authState) {
      return store.state.pluginAuth.authState;
    }

    throw new Error(errorMessage);
  }

  async authStateOrError(errorMessage: string = "Missing auth state"): Promise<IAuthState> {
    if (store.state.pluginAuth.authState) {
      return store.state.pluginAuth.authState;
    }

    const authState = await this.authStateOrNull();

    if (!authState) {
      throw new Error(errorMessage);
    }

    return authState;
  }
}

export let authManager = new AuthManager();
