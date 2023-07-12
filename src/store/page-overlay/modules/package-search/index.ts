import { PackageFilterIdentifiers, PackageState } from "@/consts";
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
    sourceHarvestName: null,
    sourcePackageLabel: null,
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
      });
    },
    [PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      {
        packageSearchFilters,
        propagate = true,
      }: { packageSearchFilters: IPackageSearchFilters; propagate?: boolean }
    ) {
      const defaultPackageSearchFilters = {
        label: null,
        sourceHarvestName: null,
        sourcePackageLabel: null,
        productionBatchNumber: null,
        sourceProductionBatchNumbers: null,
        itemName: null,
        itemStrainName: null,
        itemProductCategoryName: null,
        locationName: null,
      };

      packageSearchFilters = {
        ...defaultPackageSearchFilters,
        ...packageSearchFilters,
      };

      if (propagate) {
        for (let [k, v] of Object.entries(packageSearchFilters)) {
          // @ts-ignore
          if (ctx.state.packageSearchFilters[k] !== v) {
            switch (k) {
              case "label":
                pageManager.setPackageFilter(PackageFilterIdentifiers.Label, v);
                break;
              case "sourceHarvestName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.SourceHarvestNames, v);
                break;
              case "sourcePackageLabel":
                pageManager.setPackageFilter(PackageFilterIdentifiers.SourcePackageLabels, v);
                break;
              case "productionBatchNumber":
                pageManager.setPackageFilter(PackageFilterIdentifiers.ProductionBatchNumber, v);
                break;
              case "sourceProductionBatchNumbers":
                pageManager.setPackageFilter(
                  PackageFilterIdentifiers.SourceProductionBatchNumbers,
                  v
                );
                break;
              case "itemName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.ItemName, v);
                break;
              case "itemStrainName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.ItemStrainName, v);
                break;
              case "itemProductCategoryName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.ItemProductCategoryName, v);
                break;
              case "locationName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.LocationName, v);
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

export const packageSearchReducer = (state: IPackageSearchState): IPackageSearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
