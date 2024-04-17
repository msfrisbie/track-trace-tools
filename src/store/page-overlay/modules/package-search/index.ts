import {
  DestinationPackageFilterIdentifiers,
  PackageFilterIdentifiers,
  PackageSearchFilterKeys,
  PackageState,
} from "@/consts";
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
            await pageManager.clickTabStartingWith(pageManager.packageTabs, "Active");
            break;
          case PackageState.INACTIVE:
            await pageManager.clickTabStartingWith(pageManager.packageTabs, "Inactive");
            break;
          case PackageState.IN_TRANSIT:
            await pageManager.clickTabStartingWith(pageManager.packageTabs, "In Transit");
            break;
          case PackageState.TRANSFERRED:
            await pageManager.clickTabStartingWith(pageManager.packageTabs, "Transferred");
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
      const defaultPackageSearchFilters = {
        label: null,
        sourceHarvestNames: null,
        sourcePackageLabels: null,
        productionBatchNumber: null,
        sourceProductionBatchNumbers: null,
        itemName: null,
        itemStrainName: null,
        itemProductCategoryName: null,
        locationName: null,
        manifestNumber: null,
        destinationFacilityName: null,
        destinationLicenseNumber: null,
      };

      packageSearchFilters = {
        ...defaultPackageSearchFilters,
        ...packageSearchFilters,
      };

      const isOwnedPackage: boolean = [
        PackageState.ACTIVE,
        PackageState.ON_HOLD,
        PackageState.INACTIVE,
        PackageState.IN_TRANSIT,
      ].includes(packageState as PackageState);

      const isTransferredPackage: boolean = [PackageState.TRANSFERRED].includes(
        packageState as PackageState
      );

      if (propagate) {
        for (const [k, v] of Object.entries(packageSearchFilters)) {
          // @ts-ignore
          if (ctx.state.packageSearchFilters[k] !== v) {
            switch (k) {
              case "label":
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.Label, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.PackageLabel,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case "sourceHarvestNames":
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.SourceHarvestNames, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.SourceHarvestNames,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case "sourcePackageLabels":
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.SourcePackageLabels, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.SourcePackageLabels,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case "productionBatchNumber":
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.ProductionBatchNumber, v);
                } else if (isTransferredPackage) {
                  console.error(
                    `Transferred packages cannot be filtered by production batch number`
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case "sourceProductionBatchNumbers":
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(
                    PackageFilterIdentifiers.SourceProductionBatchNumbers,
                    v
                  );
                } else if (isTransferredPackage) {
                  console.error(
                    `Transferred packages cannot be filtered by source production batch number`
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.ITEM_NAME:
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.ItemName, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.ProductName,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.ITEM_STRAIN_NAME:
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.ItemStrainName, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.ItemStrainName,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.ITEM_PRODUCT_CATEGORY_NAME:
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.ItemProductCategoryName, v);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.ProductCategoryName,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.LOCATION_NAME:
                if (isOwnedPackage) {
                  pageManager.setPackageFilter(PackageFilterIdentifiers.LocationName, v);
                } else if (isTransferredPackage) {
                  console.error(`Transferred packages cannot be filtered by location name`);
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.MANIFEST_NUMBER:
                if (isOwnedPackage) {
                  console.error(`Owned packages cannot be filtered by manifest number`);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.ManifestNumber,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.DESTINATION_FACILITY_NAME:
                if (isOwnedPackage) {
                  console.error(`Owned packages cannot be filtered by destination facility name`);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.DestinationFacilityName,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              case PackageSearchFilterKeys.DESTINATION_LICENSE_NUMBER:
                if (isOwnedPackage) {
                  console.error(`Owned packages cannot be filtered by destination facility name`);
                } else if (isTransferredPackage) {
                  pageManager.setDestinationPackageFilter(
                    DestinationPackageFilterIdentifiers.DestinationLicenseNumber,
                    v
                  );
                } else {
                  console.error(`No filter applied: packageState is null`);
                }
                break;
              default:
                break;
            }
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
