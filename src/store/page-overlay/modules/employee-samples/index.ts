import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { EmployeeSamplesActions, EmployeeSamplesGetters, EmployeeSamplesMutations } from "./consts";
import { IEmployeeSamplesState } from "./interfaces";

const inMemoryState = {};

const persistedState = {};

const defaultState: IEmployeeSamplesState = {
  ...inMemoryState,
  ...persistedState,
};

export const employeeSamplesModule = {
  state: () => defaultState,
  mutations: {
    [EmployeeSamplesMutations.EMPLOYEE_SAMPLES_MUTATION](state: IEmployeeSamplesState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [EmployeeSamplesGetters.EMPLOYEE_SAMPLES_GETTER]: (
      state: IEmployeeSamplesState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [EmployeeSamplesActions.EMPLOYEE_SAMPLES_ACTION]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      ctx.commit(EmployeeSamplesMutations.EMPLOYEE_SAMPLES_MUTATION, data);
    },
  },
};

export const employeeSamplesReducer = (state: IEmployeeSamplesState): IEmployeeSamplesState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
