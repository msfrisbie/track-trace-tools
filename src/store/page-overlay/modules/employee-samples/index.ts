import { PackageState } from "@/consts";
import { IIndexedPackageData, IMetrcEmployeeData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { getIsoDateFromOffset } from "@/utils/date";
import { ActionContext } from "vuex";
import { EmployeeSamplesActions, EmployeeSamplesGetters, EmployeeSamplesMutations } from "./consts";
import { IEmployeeSamplesState } from "./interfaces";

const inMemoryState = {
  loadInflight: false,
  employees: [],
  availableSamplePackages: [],
  modifiedSamplePackages: [],
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
        modifiedSamplePackages?: IIndexedPackageData[];
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
    [EmployeeSamplesActions.ALLOCATE_SAMPLES]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      // ctx.commit(EmployeeSamplesMutations.EMPLOYEE_SAMPLES_MUTATION, data);
      
    },
    [EmployeeSamplesActions.LOAD_OBJECTS]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      let packages: IIndexedPackageData[] = [];
      let employees: IMetrcEmployeeData[] = [];

      ctx.state.loadInflight = true;

      const promises: Promise<any>[] = [
        primaryDataLoader.activePackages().then((result) => {
          packages = [...packages, ...result];
        }),
        primaryDataLoader.inactivePackages().then((result) => {
          packages = [...packages, ...result];
        }),
        primaryDataLoader.employees().then((result) => {
          employees = result;
        }),
      ];

      await Promise.allSettled(promises);

      // Only consider packages recieved from a separate facility
      packages = packages.filter((pkg) => (pkg.ReceivedFromManifestNumber ?? "").length > 0);

      const slidingWindowIsodate = getIsoDateFromOffset(-180);

      ctx.state.employees = employees;
      ctx.state.availableSamplePackages = packages.filter(
        (pkg) => pkg.IsTradeSample && pkg.Quantity > 0 && pkg.PackageState === PackageState.ACTIVE
      );
      ctx.state.modifiedSamplePackages = packages.filter(
        (pkg) => pkg.IsTradeSample //&& pkg.LastModified >= slidingWindowIsodate
      );

      ctx.state.modifiedSamplePackages.map((pkg) => {
        promises.push(
          primaryDataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
            pkg.history = history;
          })
        );
      });

      await Promise.allSettled(promises);

      ctx.state.loadInflight = false;
    },
  },
};

export const employeeSamplesReducer = (state: IEmployeeSamplesState): IEmployeeSamplesState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
