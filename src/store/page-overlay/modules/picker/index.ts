import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { PickerActions, PickerGetters, PickerMutations } from './consts';
import { IPickerState } from './interfaces';

const inMemoryState = {};

const persistedState = {};

const defaultState: IPickerState = {
  ...inMemoryState,
  ...persistedState,
};

export const pickerModule = {
  state: () => defaultState,
  mutations: {
    [PickerMutations.PICKER_MUTATION](state: IPickerState, data: Partial<IPickerState> = {}) {
      (Object.keys(data) as Array<keyof IPickerState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {
    [PickerGetters.PICKER_GETTER]: (
      state: IPickerState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [PickerActions.PICKER_ACTION]: async (
      ctx: ActionContext<IPickerState, IPluginState>,
      actionData: Partial<IPickerState> = {},
    ) => {
      const mutationData: Partial<IPickerState> = {};

      ctx.commit(PickerMutations.PICKER_MUTATION, mutationData);
    },
  },
};

export const pickerReducer = (state: IPickerState): IPickerState => ({
  ...state,
  ...inMemoryState,
});
