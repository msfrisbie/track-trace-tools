import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { ExampleActions, ExampleGetters, ExampleMutations } from './consts';
import { IExampleState } from './interfaces';

const inMemoryState = {};

const persistedState = {};

const defaultState: IExampleState = {
  ...inMemoryState,
  ...persistedState,
};

export const exampleModule = {
  state: () => defaultState,
  mutations: {
    [ExampleMutations.EXAMPLE_MUTATION](state: IExampleState, data: Partial<IExampleState> = {}) {
      (Object.keys(data) as Array<keyof IExampleState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {
    [ExampleGetters.EXAMPLE_GETTER]: (
      state: IExampleState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [ExampleActions.EXAMPLE_ACTION]: async (
      ctx: ActionContext<IExampleState, IPluginState>,
      actionData: Partial<IExampleState> = {},
    ) => {
      const mutationData: Partial<IExampleState> = {};

      ctx.commit(ExampleMutations.EXAMPLE_MUTATION, mutationData);
    },
  },
};

export const exampleReducer = (state: IExampleState): IExampleState => ({
  ...state,
  ...inMemoryState,
});
