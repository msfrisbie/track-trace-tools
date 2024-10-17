import { MetrcGridId, PackageSearchFilterKeys, PackageState } from "@/consts";
import { IPackageSearchFilters, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { PackageSearchActions, PackageSearchMutations } from "./consts";
import { IPackageSearchState } from "./interfaces";

const inMemoryState = {
  searchInflight: false,
  packages: [],
  selectedPackageMetadata: null,
  packageSearchFilters: {
    label: null,
    sourceHarvestNames: null,
    sourcePackageLabels: null,
    productionBatchNumber: null,
    sourceProductionBatchNumbers: null,
    itemName: null,
    itemStrainName: null,
    itemProductCategoryName: null,
    locationName: null,
  },
};

const persistedState = {};

const defaultState: IPackageSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const packageSearchModule = {
  state: () => defaultState,
  mutations: {
    [PackageSearchMutations.SET_PACKAGE_SEARCH_FILTERS](
      state: IPackageSearchState,
      { packageSearchFilters }: { packageSearchFilters: IPackageSearchFilters }
    ) {
      state.packageSearchFilters = {
        ...packageSearchFilters,
      };
    },
  },
  getters: {},
  actions: {
    [PackageSearchActions.EXECUTE_QUERY]: async (
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      { queryString }: { queryString: string }
    ) => {
      ctx.state.packages = [];
      ctx.state.selectedPackageMetadata = null;

      ctx.state.searchInflight = true;

      await Promise.allSettled([
        primaryDataLoader.onDemandActivePackageSearch({ queryString }).then((result) => {
          ctx.state.packages = [...ctx.state.packages, ...result];
        }),
        primaryDataLoader.onDemandInTransitPackageSearch({ queryString }).then((result) => {
          ctx.state.packages = [...ctx.state.packages, ...result];
        }),
        primaryDataLoader.onDemandInactivePackageSearch({ queryString }).then((result) => {
          ctx.state.packages = [...ctx.state.packages, ...result];
        }),
        primaryDataLoader.onDemandTransferredPackageSearch({ queryString }).then((result) => {
          ctx.state.packages = [...ctx.state.packages, ...result];
        }),
      ]);

      ctx.state.searchInflight = false;
    },
    [PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS]: async (
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      {
        packageSearchFilters,
        propagate = true,
        packageState = null,
      }: {
        packageSearchFilters: IPackageSearchFilters;
        propagate?: boolean;
        packageState?: PackageState | null;
      }
    ) => {
      if (packageState) {
        switch (packageState as PackageState) {
          case PackageState.ACTIVE:
            await pageManager.clickTabWithGridIdIfExists(MetrcGridId.PACKAGES_ACTIVE);
            break;
          case PackageState.ON_HOLD:
            await pageManager.clickTabWithGridIdIfExists(MetrcGridId.PACKAGES_ON_HOLD);
            break;
          case PackageState.INACTIVE:
            await pageManager.clickTabWithGridIdIfExists(MetrcGridId.PACKAGES_INACTIVE);
            break;
          case PackageState.IN_TRANSIT:
            await pageManager.clickTabWithGridIdIfExists(MetrcGridId.PACKAGES_IN_TRANSIT);
            break;
          case PackageState.TRANSFERRED:
            await pageManager.clickTabWithGridIdIfExists(MetrcGridId.PACKAGES_TRANSFERRED);
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS, {
        packageSearchFilters: {
          ...ctx.state.packageSearchFilters,
          ...packageSearchFilters,
        },
        propagate,
        packageState,
      });
    },
    [PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      {
        packageSearchFilters,
        propagate = true,
        packageState = null,
      }: {
        packageSearchFilters: IPackageSearchFilters;
        propagate?: boolean;
        packageState?: PackageState | null;
      }
    ) {
      const defaultPackageSearchFilters: { [key: string]: string | null } = {
        [PackageSearchFilterKeys.LABEL]: null,
        [PackageSearchFilterKeys.SOURCE_HARVEST_NAMES]: null,
        [PackageSearchFilterKeys.SOURCE_PACKAGE_LABELS]: null,
        [PackageSearchFilterKeys.PRODUCTION_BATCH_NUMBER]: null,
        [PackageSearchFilterKeys.SOURCE_PRODUCTION_BATCH_NUMBERS]: null,
        [PackageSearchFilterKeys.ITEM_NAME]: null,
        [PackageSearchFilterKeys.ITEM_STRAIN_NAME]: null,
        [PackageSearchFilterKeys.ITEM_PRODUCT_CATEGORY_NAME]: null,
        [PackageSearchFilterKeys.LOCATION_NAME]: null,
        [PackageSearchFilterKeys.MANIFEST_NUMBER]: null,
        [PackageSearchFilterKeys.DESTINATION_FACILITY_NAME]: null,
        [PackageSearchFilterKeys.DESTINATION_LICENSE_NUMBER]: null,
      };

      packageSearchFilters = {
        ...defaultPackageSearchFilters,
        ...packageSearchFilters,
      };

      const applyOwnedPackageFilters: boolean = [
        PackageState.ACTIVE,
        PackageState.ON_HOLD,
        PackageState.INACTIVE,
        PackageState.IN_TRANSIT,
        null,
      ].includes(packageState);

      const applyTransferredPackageFilters: boolean = [PackageState.TRANSFERRED, null].includes(
        packageState
      );

      if (propagate) {
        for (const [k, v] of Object.entries(packageSearchFilters)) {
          // @ts-ignore
          if (ctx.state.packageSearchFilters[k] !== v) {
            //   switch (k) {
            //     case PackageSearchFilterKeys.LABEL:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.Label, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.PackageLabel,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.SOURCE_HARVEST_NAMES:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.SourceHarvestNames, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.SourceHarvestNames,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.SOURCE_PACKAGE_LABELS:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.SourcePackageLabels, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.SourcePackageLabels,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.PRODUCTION_BATCH_NUMBER:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.ProductionBatchNumber, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         console.error(
            //           `Transferred packages cannot be filtered by production batch number`
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.SOURCE_PRODUCTION_BATCH_NUMBERS:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(
            //           PackageFilterIdentifiers.SourceProductionBatchNumbers,
            //           v
            //         );
            //       }
            //       if (applyTransferredPackageFilters) {
            //         console.error(
            //           `Transferred packages cannot be filtered by source production batch number`
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.ITEM_NAME:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.ItemName, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.ProductName,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.ITEM_STRAIN_NAME:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.ItemStrainName, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.ItemStrainName,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.ITEM_PRODUCT_CATEGORY_NAME:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.ItemProductCategoryName, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.ProductCategoryName,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.LOCATION_NAME:
            //       if (applyOwnedPackageFilters) {
            //         pageManager.setPackageFilter(PackageFilterIdentifiers.LocationName, v);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         console.error(`Transferred packages cannot be filtered by location name`);
            //       }
            //       break;
            //     case PackageSearchFilterKeys.MANIFEST_NUMBER:
            //       if (applyOwnedPackageFilters) {
            //         console.error(`Owned packages cannot be filtered by manifest number`);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.ManifestNumber,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.DESTINATION_FACILITY_NAME:
            //       if (applyOwnedPackageFilters) {
            //         console.error(`Owned packages cannot be filtered by destination facility name`);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.DestinationFacilityName,
            //           v
            //         );
            //       }
            //       break;
            //     case PackageSearchFilterKeys.DESTINATION_LICENSE_NUMBER:
            //       if (applyOwnedPackageFilters) {
            //         console.error(`Owned packages cannot be filtered by destination facility name`);
            //       }
            //       if (applyTransferredPackageFilters) {
            //         pageManager.setDestinationPackageFilter(
            //           TransferredPackageFilterIdentifiers.DestinationLicenseNumber,
            //           v
            //         );
            //       }
            //       break;
            //     default:
            //       break;
            //   }
          }
        }
      }

      ctx.commit(PackageSearchMutations.SET_PACKAGE_SEARCH_FILTERS, { packageSearchFilters });
    },
  },
};

export const packageSearchReducer = (state: IPackageSearchState): IPackageSearchState => ({
  ...state,
  ...inMemoryState,
});
