import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { LabCsvActions, LabCsvGetters, LabCsvMutations } from './consts';
import { ILabCsvState } from './interfaces';

const inMemoryState = {};

const persistedState = {};

const defaultState: ILabCsvState = {
  ...inMemoryState,
  ...persistedState,
};

export const labCsvModule = {
  state: () => defaultState,
  mutations: {
    [LabCsvMutations.LAB_CSV_MUTATION](state: ILabCsvState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [LabCsvGetters.LAB_CSV_GETTER]: (
      state: ILabCsvState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [LabCsvActions.LAB_CSV_ACTION]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: any,
    ) => {
      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, data);
    },
  },
};

export const labCsvReducer = (state: ILabCsvState): ILabCsvState => ({
  ...state,
  ...inMemoryState,
});
