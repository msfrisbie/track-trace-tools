import { IAuthState, IPluginState } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { ActionContext } from "vuex";
import { PluginAuthActions, PluginAuthGetters, PluginAuthMutations } from "./consts";
import { IPluginAuthState } from "./interfaces";

const debugLog = debugLogFactory("plugin-auth/index.ts");

const inMemoryState = {
  authState: null,
};

const persistedState = {
  identity: null,
  token: null,
  tokenExpires: null,
  email: null,
  currentUser: null,
};

const defaultState: IPluginAuthState = {
  ...inMemoryState,
  ...persistedState,
};

export const pluginAuthModule = {
  state: () => defaultState,
  mutations: {
    [PluginAuthMutations.SET_AUTH](
      state: IPluginAuthState,
      { authState }: { authState: IAuthState | null }
    ) {
      state.authState = authState;
    },
    [PluginAuthMutations.SET_LOGIN_DATA](
      state: IPluginAuthState,
      { authState, token }: { authState: IAuthState; token: string }
    ) {
      const tokenParts = token.split(/\./);
      const tokenDecoded = JSON.parse(window.atob(tokenParts[1]));
      const tokenExpires = tokenDecoded.exp * 1000;
      const email = tokenDecoded.email;

      if (!email) {
        throw new Error("Could not decode email");
      }

      if (!tokenExpires) {
        throw new Error("Could not decode tokenExpires");
      }

      const identity = authState?.identity;

      if (!identity) {
        throw new Error("Could not get identity");
      }

      state.identity = identity;
      state.token = token;
      state.tokenExpires = tokenExpires;
      state.email = email;
    },
    [PluginAuthMutations.CLEAR_LOGIN_DATA](state: IPluginAuthState) {
      state.identity = null;
      state.token = null;
      state.tokenExpires = null;
      state.email = null;
    },
    [PluginAuthMutations.SET_CURRENT_USER_DATA](
      state: IPluginAuthState,
      { currentUser }: { currentUser: any }
    ) {
      if (!currentUser) {
        debugLog(async () => ["unable to set current user"]);
        throw new Error("Unable to set current user");
      }

      debugLog(async () => ["successfully set current user"]);

      state.currentUser = currentUser;
    },
    [PluginAuthMutations.CLEAR_CURRENT_USER_DATA](state: IPluginAuthState) {
      state.currentUser = null;
    },
  },
  getters: {
    [PluginAuthGetters.IS_AUTHENTICATED]: (
      state: IPluginAuthState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      if (rootState.pluginAuth.authState.identity != state.identity) {
        // Stored credentials must match current identity
        return false;
      }

      if (!state.token) {
        return false;
      }

      if (!state.tokenExpires) {
        return false;
      }

      if (state.tokenExpires < Date.now()) {
        return false;
      }

      // If the token exists and has not yet expired, assume authentiated
      return true;
    },
    [PluginAuthGetters.AUTH_STATE]: (
      state: IPluginAuthState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.authState || null;
    },
    [PluginAuthGetters.PACKAGES_URL]: (
      state: IPluginAuthState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.authState?.license
      ? `/industry/${state.authState?.license}/packages`
      : null;
    },
  },
  actions: {
    [PluginAuthActions.SET_AUTH](
      ctx: ActionContext<IPluginAuthState, IPluginState>,
      { authState }: { authState: IAuthState | null }
    ) {
      ctx.commit(PluginAuthMutations.SET_AUTH, { authState });
    },
  },
};

export const pluginAuthReducer = (state: IPluginAuthState): IPluginAuthState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
