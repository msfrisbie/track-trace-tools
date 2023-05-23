import { PlantFilterIdentifiers, PlantState } from "@/consts";
import { IPlantSearchFilters, IPluginState } from "@/interfaces";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { PlantSearchActions, PlantSearchMutations } from "./consts";
import { IPlantSearchState } from "./interfaces";

const inMemoryState = {
  plantQueryString: "",
  showPlantSearchResults: false,
  plantSearchFilters: {
    label: null,
    strainName: null,
    locationName: null
  }
};

const persistedState = {
  expandSearchOnNextLoad: false,
  plantQueryStringHistory: []
};

const defaultState: IPlantSearchState = {
  ...inMemoryState,
  ...persistedState
};

export const plantSearchModule = {
  state: () => defaultState,
  mutations: {
    [PlantSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      state: IPlantSearchState,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [PlantSearchMutations.SET_PLANT_QUERY_STRING](
      state: IPlantSearchState,
      { plantQueryString }: { plantQueryString: string }
    ) {
      state.plantQueryString = plantQueryString;

      state.plantQueryStringHistory = maybePushOntoUniqueStack(
        plantQueryString,
        state.plantQueryStringHistory
      );
    },
    [PlantSearchMutations.SET_SHOW_PLANT_SEARCH_RESULTS](
      state: IPlantSearchState,
      { showPlantSearchResults }: { showPlantSearchResults: boolean }
    ) {
      state.showPlantSearchResults = showPlantSearchResults;
    },
    [PlantSearchMutations.SET_PLANT_SEARCH_FILTERS](
      state: IPlantSearchState,
      { plantSearchFilters }: { plantSearchFilters: IPlantSearchFilters }
    ) {
      state.plantSearchFilters = {
        ...plantSearchFilters
      };
    }
  },
  getters: {},
  actions: {
    [PlantSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.commit(PlantSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD, { expandSearchOnNextLoad });
    },
    [PlantSearchActions.SET_PLANT_QUERY_STRING](
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      { plantQueryString }: { plantQueryString: string }
    ) {
      ctx.commit(PlantSearchMutations.SET_PLANT_QUERY_STRING, { plantQueryString });
    },
    [PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS](
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      { showPlantSearchResults }: { showPlantSearchResults: boolean }
    ) {
      ctx.commit(PlantSearchMutations.SET_SHOW_PLANT_SEARCH_RESULTS, {
        showPlantSearchResults
      });
    },
    [PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS]: async (
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      {
        plantSearchFilters,
        propagate = true,
        plantState = null
      }: {
        plantSearchFilters: IPlantSearchFilters;
        propagate?: boolean;
        plantState?: PlantState | null;
      }
    ) => {
      if (plantState) {
        switch (plantState as PlantState) {
          case PlantState.FLOWERING:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, "Flowering");
            break;
          case PlantState.VEGETATIVE:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, "Vegetative");
            break;
          case PlantState.INACTIVE:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, "Inactive", "On Hold");
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(PlantSearchActions.SET_PLANT_SEARCH_FILTERS, {
        plantSearchFilters: {
          ...ctx.state.plantSearchFilters,
          ...plantSearchFilters
        },
        propagate
      });
    },
    [PlantSearchActions.SET_PLANT_SEARCH_FILTERS](
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      {
        plantSearchFilters,
        propagate = true
      }: { plantSearchFilters: IPlantSearchFilters; propagate?: boolean }
    ) {
      const defaultPlantSearchFilters = {
        label: null,
        strainName: null,
        locationName: null
      };

      plantSearchFilters = {
        ...defaultPlantSearchFilters,
        ...plantSearchFilters
      };

      if (propagate) {
        for (let [k, v] of Object.entries(plantSearchFilters)) {
          // @ts-ignore
          if (ctx.state.plantSearchFilters[k] !== v) {
            switch (k) {
              case "label":
                pageManager.setPlantFilter(PlantFilterIdentifiers.Label, v);
                break;
              case "strainName":
                pageManager.setPlantFilter(PlantFilterIdentifiers.StrainName, v);
                break;
              case "locationName":
                pageManager.setPlantFilter(PlantFilterIdentifiers.LocationName, v);
                break;
              default:
                break;
            }
          }
        }
      }

      ctx.commit(PlantSearchMutations.SET_PLANT_SEARCH_FILTERS, { plantSearchFilters });
    }
  }
};

export const plantSearchReducer = (state: IPlantSearchState): IPlantSearchState => {
  return {
    ...state,
    ...inMemoryState
  };
};
