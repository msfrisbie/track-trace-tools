import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { ExampleActions, ExampleGetters, ExampleMutations } from "../package-history";
import { IExampleState } from "../package-history/interfaces";

const inMemoryState = {};

const persistedState = {};

const defaultState: IExampleState = {
  ...inMemoryState,
  ...persistedState,
};

export const flagsModule = {
  state: () => defaultState,
  mutations: {
    [ExampleMutations.EXAMPLE_MUTATION](state: IExampleState, data: any) {},
  },
  getters: {
    [ExampleGetters.EXAMPLE_GETTER]: (
      state: IExampleState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {},
  },
  actions: {
    [ExampleActions.EXAMPLE_ACTION](ctx: ActionContext<IExampleState, IPluginState>, data: any) {
      ctx.commit(ExampleMutations.EXAMPLE_MUTATION, data);
    },
  },
};

export const exampleReducer = (state: IExampleState): IExampleState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
