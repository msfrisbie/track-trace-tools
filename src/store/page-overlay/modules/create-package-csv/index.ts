import { IPluginState } from "@/interfaces";
import { createPackageCsvTemplateSheetOrError } from "@/utils/sheets-export";
import { ActionContext } from "vuex";
import {
  CreatePackageCsvActions,
  CreatePackageCsvGetters,
  CreatePackageCsvMutations,
} from "./consts";
import { ICreatePackageCsvState } from "./interfaces";

const inMemoryState = {};

const persistedState = {};

const defaultState: ICreatePackageCsvState = {
  ...inMemoryState,
  ...persistedState,
};

export const createPackageCsvModule = {
  state: () => defaultState,
  mutations: {
    [CreatePackageCsvMutations.CREATE_PACKAGE_CSV_MUTATION](
      state: ICreatePackageCsvState,
      data: any
    ) {
      // state.data = data;
    },
  },
  getters: {
    [CreatePackageCsvGetters.CREATE_PACKAGE_CSV_GETTER]: (
      state: ICreatePackageCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [CreatePackageCsvActions.GENERATE_CSV_TEMPLATE]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        columns: string[]
      }
    ) => {
      await createPackageCsvTemplateSheetOrError(data.columns);
    },
  },
};

export const createPackageCsvReducer = (state: ICreatePackageCsvState): ICreatePackageCsvState => ({
  ...state,
  ...inMemoryState,
});
