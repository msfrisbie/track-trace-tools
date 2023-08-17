import { IPluginState } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { ActionContext } from "vuex";
import { ClientActions, ClientGetters, ClientMutations } from "../client/consts";
import { IClientState } from "../client/interfaces";

const inMemoryState = {};

const persistedState = {
  clientName: null,
  values: {},
};

const defaultState: IClientState = {
  ...inMemoryState,
  ...persistedState,
};

export const clientModule = {
  state: () => defaultState,
  mutations: {
    [ClientMutations.CLIENT_MUTATION](state: IClientState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [ClientGetters.CLIENT_GETTER]: (
      state: IClientState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [ClientActions.LOAD_CLIENT_VALUES]: async (
      ctx: ActionContext<IClientState, IPluginState>,
      data: any
    ) => {
      const response = await t3RequestManager.loadClientValues(ctx.rootState.settings.licenseKey);

      const { client_name, values } = response.data;

      console.log({ client_name, data });

      ctx.state.clientName = client_name;
      ctx.state.values = values;
    },
  },
};

export const clientReducer = (state: IClientState): IClientState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
