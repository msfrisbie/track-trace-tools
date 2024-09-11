import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { ClientActions } from "@/store/page-overlay/modules/client/consts";
import { t3RequestManager } from "./t3-request-manager.module";

export enum T3AuthState {
  INITIAL = "INITIAL",
  AUTHENTICATED = "AUTHENTICATED",
  ERROR = "ERROR",
}

class ClientBuildManager implements IAtomicService {
  t3AuthState: T3AuthState = T3AuthState.INITIAL;

  logServerAuth: boolean = false;

  async init() {
    this.loadClientConfig();

    this.manageAuthState();
  }

  async loadClientConfig() {
    store.dispatch(`client/${ClientActions.UPDATE_CLIENT_VALUES}`);
  }

  async manageAuthState() {
    try {
      if (!t3RequestManager.t3RefreshToken) {
        console.log("No refresh token exists, authenticating");
        t3RequestManager.clearTokens();
        await this.t3AuthOrError();
      } else {
        console.log("Refresh token exists, refreshing");
        try {
          await this.refreshT3AuthTokenOrError();
        } catch {
          console.log("Failed to refresh, authenticating");
          t3RequestManager.clearTokens();
          await this.t3AuthOrError();
        }
      }

      await this.checkValidSessionOrError();

      this.initializeIntervalRefresh();

      this.setT3AuthState(T3AuthState.AUTHENTICATED);
    } catch (e) {
      console.error({ e });
      this.setT3AuthState(T3AuthState.ERROR);
      throw e;
    }
  }

  async t3AuthOrError() {
    const response = await t3RequestManager.t3SessionAuth();

    const { accessToken, refreshToken } = response.data;

    if (!accessToken || !refreshToken) {
      throw new Error(
        `Auth endpoint did not return required tokens: ${JSON.stringify(response.data)}`
      );
    }

    t3RequestManager.t3AccessToken = accessToken;
    t3RequestManager.t3RefreshToken = refreshToken;
  }

  async refreshT3AuthTokenOrError() {
    const response = await t3RequestManager.t3SessionRefresh();

    const { accessToken } = response.data;

    if (!accessToken) {
      throw new Error(
        `Refresh endpoint did not return required tokens: ${JSON.stringify(response.data)}`
      );
    }

    t3RequestManager.t3AccessToken = accessToken;
  }

  async checkValidSessionOrError() {
    console.log("Testing access token");
    // Test API key to ensure the credential mapping is still valid, otherwise dispose
    const response = await t3RequestManager.t3AuthCheck();
    if (response.status !== 200) {
      this.logServerAuth && console.log("Failed to refresh, authenticating");
      this.t3AuthOrError();
    } else {
      this.logServerAuth && console.log("Access token is valid");
    }
  }

  async initializeIntervalRefresh() {
    setInterval(async () => {
      this.logServerAuth && console.log("Interval token refresh");
      try {
        await this.refreshT3AuthTokenOrError();

        await this.checkValidSessionOrError();
      } catch {
        this.setT3AuthState(T3AuthState.ERROR);
      }
    }, 5 * 60 * 1000);
  }

  setT3AuthState(state: T3AuthState) {
    this.logServerAuth && console.log({ state });
    this.t3AuthState = state;
  }
}

export const clientBuildManager = new ClientBuildManager();
