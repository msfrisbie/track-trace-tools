import { PlantFilterIdentifiers, PlantState } from '@/consts';
import { IPlantSearchFilters, IPluginState } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { pageManager } from '@/modules/page-manager/page-manager.module';
import { timer } from 'rxjs';
import { ActionContext } from 'vuex';
import { PlantSearchActions, PlantSearchMutations } from './consts';
import { IPlantSearchState } from './interfaces';

const inMemoryState = {
  searchInflight: false,
  selectedPlantMetadata: null,
  plants: [],
  plantSearchFilters: {
    label: null,
    strainName: null,
    locationName: null,
  },
};

const persistedState = {};

const defaultState: IPlantSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const plantSearchModule = {
  state: () => defaultState,
  mutations: {
    [PlantSearchMutations.SET_PLANT_SEARCH_FILTERS](
      state: IPlantSearchState,
      { plantSearchFilters }: { plantSearchFilters: IPlantSearchFilters },
    ) {
      state.plantSearchFilters = {
        ...plantSearchFilters,
      };
    },
  },
  getters: {},
  actions: {
    [PlantSearchActions.EXECUTE_QUERY]: async (
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      { queryString }: { queryString: string },
    ) => {
      ctx.state.plants = [];
      ctx.state.selectedPlantMetadata = null;

      ctx.state.searchInflight = true;

      await Promise.allSettled([
        primaryDataLoader.onDemandFloweringPlantSearch({ queryString }).then((result) => {
          ctx.state.plants = [...ctx.state.plants, ...result];
        }),
        primaryDataLoader.onDemandVegetativePlantSearch({ queryString }).then((result) => {
          ctx.state.plants = [...ctx.state.plants, ...result];
        }),
        primaryDataLoader.onDemandInactivePlantSearch({ queryString }).then((result) => {
          ctx.state.plants = [...ctx.state.plants, ...result];
        }),
      ]);

      ctx.state.searchInflight = false;
    },
    [PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS]: async (
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      {
        plantSearchFilters,
        propagate = true,
        plantState = null,
      }: {
        plantSearchFilters: IPlantSearchFilters;
        propagate?: boolean;
        plantState?: PlantState | null;
      },
    ) => {
      if (plantState) {
        switch (plantState as PlantState) {
          case PlantState.FLOWERING:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, 'Flowering');
            break;
          case PlantState.VEGETATIVE:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, 'Vegetative');
            break;
          case PlantState.INACTIVE:
            await pageManager.clickTabStartingWith(pageManager.plantsTabs, 'Inactive', 'On Hold');
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(PlantSearchActions.SET_PLANT_SEARCH_FILTERS, {
        plantSearchFilters: {
          ...ctx.state.plantSearchFilters,
          ...plantSearchFilters,
        },
        propagate,
      });
    },
    [PlantSearchActions.SET_PLANT_SEARCH_FILTERS](
      ctx: ActionContext<IPlantSearchState, IPluginState>,
      {
        plantSearchFilters,
        propagate = true,
      }: { plantSearchFilters: IPlantSearchFilters; propagate?: boolean },
    ) {
      const defaultPlantSearchFilters = {
        label: null,
        strainName: null,
        locationName: null,
      };

      plantSearchFilters = {
        ...defaultPlantSearchFilters,
        ...plantSearchFilters,
      };

      if (propagate) {
        for (const [k, v] of Object.entries(plantSearchFilters)) {
          // @ts-ignore
          if (ctx.state.plantSearchFilters[k] !== v) {
            switch (k) {
              case 'label':
                pageManager.setPlantFilter(PlantFilterIdentifiers.Label, v);
                break;
              case 'strainName':
                pageManager.setPlantFilter(PlantFilterIdentifiers.StrainName, v);
                break;
              case 'locationName':
                pageManager.setPlantFilter(PlantFilterIdentifiers.LocationName, v);
                break;
              default:
                break;
            }
          }
        }
      }

      ctx.commit(PlantSearchMutations.SET_PLANT_SEARCH_FILTERS, { plantSearchFilters });
    },
  },
};

export const plantSearchReducer = (state: IPlantSearchState): IPlantSearchState => ({
  ...state,
  ...inMemoryState,
});
