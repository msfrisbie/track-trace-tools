import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { DestroyPlantBatchesActions, DestroyPlantBatchesGetters, DestroyPlantBatchesMutations } from './consts';
import { IDestroyPlantBatchesState } from './interfaces';

const inMemoryState = {};

const persistedState = {};

const defaultState: IDestroyPlantBatchesState = {
  ...inMemoryState,
  ...persistedState,
};

export const destroyPlantBatchesModule = {
  state: () => defaultState,
  mutations: {
    [DestroyPlantBatchesMutations.DESTROY_PLANT_BATCHES_MUTATION](state: IDestroyPlantBatchesState, data: Partial<IDestroyPlantBatchesState>) {
      (Object.keys(data) as Array<keyof IDestroyPlantBatchesState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {
    [DestroyPlantBatchesGetters.DESTROY_PLANT_BATCHES_GETTER]: (
      state: IDestroyPlantBatchesState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [DestroyPlantBatchesActions.DESTROY_PLANT_BATCHES_ACTION]: async (
      ctx: ActionContext<IDestroyPlantBatchesState, IPluginState>,
      data: any,
    ) => {
      ctx.commit(DestroyPlantBatchesMutations.DESTROY_PLANT_BATCHES_MUTATION, data as Partial<IDestroyPlantBatchesState>);
    },
  },
};

export const destroyPlantBatchesReducer = (state: IDestroyPlantBatchesState): IDestroyPlantBatchesState => ({
  ...state,
  ...inMemoryState,
});
