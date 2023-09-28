import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { TransferPackageSearchMutations, TransferPackageSearchGetters, TransferPackageSearchActions } from "./consts";
import { ITransferPackageSearchState } from "./interfaces";

const inMemoryState = {
  startDate: null
};

const persistedState = {};

const defaultState: ITransferPackageSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const transferPackageSearchModule = {
  state: () => defaultState,
  mutations: {
    [TransferPackageSearchMutations.TRANSFER_PACKAGE_SEARCH_MUTATION](state: ITransferPackageSearchState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [TransferPackageSearchGetters.TRANSFER_PACKAGE_SEARCH_GETTER]: (
      state: ITransferPackageSearchState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [TransferPackageSearchActions.TRANSFER_PACKAGE_SEARCH_ACTION]: async (
      ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
      data: any
    ) => {
      ctx.commit(TransferPackageSearchMutations.TRANSFER_PACKAGE_SEARCH_MUTATION, data);
    },
  },
};

export const transferPackageSearchReducer = (state: ITransferPackageSearchState): ITransferPackageSearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
