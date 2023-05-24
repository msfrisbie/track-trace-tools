import { IIndexedPackageData, IMetrcEmployeeData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ActionContext } from "vuex";
import { EmployeeSamplesActions, EmployeeSamplesGetters, EmployeeSamplesMutations } from "./consts";
import { IEmployeeSamplesState } from "./interfaces";

const inMemoryState = {
  employees: [],
  availableSamplePackages: [],
};

const persistedState = {};

const defaultState: IEmployeeSamplesState = {
  ...inMemoryState,
  ...persistedState,
};

export const employeeSamplesModule = {
  state: () => defaultState,
  mutations: {
    [EmployeeSamplesMutations.UPDATE_DATA](
      state: IEmployeeSamplesState,
      payload: {
        employees?: IMetrcEmployeeData[];
        availableSamplePackages?: IIndexedPackageData[];
      }
    ) {
      for (const [key, value] of Object.entries(payload)) {
        // @ts-ignore
        state[key] = value;
      }
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
    [EmployeeSamplesActions.LOAD_OBJECTS]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      const payload = {
        employees: await primaryDataLoader.employees(),
        availableSamplePackages: (await primaryDataLoader.activePackages()).filter(
          (pkg) => pkg.IsTradeSample && pkg.Quantity > 0
        ),
      };

      ctx.commit(EmployeeSamplesMutations.UPDATE_DATA, payload);
    },
  },
};

export const employeeSamplesReducer = (state: IEmployeeSamplesState): IEmployeeSamplesState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
