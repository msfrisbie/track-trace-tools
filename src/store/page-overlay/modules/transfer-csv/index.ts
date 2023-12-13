import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { TransferCsvActions, TransferCsvGetters, TransferCsvMutations } from "./consts";
import { ITransferCsvState } from "./interfaces";

const inMemoryState = {
  transferModalDetected: false,
};

const persistedState = {};

const defaultState: ITransferCsvState = {
  ...inMemoryState,
  ...persistedState,
};

export const transferCsvModule = {
  state: () => defaultState,
  mutations: {
    [TransferCsvMutations.TRANSFER_CSV_MUTATION](state: ITransferCsvState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [TransferCsvGetters.TRANSFER_CSV_GETTER]: (
      state: ITransferCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [TransferCsvActions.TRANSFER_CSV_ACTION]: async (
      ctx: ActionContext<ITransferCsvState, IPluginState>,
      data: any
    ) => {
      ctx.commit(TransferCsvMutations.TRANSFER_CSV_MUTATION, data);
    },
  },
};

export const transferCsvReducer = (state: ITransferCsvState): ITransferCsvState => ({
  ...state,
  ...inMemoryState,
});
