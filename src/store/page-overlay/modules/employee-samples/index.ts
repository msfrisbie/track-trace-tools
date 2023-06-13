import { PackageState } from "@/consts";
import { IIndexedPackageData, IMetrcEmployeeData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { LRU } from "@/utils/cache";
import { getIsoDateFromOffset } from "@/utils/date";
import {
  canEmployeeAcceptSample,
  getAllocatedSamplesFromPackageHistoryOrError,
  getEstimatedNumberOfSamplesRemaining,
  getSampleAllocationFromAllocationDataOrNull,
  toNormalizedAllocationQuantity,
} from "@/utils/employee";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import {
  EmployeeSamplesActions,
  EmployeeSamplesGetters,
  EmployeeSamplesMutations,
  EmployeeSamplesState,
} from "./consts";
import { IEmployeeSamplesState, IHistoryAllocationData } from "./interfaces";

const inMemoryState = {
  toolState: EmployeeSamplesState.INITIAL,
  employees: [],
  selectedEmployeeIds: [],
  availableSamples: [],
  availableSamplePackages: [],
  selectedSamplePackageIds: [],
  modifiedSamplePackages: [],
  recordedAllocationBuffer: [],
  pendingAllocationBuffer: [],
  pendingAllocationBufferIds: [],
  // startDate: getIsoDateFromOffset(-30).split("T")[0],
  // endDate: todayIsodate(),
  daysInRange: 30,
  stateMessage: "",
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
    [EmployeeSamplesGetters.SELECTED_SAMPLE_ALLOCATIONS]: (
      state: IEmployeeSamplesState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.pendingAllocationBuffer.filter((x) =>
        state.pendingAllocationBufferIds.includes(x.uuid)
      );
    },
    [EmployeeSamplesGetters.DATE_GROUPED_AVAILABLE_SAMPLE_PACKAGES]: (
      state: IEmployeeSamplesState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      const dateGroups: Map<string, IIndexedPackageData[]> = new Map();

      for (const pkg of state.availableSamplePackages) {
        const isodate = pkg.ReceivedDateTime!.split("T")[0];
        if (!dateGroups.has(isodate)) {
          dateGroups.set(isodate, [pkg]);
        } else {
          dateGroups.get(isodate)!.push(pkg);
        }
      }

      return [...dateGroups];
    },
  },
  actions: {
    [EmployeeSamplesActions.RESET]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      ctx.state.toolState = EmployeeSamplesState.INITIAL;

      let packages: IIndexedPackageData[] = [];
      let employees: IMetrcEmployeeData[] = [];

      ctx.state.toolState = EmployeeSamplesState.LOADING;

      try {
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
          // Only select:
          // - trade samples
          // - nonzero quantity
          // - active
          .filter(
            (pkg) =>
              pkg.IsTradeSample && pkg.Quantity > 0 && pkg.PackageState === PackageState.ACTIVE
          )
          // Sorted in received order
          .sort((a, b) => a.ReceivedDateTime!.localeCompare(b.ReceivedDateTime!));
        ctx.state.selectedSamplePackageIds = ctx.state.availableSamplePackages.map((x) => x.Id);

        const daysAgoStart = ctx.state.daysInRange;

        const startDate = getIsoDateFromOffset(-1 * daysAgoStart).split("T")[0];

        ctx.state.modifiedSamplePackages = packages
          .filter((pkg) => pkg.IsTradeSample && pkg.LastModified >= startDate)
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

        if (ctx.state.employees.length === 0) {
          throw new Error("Zero employees found");
        }

        if (ctx.state.availableSamplePackages.length === 0) {
          throw new Error("Zero sample packages found");
        }

        ctx.state.toolState = EmployeeSamplesState.IDLE;
      } catch (e) {
        ctx.state.toolState = EmployeeSamplesState.ERROR;
        ctx.state.stateMessage = (e as any).toString();
      }
    },
    [EmployeeSamplesActions.TOGGLE_EMPLOYEE]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: { employeeId: number; remove?: boolean; add?: boolean }
    ) => {
      if (ctx.state.selectedEmployeeIds.includes(data.employeeId)) {
        if (data.add !== true) {
          ctx.state.selectedEmployeeIds = ctx.state.selectedEmployeeIds.filter(
            (x) => x !== data.employeeId
          );
        }
      } else {
        if (data.remove !== true) {
          ctx.state.selectedEmployeeIds.push(data.employeeId);
        }
      }
    },
    [EmployeeSamplesActions.TOGGLE_PACKAGE]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: { packageId: number; remove?: boolean; add?: boolean }
    ) => {
      if (ctx.state.selectedSamplePackageIds.includes(data.packageId)) {
        if (data.add !== true) {
          ctx.state.selectedSamplePackageIds = ctx.state.selectedSamplePackageIds.filter(
            (x) => x !== data.packageId
          );
        }
      } else {
        if (data.remove !== true) {
          ctx.state.selectedSamplePackageIds.push(data.packageId);
        }
      }
    },
    [EmployeeSamplesActions.TOGGLE_SAMPLE_ALLOCATION]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: { uuid: string; remove?: boolean; add?: boolean }
    ) => {
      if (ctx.state.pendingAllocationBufferIds.includes(data.uuid)) {
        if (data.add !== true) {
          ctx.state.pendingAllocationBufferIds = ctx.state.pendingAllocationBufferIds.filter(
            (x) => x !== data.uuid
          );
        }
      } else {
        if (data.remove !== true) {
          ctx.state.pendingAllocationBufferIds.push(data.uuid);
        }
      }
    },
    [EmployeeSamplesActions.ALLOCATE_SAMPLES]: async (
      ctx: ActionContext<IEmployeeSamplesState, IPluginState>,
      data: any
    ) => {
      try {
        ctx.state.toolState = EmployeeSamplesState.ALLOCATION_INFLIGHT;

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!ctx.state.modifiedSamplePackages.length) {
          console.error("Zero allocations");
        }

        ctx.state.availableSamples = [];

        // Record all samples that need to be given out
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

        // Parse package history to determine previous allocations
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

        // recordedAllocationBuffer is now up to date,
        // and availableSamples has all samples that might be distributed

        for (const daysAgo of [120, 90, 60, 30]) {
          let skippedSamples = [];

          const distributionDate = getIsoDateFromOffset(-1 * (daysAgo - 30)).split("T")[0];

          while (ctx.state.availableSamples.length > 0) {
            const currentSample = ctx.state.availableSamples.shift()!;

            // TODO: check if there are any distributions 30 days upstream of this
            for (const employee of employeeLRU.elementsReversed) {
              if (
                await canEmployeeAcceptSample(
                  employee,
                  currentSample,
                  distributionDate,
                  ctx.state.recordedAllocationBuffer.filter(
                    (allocation) => allocation.pkg.ReceivedDateTime! <= distributionDate
                  ),
                  ctx.state.pendingAllocationBuffer.filter(
                    (allocation) => allocation.pkg.ReceivedDateTime! <= distributionDate
                  )
                )
              ) {
                // Record allocation
                ctx.state.pendingAllocationBuffer.push({
                  uuid: uuidv4(),
                  pkg: currentSample.pkg,
                  employee,
                  distributionDate,
                  adjustmentQuantity: currentSample.quantity,
                  ...(await toNormalizedAllocationQuantity(
                    currentSample.pkg,
                    currentSample.quantity
                  )),
                });

                // Send employee to back of queue
                employeeLRU.touch(employee);

                continue;
              }
            }

            skippedSamples.push(currentSample);
          }
          ctx.state.availableSamples = [...skippedSamples, ...ctx.state.availableSamples];
        }

        ctx.state.pendingAllocationBufferIds = ctx.state.pendingAllocationBuffer.map((x) => x.uuid);

        ctx.state.toolState = EmployeeSamplesState.ALLOCATION_SUCCESS;
      } catch (e) {
        ctx.state.toolState = EmployeeSamplesState.ERROR;
        ctx.state.stateMessage = (e as any).toString();
      }
    },
  },
};

export const employeeSamplesReducer = (state: IEmployeeSamplesState): IEmployeeSamplesState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
