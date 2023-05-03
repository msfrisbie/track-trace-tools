import { PackageFilterIdentifiers, PackageState } from "@/consts";
import { IPackageSearchFilters, IPluginState } from "@/interfaces";
import { pageManager } from "@/modules/page-manager.module";
import { ISelectedPackageMetadata } from "@/modules/search-manager.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { PackageSearchActions, PackageSearchMutations } from "./consts";
import { IPackageSearchState } from "./interfaces";

const inMemoryState = {
  packageQueryString: "",
  selectedPackageMetadata: null,
  showPackageSearchResults: false,
  packageSearchFilters: {
    label: null,
    sourceHarvestName: null,
    sourcePackageLabel: null,
    itemName: null,
    itemStrainName: null,
    itemProductCategoryName: null,
    locationName: null
  }
};

const persistedState = {
  expandSearchOnNextLoad: false,
  packageQueryStringHistory: []
};

const defaultState: IPackageSearchState = {
  ...inMemoryState,
  ...persistedState
};

export const packageSearchModule = {
  state: () => defaultState,
  mutations: {
    [PackageSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      state: IPackageSearchState,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [PackageSearchMutations.SET_SELECTED_PACKAGE_METADATA](
      state: IPackageSearchState,
      { selectedPackageMetadata }: { selectedPackageMetadata: ISelectedPackageMetadata | null }
    ) {
      state.selectedPackageMetadata = selectedPackageMetadata;
    },
    [PackageSearchMutations.SET_PACKAGE_QUERY_STRING](
      state: IPackageSearchState,
      { packageQueryString }: { packageQueryString: string }
    ) {
      state.packageQueryString = packageQueryString;

      state.packageQueryStringHistory = maybePushOntoUniqueStack(
        packageQueryString,
        state.packageQueryStringHistory
      );
    },
    [PackageSearchMutations.SET_SHOW_PACKAGE_SEARCH_RESULTS](
      state: IPackageSearchState,
      { showPackageSearchResults }: { showPackageSearchResults: boolean }
    ) {
      state.showPackageSearchResults = showPackageSearchResults;
    },
    [PackageSearchMutations.SET_PACKAGE_SEARCH_FILTERS](
      state: IPackageSearchState,
      { packageSearchFilters }: { packageSearchFilters: IPackageSearchFilters }
    ) {
      state.packageSearchFilters = {
        ...packageSearchFilters
      };
    }
  },
  getters: {},
  actions: {
    [PackageSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.commit(PackageSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD, { expandSearchOnNextLoad });
    },
    [PackageSearchActions.SET_PACKAGE_QUERY_STRING](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      { packageQueryString }: { packageQueryString: string }
    ) {
      ctx.commit(PackageSearchMutations.SET_PACKAGE_QUERY_STRING, { packageQueryString });
    },
    [PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      { showPackageSearchResults }: { showPackageSearchResults: boolean }
    ) {
      ctx.commit(PackageSearchMutations.SET_SHOW_PACKAGE_SEARCH_RESULTS, {
        showPackageSearchResults
      });
    },
    [PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS]: async (
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      {
        packageSearchFilters,
        propagate = true,
        packageState = null
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
          ...packageSearchFilters
        },
        propagate
      });
    },
    [PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS](
      ctx: ActionContext<IPackageSearchState, IPluginState>,
      {
        packageSearchFilters,
        propagate = true
      }: { packageSearchFilters: IPackageSearchFilters; propagate?: boolean }
    ) {
      const defaultPackageSearchFilters = {
        label: null,
        sourceHarvestName: null,
        sourcePackageLabel: null,
        itemName: null,
        itemStrainName: null,
        itemProductCategoryName: null,
        locationName: null
      };

      packageSearchFilters = {
        ...defaultPackageSearchFilters,
        ...packageSearchFilters
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
    }
  }
};

export const packageSearchReducer = (state: IPackageSearchState): IPackageSearchState => {
  return {
    ...state,
    ...inMemoryState
  };
};
