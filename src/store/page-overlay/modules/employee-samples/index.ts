import { PackageState } from "@/consts";
import { IIndexedPackageData, IMetrcEmployeeData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { LRU } from "@/utils/cache";
import { getIsoDateFromOffset, todayIsodate } from "@/utils/date";
import {
  canEmployeeAcceptSample,
  getAllocatedSamplesFromPackageHistoryOrError,
  getEstimatedNumberOfSamplesRemaining,
  getSampleAllocationFromAllocationDataOrNull,
  toNormalizedAllocationQuantity,
} from "@/utils/employee";
import { ActionContext } from "vuex";
import {
  EmployeeSamplesActions,
  EmployeeSamplesGetters,
  EmployeeSamplesMutations,
  EmployeeSamplesState,
} from "./consts";
import { IEmployeeSamplesState, IHistoryAllocationData } from "./interfaces";

const inMemoryState = {
  state: EmployeeSamplesState.INITIAL,
  employees: [],
  selectedEmployeeIds: [],
  availableSamples: [],
  availableSamplePackages: [],
  selectedSamplePackageIds: [],
  modifiedSamplePackages: [],
  recordedAllocationBuffer: [],
  pendingAllocationBuffer: [],
  startDate: getIsoDateFromOffset(-30).split("T")[0],
  endDate: todayIsodate(),
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
    [EmployeeSamplesGetters.SELECTED_EMPLOYEES]: (
      state: IEmployeeSamplesState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.employees.filter((x) => state.selectedEmployeeIds.includes(x.Id));
    },
    [EmployeeSamplesGetters.SELECTED_SAMPLE_PACKAGES]: (
      state: IEmployeeSamplesState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.availableSamplePackages.filter((x) =>
        state.selectedSamplePackageIds.includes(x.Id)
      );
    },
  },
  actions: {
    [EmployeeSamplesActions.LOAD_OBJECTS]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      let packages: IIndexedPackageData[] = [];
      let employees: IMetrcEmployeeData[] = [];

      ctx.state.state = EmployeeSamplesState.LOADING;

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

      ctx.state.employees = employees;
      ctx.state.selectedEmployeeIds = employees.map((x) => x.Id);

      ctx.state.availableSamplePackages = packages
        .filter(
          (pkg) => pkg.IsTradeSample && pkg.Quantity > 0 && pkg.PackageState === PackageState.ACTIVE
        )
        // Sorted in received order
        .sort((a, b) => a.ReceivedDateTime!.localeCompare(b.ReceivedDateTime!));
      ctx.state.selectedSamplePackageIds = ctx.state.availableSamplePackages.map((x) => x.Id);

      ctx.state.modifiedSamplePackages = packages
        .filter((pkg) => pkg.IsTradeSample && pkg.LastModified >= ctx.state.startDate)
        // Sorted in received order
        .sort((a, b) => a.ReceivedDateTime!.localeCompare(b.ReceivedDateTime!));

      ctx.state.modifiedSamplePackages.map((pkg) => {
        promises.push(
          primaryDataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
            pkg.history = history;
          })
        );
      });

      await Promise.allSettled(promises);

      ctx.state.state = EmployeeSamplesState.IDLE;
    },
    [EmployeeSamplesActions.TOGGLE_EMPLOYEE]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: { employeeId: number }
    ) => {
      if (ctx.state.selectedEmployeeIds.includes(data.employeeId)) {
        ctx.state.selectedEmployeeIds = ctx.state.selectedEmployeeIds.filter(
          (x) => x !== data.employeeId
        );
      } else {
        ctx.state.selectedEmployeeIds.push(data.employeeId);
      }
    },
    [EmployeeSamplesActions.TOGGLE_PACKAGE]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: { packageId: number }
    ) => {
      if (ctx.state.selectedSamplePackageIds.includes(data.packageId)) {
        ctx.state.selectedSamplePackageIds = ctx.state.selectedSamplePackageIds.filter(
          (x) => x !== data.packageId
        );
      } else {
        ctx.state.selectedSamplePackageIds.push(data.packageId);
      }
    },
    [EmployeeSamplesActions.ALLOCATE_SAMPLES]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      ctx.state.state = EmployeeSamplesState.ALLOCATION_INFLIGHT;

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!ctx.state.modifiedSamplePackages.length) {
        console.error("Zero allocations");
      }

      ctx.state.availableSamples = [];

      for (const pkg of ctx.getters[EmployeeSamplesGetters.SELECTED_SAMPLE_PACKAGES]) {
        const sampleCount = getEstimatedNumberOfSamplesRemaining(pkg);
        const perSampleQuantity = pkg.Quantity / sampleCount;

        for (let i = 0; i < sampleCount; ++i) {
          ctx.state.availableSamples.push({
            pkg,
            quantity: perSampleQuantity,
            allocation: await toNormalizedAllocationQuantity(pkg, perSampleQuantity),
          });
        }
      }

      ctx.state.pendingAllocationBuffer = [];
      ctx.state.recordedAllocationBuffer = [];

      const employeeLRU = new LRU<IMetrcEmployeeData>(
        ctx.getters[EmployeeSamplesGetters.SELECTED_EMPLOYEES]
      );

      const allocationDataList: IHistoryAllocationData[] = [];

      if (ctx.state.modifiedSamplePackages.length === 0) {
        console.log("Zero modified packages");
      }

      for (const pkg of ctx.state.modifiedSamplePackages) {
        for (const allocationData of getAllocatedSamplesFromPackageHistoryOrError(pkg)) {
          allocationDataList.push(allocationData);
        }
      }

      allocationDataList.sort((a, b) => (a.isodate > b.isodate ? 1 : -1));

      for (const allocationData of allocationDataList) {
        const employee = employeeLRU.elements.find(
          (x) =>
            parseInt(x.License.Number, 10) === parseInt(allocationData.employeeLicenseNumber, 10)
        );

        if (!employee) {
          console.warn(
            `No match for employee with license # ${allocationData.employeeLicenseNumber} (${allocationData.employeeName}) (${allocationData.packageLabel})`
          );
          continue;
        }

        employeeLRU.touch(employee);

        const allocation = await getSampleAllocationFromAllocationDataOrNull(
          employeeLRU.elements,
          ctx.state.modifiedSamplePackages,
          allocationData
        );

        if (!allocation) {
          console.error(`Unable to generate allocation`);
          continue;
        }

        ctx.state.recordedAllocationBuffer.push(allocation);
      }

      while (true) {
        if (ctx.state.availableSamples.length === 0) {
          break;
        }

        const currentSample = ctx.state.availableSamples.shift()!;

        for (const employee of employeeLRU.elementsReversed) {
          if (
            await canEmployeeAcceptSample(
              employee,
              currentSample,
              ctx.state.recordedAllocationBuffer,
              ctx.state.pendingAllocationBuffer
            )
          ) {
            // Record allocation
            ctx.state.pendingAllocationBuffer.push({
              pkg: currentSample.pkg,
              employee,
              adjustmentQuantity: currentSample.quantity,
              ...(await toNormalizedAllocationQuantity(currentSample.pkg, currentSample.quantity)),
            });

            // Send employee to back of queue
            employeeLRU.touch(employee);

            break;
          }
        }
      }

      ctx.state.state = EmployeeSamplesState.ALLOCATION_SUCCESS;
    },
  },
};

export const employeeSamplesReducer = (state: IEmployeeSamplesState): IEmployeeSamplesState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
