import {
  IIndexedTransferData,
  IPackageData,
  IPluginState,
  IUnionIndexedPackageData,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { todayIsodate } from "@/utils/date";
import { getLabelOrError } from "@/utils/package";
// import { getActiveTransferPackageListOrNull } from "@/utils/transfer";
import _ from "lodash";
import { ActionContext } from "vuex";
import { BuilderType, MessageType } from "../../../../consts";
import { analyticsManager } from "../../../../modules/analytics-manager.module";
import { TransferBuilderActions, TransferBuilderGetters, TransferBuilderMutations } from "./consts";
import { DriverLayoverLeg, ITransferBuilderState, ITransferBuilderUpdateData } from "./interfaces";

const inMemoryState = {
  originFacility: null,
  transporterFacility: null,
  destinationFacility: null,
  transferType: null,
  wholesalePackageValues: [],
  packageGrossWeights: [],
  packageGrossUnitsOfWeight: [],
  destinationGrossWeight: null,
  destinationGrossUnitOfWeight: null,
  departureIsodate: todayIsodate(),
  departureIsotime: "10:00:00.000",
  arrivalIsodate: todayIsodate(),
  arrivalIsotime: "14:00:00.000",
  layoverCheckInIsodate: todayIsodate(),
  layoverCheckInIsotime: "10:00:00.000",
  layoverCheckOutIsodate: todayIsodate(),
  layoverCheckOutIsotime: "14:00:00.000",
  plannedRoute: "",
  driverName: "",
  driverEmployeeId: "",
  driverLicenseNumber: "",
  driverLayoverLeg: "FromAndToLayover" as DriverLayoverLeg,
  vehicleMake: "",
  vehicleModel: "",
  vehicleLicensePlate: "",
  phoneNumberForQuestions: "",
  isSameSiteTransfer: false,
  isLayover: false,
  transferForUpdate: null,
  transferPackageList: [],
};

const persistedState = {};

const defaultState: ITransferBuilderState = {
  ...persistedState,
  ...inMemoryState,
};

export const transferBuilderModule = {
  state: () => defaultState,
  mutations: {
    [TransferBuilderMutations.ADD_PACKAGE](
      state: ITransferBuilderState,
      {
        license,
        identity,
        pkg,
      }: { license: string; identity: string; pkg: IUnionIndexedPackageData }
    ) {
      if (!identity || !license) {
        throw new Error("Missing identity/license");
      }

      // let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      // if (!currentList) {
      //   currentList = {
      //     identity,
      //     license,
      //     packages: [],
      //   };

      //   state.transferPackageLists.push(currentList);
      // }

      const existingPackageIndex = state.transferPackageList.findIndex(
        (x) => getLabelOrError(x) === getLabelOrError(pkg)
      );

      if (existingPackageIndex >= 0) {
        state.transferPackageList.splice(existingPackageIndex, 1);
      }
      state.transferPackageList.push(pkg);

      state.transferPackageList.sort((a, b) => (getLabelOrError(a) > getLabelOrError(b) ? 1 : -1));
    },
    [TransferBuilderMutations.REMOVE_PACKAGE](
      state: ITransferBuilderState,
      {
        license,
        identity,
        pkg,
      }: { license: string; identity: string; pkg: IUnionIndexedPackageData }
    ) {
      // if (!identity || !license) {
      //   throw new Error("Missing identity/license");
      // }

      // let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      // if (!currentList) {
      //   return;
      // }

      const existingPackageIndex = state.transferPackageList.findIndex(
        (x) => getLabelOrError(x) === getLabelOrError(pkg)
      );

      if (existingPackageIndex >= 0) {
        state.transferPackageList.splice(existingPackageIndex, 1);
        state.wholesalePackageValues.splice(existingPackageIndex, 1);
        state.packageGrossWeights.splice(existingPackageIndex, 1);
        state.packageGrossUnitsOfWeight.splice(existingPackageIndex, 1);
      }
    },
    [TransferBuilderMutations.SET_PACKAGES](
      state: ITransferBuilderState,
      {
        license,
        identity,
        packages,
      }: { license: string; identity: string; packages: IUnionIndexedPackageData[] }
    ) {
      // if (!identity || !license) {
      //   throw new Error("Missing identity/license");
      // }

      // let currentList = getActiveTransferPackageListOrNull({ state, identity, license });

      // if (!currentList) {
      //   currentList = {
      //     identity,
      //     license,
      //     packages: [],
      //   };

      //   state.transferPackageLists.push(currentList);
      // }

      // currentList.packages = packages;

      // currentList.packages.sort((a, b) => (getLabelOrError(a) > getLabelOrError(b) ? 1 : -1));

      state.transferPackageList = packages.sort((a, b) =>
        getLabelOrError(a) > getLabelOrError(b) ? 1 : -1
      );
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
    [TransferBuilderMutations.SET_TRANSFER_FOR_UPDATE](
      state: ITransferBuilderState,
      { transferForUpdate }: { transferForUpdate: IIndexedTransferData | null }
    ) {
      state.transferForUpdate = transferForUpdate;
    },
    [TransferBuilderMutations.RESET_TRANSFER_DATA](state: ITransferBuilderState) {
      Object.assign(state, _.cloneDeep(defaultState));
    },
  },

  getters: {
    [TransferBuilderGetters.ACTIVE_PACKAGE_LIST]: (
      state: ITransferBuilderState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      return state.transferPackageList;
      // if (!rootGetters.authState) {
      //   throw new Error("Missing identity/license");
      // }

      // const { identity, license } = rootGetters.authState;

      // return (
      //   getActiveTransferPackageListOrNull({ state, identity, license }) || {
      //     license,
      //     identity,
      //     packages: [],
      //   }
      // );
    },
    [TransferBuilderGetters.IS_PACKAGE_IN_ACTIVE_LIST]:
      (state: ITransferBuilderState, getters: any, rootState: any, rootGetters: any) =>
      ({ pkg }: { pkg: IUnionIndexedPackageData }): boolean => {
        if (!rootGetters.authState) {
          throw new Error("Missing identity/license");
        }

        // const { identity, license } = rootGetters.authState;

        // const activeList = getActiveTransferPackageListOrNull({ state, identity, license });

        // if (!activeList) {
        //   return false;
        // }

        return !!state.transferPackageList.find((x) => getLabelOrError(x) === getLabelOrError(pkg));
      },
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
        pkg,
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
        pkg,
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
      for (let pkg of ctx.getters[TransferBuilderGetters.ACTIVE_PACKAGE_LIST]) {
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
        packages: refreshedPackages,
      });

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Finished resetting packages`,
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
        payload,
      });
    },
    [TransferBuilderActions.SET_TRANSFER_FOR_UPDATE]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>,
      payload: {
        transferForUpdate: IIndexedTransferData | null;
      }
    ) => {
      await ctx.dispatch(TransferBuilderActions.RESET_TRANSFER_DATA);

      ctx.commit(TransferBuilderMutations.SET_TRANSFER_FOR_UPDATE, payload);

      if (!payload.transferForUpdate) {
        return;
      }

      const { transferForUpdate } = payload;

      const destinations = await primaryDataLoader.transferDestinations(transferForUpdate.Id);
      const destination = destinations.length > 0 ? destinations[0] : null;

      const transporters = destination
        ? await primaryDataLoader.destinationTransporters(destination.Id)
        : [];
      const transporter = transporters.length > 0 ? transporters[0] : null;

      const transporterDetails = await primaryDataLoader.transferTransporterDetails(
        transferForUpdate.Id
      );
      const transporterDetail =
        transporterDetails.length > 0 ? transporterDetails[transporterDetails.length - 1] : null;

      if (destinations.length > 1) {
        toastManager.openToast(
          `Unable to populate transfer data: ${destinations.length} destinations found`,
          {
            title: "Edit Transfer Error",
            autoHideDelay: 10000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );

        analyticsManager.track(MessageType.BUILDER_EVENT, {
          builder: BuilderType.UPDATE_TRANSFER,
          action: `Unable to populate transfer data: ${destinations.length} destinations found`,
          payload,
        });

        return;
      }

      if (transporters.length > 1) {
        toastManager.openToast(
          `Unable to populate transfer data: ${transporters.length} transporters found`,
          {
            title: "Edit Transfer Error",
            autoHideDelay: 10000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );

        analyticsManager.track(MessageType.BUILDER_EVENT, {
          builder: BuilderType.UPDATE_TRANSFER,
          action: `Unable to populate transfer data: ${transporters.length} transporters found`,
          payload,
        });

        return;
      }

      const inTransitPackages = await primaryDataLoader.inTransitPackages();

      const transferTypes = await dynamicConstsManager.transferTypes();
      const facilities = await dynamicConstsManager.facilities();
      const transporterFacilities = await dynamicConstsManager.transporterFacilities();
      const destinationFacilities = await dynamicConstsManager.destinationFacilities();
      const unitsOfWeight = await dynamicConstsManager.unitsOfWeight();

      const isLayover = !!transporterDetail?.DriverLayoverLeg;

      const [departureIsodate, departureIsotime] = destination?.EstimatedDepartureDateTime
        ? destination.EstimatedDepartureDateTime.split("T")
        : [undefined, undefined];
      const [arrivalIsodate, arrivalIsotime] = destination?.EstimatedArrivalDateTime
        ? destination.EstimatedArrivalDateTime.split("T")
        : [undefined, undefined];

      const [layoverCheckInIsodate, layoverCheckInIsotime] = transporter?.EstimatedArrivalDateTime
        ? transporter.EstimatedArrivalDateTime.split("T")
        : [undefined, undefined];
      const [layoverCheckOutIsodate, layoverCheckOutIsotime] =
        transporter?.EstimatedDepartureDateTime
          ? transporter.EstimatedDepartureDateTime.split("T")
          : [undefined, undefined];

      const destinationPackages = destination
        ? await primaryDataLoader.destinationPackages(destination.Id)
        : [];

      const packages = await destinationPackages;
      destinationPackages.map((pkg) =>
        inTransitPackages.find((transitPkg) => transitPkg.Label === pkg.PackageLabel)
      );

      for (const pkg of packages) {
        await ctx.dispatch(TransferBuilderActions.ADD_PACKAGE, { pkg });
      }

      const transferType = destination
        ? transferTypes.find((x) => x.Name === destination.ShipmentTypeName)
        : transferTypes[0];

      const transferData: ITransferBuilderUpdateData = {
        originFacility: facilities.find(
          (x) => x.LicenseNumber === ctx.rootState.pluginAuth.authState?.license
        ),
        transporterFacility: transporterDetail
          ? transporterFacilities.find((x) => x.Id === transporterDetail.TransporterFacilityId)
          : undefined,
        destinationFacility: destination
          ? destinationFacilities.find(
              (x) => x.LicenseNumber === destination.RecipientFacilityLicenseNumber
            )
          : undefined,
        transferType,
        departureIsodate,
        departureIsotime,
        arrivalIsodate,
        arrivalIsotime,
        isLayover,
        layoverCheckInIsodate,
        layoverCheckInIsotime,
        layoverCheckOutIsodate,
        layoverCheckOutIsotime,
        plannedRoute: destination?.PlannedRoute,
        driverName: transporterDetail?.DriverName,
        driverEmployeeId: transporterDetail?.DriverOccupationalLicenseNumber,
        driverLicenseNumber: transporterDetail?.DriverVehicleLicenseNumber,
        driverLayoverLeg: transporterDetail?.DriverLayoverLeg ?? ("" as DriverLayoverLeg),
        vehicleMake: transporterDetail?.VehicleMake,
        vehicleModel: transporterDetail?.VehicleModel,
        vehicleLicensePlate: transporterDetail?.VehicleLicensePlateNumber,
        wholesalePackageValues: destinationPackages.map((x) => x.ShipperWholesalePrice) as number[],
        destinationGrossWeight: destination?.GrossWeight ?? null,
        destinationGrossUnitOfWeight:
          unitsOfWeight.find(
            (x) => x.Abbreviation === destination?.GrossUnitOfWeightAbbreviation
          ) ?? null,
        packageGrossWeights: destinationPackages.map((x) => x.GrossWeight) as number[],
        packageGrossUnitsOfWeight: destinationPackages.map(
          (pkg) => unitsOfWeight.find((x) => x.Abbreviation === pkg.GrossUnitOfWeightAbbreviation)!
        ),
      };

      await ctx.dispatch(TransferBuilderActions.UPDATE_TRANSFER_DATA, transferData);

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.UPDATE_TRANSFER,
        action: `Select transfer for update`,
        payload,
      });
    },
    [TransferBuilderActions.RESET_TRANSFER_DATA]: async (
      ctx: ActionContext<ITransferBuilderState, IPluginState>
    ) => {
      ctx.commit(TransferBuilderMutations.RESET_TRANSFER_DATA);

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Reset transfer data`,
      });
    },
  },
};

export const transferBuilderReducer = (state: ITransferBuilderState): ITransferBuilderState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
