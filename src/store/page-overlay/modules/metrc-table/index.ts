import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { MetrcTableActions, MetrcTableGetters, MetrcTableMutations } from './consts';
import { IMetrcTableState } from './interfaces';

const inMemoryState = {};

const persistedState = {};

const defaultState: IMetrcTableState = {
  ...inMemoryState,
  ...persistedState,
};

export const metrcTableModule = {
  state: () => defaultState,
  mutations: {
    [MetrcTableMutations.METRC_TABLE_MUTATION](state: IMetrcTableState, data: Partial<IMetrcTableState>) {
      (Object.keys(data) as Array<keyof IMetrcTableState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {
    [MetrcTableGetters.METRC_TABLE_GETTER]: (
      state: IMetrcTableState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [MetrcTableActions.METRC_TABLE_ACTION]: async (
      ctx: ActionContext<IMetrcTableState, IPluginState>,
      data: any,
    ) => {
      ctx.commit(MetrcTableMutations.METRC_TABLE_MUTATION, data as Partial<IMetrcTableState>);
    },
  },
};

export const metrcTableReducer = (state: IMetrcTableState): IMetrcTableState => ({
  ...state,
  ...inMemoryState,
});
