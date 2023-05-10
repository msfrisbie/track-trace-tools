import { IPackageData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { getActiveTransferPackageListOrNull } from "@/utils/transfer";
import _ from "lodash";
import { ActionContext } from "vuex";
import { BuilderType, MessageType } from "../../../../consts";
import { analyticsManager } from "../../../../modules/analytics-manager.module";
import { TransferBuilderActions, TransferBuilderGetters, TransferBuilderMutations } from "./consts";
import { ITransferBuilderState, ITransferBuilderUpdateData } from "./interfaces";

const inMemoryState = {
  originFacility: null,
  transporterFacility: null,
  destinationFacility: null,
  transferType: null,
  wholesalePackageValues: [],
  packageGrossWeights: [],
  packageGrossUnitsOfWeight: [],
  departureIsodate: "",
  departureIsotime: "",
  arrivalIsodate: "",
  arrivalIsotime: "",
  plannedRoute: "",
  driverName: "",
  driverEmployeeId: "",
  driverLicenseNumber: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleLicensePlate: "",
  phoneNumberForQuestions: "",
  isSameSiteTransfer: false,
  transferIdForUpdate: null
};

const persistedState = {
  transferPackageLists: []
};

const defaultState: ITransferBuilderState = {
  ...persistedState,
  ...inMemoryState
};

export const transferBuilderModule = {
  state: () => defaultState,
  mutations: {
    [TransferBuilderMutations.ADD_PACKAGE](
      state: ITransferBuilderState,
      { license, identity, pkg }: { license: string; identity: string; pkg: IPackageData }
    ) {
      if (!identity || !license) {
        throw new Error("Missing identity/license");
      }

      let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      if (!currentList) {
        currentList = {
          identity,
          license,
          packages: []
        };

        state.transferPackageLists.push(currentList);
      }

      const existingPackageIndex = currentList.packages.findIndex(x => x.Label === pkg.Label);

      if (existingPackageIndex >= 0) {
        currentList.packages.splice(existingPackageIndex, 1);
      }
      currentList.packages.push(pkg);

      currentList.packages.sort((a, b) => (a.Label > b.Label ? 1 : -1));
    },
    [TransferBuilderMutations.REMOVE_PACKAGE](
      state: ITransferBuilderState,
      { license, identity, pkg }: { license: string; identity: string; pkg: IPackageData }
    ) {
      if (!identity || !license) {
        throw new Error("Missing identity/license");
      }

      let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      if (!currentList) {
        return;
      }

      const existingPackageIndex = currentList.packages.findIndex(x => x.Label === pkg.Label);

      if (existingPackageIndex >= 0) {
        currentList.packages.splice(existingPackageIndex, 1);
      }
    },
    [TransferBuilderMutations.SET_PACKAGES](
      state: ITransferBuilderState,
      {
        license,
        identity,
        packages
      }: { license: string; identity: string; packages: IPackageData[] }
    ) {
      if (!identity || !license) {
        throw new Error("Missing identity/license");
      }

      let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      if (!currentList) {
        currentList = {
          identity,
          license,
          packages: []
        };

        state.transferPackageLists.push(currentList);
      }

      currentList.packages = packages;

      currentList.packages.sort((a, b) => (a.Label > b.Label ? 1 : -1));
    },
    [TransferBuilderMutations.UPDATE_TRANSFER_DATA](
      state: ITransferBuilderState,
      transferBuilderUpdateData: ITransferBuilderUpdateData
    ) {
      for (const [key, value] of Object.entries(transferBuilderUpdateData)) {
        // @ts-ignore
        state[key] = value;
      }
    },
    [TransferBuilderMutations.RESET_TRANSFER_DATA](state: ITransferBuilderState) {
      Object.assign(state, _.cloneDeep(defaultState));
    }
  },

  getters: {
    [TransferBuilderGetters.ACTIVE_PACKAGE_LIST]: (
      state: ITransferBuilderState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      if (!rootGetters.authState) {
        throw new Error("Missing identity/license");
      }

      const { identity, license } = rootGetters.authState;

      return (
        getActiveTransferPackageListOrNull({ state, identity, license }) || {
          license,
          identity,
          packages: []
        }
      );
    },
    [TransferBuilderGetters.IS_PACKAGE_IN_ACTIVE_LIST]: (
      state: ITransferBuilderState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => ({ pkg }: { pkg: IPackageData }): boolean => {
      if (!rootGetters.authState) {
        throw new Error("Missing identity/license");
      }

      const { identity, license } = rootGetters.authState;

      const activeList = getActiveTransferPackageListOrNull({ state, identity, license });

      if (!activeList) {
        return false;
      }

      return !!activeList.packages.find((x: IPackageData) => x.Label === pkg?.Label);
    }
  },

  actions: {
    [TransferBuilderActions.ADD_PACKAGE]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>,
      { pkg }: { pkg: IPackageData }
    ) => {
      const { identity, license } = ctx.rootGetters.authState;

      ctx.commit(TransferBuilderMutations.ADD_PACKAGE, { license, identity, pkg });

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Added a package to transfer list`,
        pkg
      });
    },
    [TransferBuilderActions.REMOVE_PACKAGE]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>,
      { pkg }: { pkg: IPackageData }
    ) => {
      const { identity, license } = ctx.rootGetters.authState;

      ctx.commit(TransferBuilderMutations.REMOVE_PACKAGE, { license, identity, pkg });

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Removed a package from the transfer list`,
        pkg
      });
    },
    [TransferBuilderActions.REFRESH_PACKAGES]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>
    ) => {
      const { identity, license } = ctx.rootGetters.authState;

      // This is an expensive method that should be called infrequently.
      // Package data may be removed or altered, so check if it is still active and update the data
      // const packageMap: Map<string, IPackageData> = new Map(activePackages.map((pkg) => [pkg.Label, pkg]));

      const refreshedPackages: IPackageData[] = [];

      // Removing and adding all packages will preserve order
      for (let pkg of ctx.getters[TransferBuilderGetters.ACTIVE_PACKAGE_LIST].packages) {
        // const match = packageMap.get(pkg.Label);
        try {
          const matchedPkg = await primaryDataLoader.activePackage(pkg.Label);

          refreshedPackages.push(pkg);
        } catch (e) {
          continue;
        }
      }

      ctx.commit(TransferBuilderMutations.SET_PACKAGES, {
        license,
        identity,
        packages: refreshedPackages
      });

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Finished resetting packages`
      });
    },
    [TransferBuilderActions.UPDATE_TRANSFER_DATA]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>,
      payload: ITransferBuilderUpdateData
    ) => {
      ctx.commit(TransferBuilderMutations.UPDATE_TRANSFER_DATA, payload);

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Update transfer data`,
        payload
      });
    },
    [TransferBuilderActions.RESET_TRANSFER_DATA]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>
    ) => {
      ctx.commit(TransferBuilderMutations.RESET_TRANSFER_DATA);

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Reset transfer data`
      });
    }
  }
};

export const transferBuilderReducer = (state: ITransferBuilderState): ITransferBuilderState => {
  return {
    ...state,
    ...inMemoryState
  };
};
