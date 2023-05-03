import { PackageFilterIdentifiers, PackageState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { pageManager } from "@/modules/page-manager.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { OmniSearchActions, OmniSearchMutations } from "./consts";
import { IOmniSearchFilters, IOmniSearchState, ISelectedOmniObject } from "./interfaces";

const inMemoryState = {
  queryString: "",
  selectedObject: null,
  showSearchResults: false,
  searchFilters: {
    packageFilters: null,
    transferFilters: null,
    plantFilters: null,
    tagFilters: null,
  },
};

const persistedState = {
  expandSearchOnNextLoad: false,
  queryStringHistory: [],
};

const defaultState: IOmniSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const omniSearchModule = {
  state: () => defaultState,
  mutations: {
    [OmniSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      state: IOmniSearchState,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [OmniSearchMutations.SET_SELECTED_OBJECT](
      state: IOmniSearchState,
      { selectedObject }: { selectedObject: ISelectedOmniObject }
    ) {
      state.selectedObject = selectedObject;
    },
    [OmniSearchMutations.SET_QUERY_STRING](
      state: IOmniSearchState,
      { queryString }: { queryString: string }
    ) {
      state.queryString = queryString;

      state.queryStringHistory = maybePushOntoUniqueStack(queryString, state.queryStringHistory);
    },
    [OmniSearchMutations.SET_SHOW_SEARCH_RESULTS](
      state: IOmniSearchState,
      { showSearchResults }: { showSearchResults: boolean }
    ) {
      state.showSearchResults = showSearchResults;
    },
    [OmniSearchMutations.SET_OMNI_SEARCH_FILTERS](
      state: IOmniSearchState,
      { searchFilters }: { searchFilters: IOmniSearchFilters }
    ) {
      state.searchFilters = {
        ...searchFilters,
      };
    },
  },
  getters: {},
  actions: {
    [OmniSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<IOmniSearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.commit(OmniSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD, { expandSearchOnNextLoad });
    },
    [OmniSearchActions.SET_QUERY_STRING](
      ctx: ActionContext<IOmniSearchState, IPluginState>,
      { queryString }: { queryString: string }
    ) {
      ctx.commit(OmniSearchMutations.SET_QUERY_STRING, { queryString });
    },
    [OmniSearchActions.SET_SHOW_SEARCH_RESULTS](
      ctx: ActionContext<IOmniSearchState, IPluginState>,
      { showSearchResults }: { showSearchResults: boolean }
    ) {
      ctx.commit(OmniSearchMutations.SET_SHOW_OMNI_SEARCH_RESULTS, {
        showSearchResults,
      });
    },
    [OmniSearchActions.PARTIAL_UPDATE_OMNI_SEARCH_FILTERS]: async (
      ctx: ActionContext<IOmniSearchState, IPluginState>,
      {
        searchFilters,
        omniObject = null,
        propagate = true,
      }: {
        searchFilters: IOmniSearchFilters;
        omniObject?: ISelectedOmniObject | null;
        propagate?: boolean;
      }
    ) => {
      if (omniObject?.selectedPackage?.PackageState) {
        switch (omniObject?.selectedPackage?.PackageState) {
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

      ctx.dispatch(OmniSearchActions.SET_OMNI_SEARCH_FILTERS, {
        searchFilters: {
          ...ctx.state.searchFilters,
          ...searchFilters,
        },
        propagate,
      });
    },
    [OmniSearchActions.SET_OMNI_SEARCH_FILTERS](
      ctx: ActionContext<IOmniSearchState, IPluginState>,
      {
        searchFilters,
        propagate = true,
      }: { searchFilters: IOmniSearchFilters; propagate?: boolean }
    ) {
      searchFilters = {
        packageSearchFilters: {
          label: null,
          sourceHarvestName: null,
          sourcePackageLabel: null,
          itemName: null,
          itemStrainName: null,
          itemProductCategoryName: null,
          locationName: null,
          ...searchFilters?.packageSearchFilters,
        },
        plantSearchFilters: {
          label: null,
          strainName: null,
          locationName: null,
          ...searchFilters?.plantSearchFilters,
        },
        transferSearchFilters: {
          manifestNumber: null,
          ...searchFilters?.transferSearchFilters,
        },
        tagSearchFilters: {
          label: null,
          ...searchFilters?.tagSearchFilters,
        },
      };

      if (propagate) {
        for (let [k, v] of Object.entries(searchFilters)) {
          if (ctx.state.searchFilters.packageSearchFilters[k] !== v) {
            switch (k) {
              case "label":
                pageManager.setPackageFilter(PackageFilterIdentifiers.Label, v);
                break;
              case "sourceHarvestName":
                pageManager.setPackageFilter(PackageFilterIdentifiers.SourceHarvestNames, v);
                break;
              case "sourceOmniLabel":
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

      ctx.commit(OmniSearchMutations.SET_OMNI_SEARCH_FILTERS, { searchFilters });
    },
  },
};

export const omniSearchReducer = (state: IOmniSearchState): IOmniSearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
