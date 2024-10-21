import {
  HarvestState,
  ItemState,
  MessageType,
  PackageState,
  PlantBatchState,
  PlantState,
  SalesReceiptState,
  StrainState,
  TagState,
  TransferState,
  UniqueMetrcGridId,
} from "@/consts";
import {
  IIndexedHarvestData,
  IIndexedItemData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedSalesReceiptData,
  IIndexedStrainData,
  IIndexedTagData,
  IIndexedTransferData,
  IIndexedTransferredPackageData,
  IPluginState,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { generateSearchResultMetadata } from "@/modules/page-manager/search-utils";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { getHashData, setHashData } from "@/utils/url";
import _ from "lodash-es";
import { v4 } from "uuid";
import { ActionContext } from "vuex";
import { ALL_METRC_GROUPS, SearchActions, SearchMutations, SearchStatus } from "./consts";
import {
  HarvestSearchParams,
  ISearchResult,
  ISearchState,
  ItemSearchParams,
  MetrcGroup,
  PackageSearchParams,
  PlantBatchSearchParams,
  PlantSearchParams,
  SalesReceiptSearchParams,
  SearchConfigEntry,
  StrainSearchParams,
  TagSearchParams,
  TransferredPackageSearchParams,
  TransferSearchParams,
} from "./interfaces";

const QUERY_DEBOUNCE_MS: number = 700;

const inMemoryState = {
  queryString: "",
  status: SearchStatus.INITIAL,
  statusMessage: null,
  showSearchResults: false,
  modalSearchOpen: false,
  queryLicenseNumber: "",
  searchResults: [],
  activeSearchResult: null,
  metrcGridFilters: {},
  activeUniqueMetrcGridId: null,
  queryId: "",
};

const persistedState = {
  queryStringHistory: [],
  searchResultMetrcGridGroups: ALL_METRC_GROUPS,
};

const defaultState: ISearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const searchModule = {
  state: () => defaultState,
  mutations: {
    [SearchMutations.SEARCH_MUTATION](state: ISearchState, data: Partial<ISearchState> = {}) {
      (Object.keys(data) as Array<keyof ISearchState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
    [SearchMutations.PUSH_SEARCH_RESULTS](
      state: ISearchState,
      { newSearchResults }: { newSearchResults: ISearchResult[] }
    ) {
      // Combine the new results with the existing ones and sort by score
      state.searchResults = [...newSearchResults, ...state.searchResults].sort(
        (a, b) => b.score - a.score
      );

      console.log(state.searchResults.map((x) => x.score));

      // Check if searchResults is empty after the sort
      if (state.searchResults.length === 0) {
        state.activeSearchResult = null;
        return;
      }

      // Get the highest score result (the first element after sorting)
      const highestScoreSearchResult: ISearchResult = state.searchResults[0];

      console.log(`new score candidate: ${highestScoreSearchResult.score}`);

      // Update activeSearchResult only if there is no active, or candidate has an equal or higher
      if (
        !state.activeSearchResult ||
        state.activeSearchResult.score <= highestScoreSearchResult.score
      ) {
        state.activeSearchResult = highestScoreSearchResult;
      } else {
        console.log(
          `Rejecting ${highestScoreSearchResult.score} for ${state.activeSearchResult?.score}`
        );
      }
    },
  },
  getters: {},
  actions: {
    [SearchActions.SELECT_SEARCH_RESULT](
      ctx: ActionContext<ISearchState, IPluginState>,
      { searchResult }: { searchResult: ISearchResult | null }
    ) {
      ctx.commit(SearchMutations.SEARCH_MUTATION, { activeSearchResult: searchResult });
    },
    [SearchActions.SET_QUERY_STRING](
      ctx: ActionContext<ISearchState, IPluginState>,
      { queryString }: { queryString: string }
    ) {
      ctx.commit(SearchMutations.SEARCH_MUTATION, { queryString });

      ctx.dispatch(SearchActions.EXECUTE_QUERY, { queryString });
    },
    [SearchActions.SET_SHOW_SEARCH_RESULTS](
      ctx: ActionContext<ISearchState, IPluginState>,
      { showSearchResults }: { showSearchResults: boolean }
    ) {
      ctx.commit(SearchMutations.SEARCH_MUTATION, { showSearchResults });
    },

    [SearchActions.MIRROR_METRC_SEARCH_FILTERS]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        searchFilters,
        uniqueMetrcGridId,
      }: {
        searchFilters: { [key: string]: string };
        uniqueMetrcGridId: UniqueMetrcGridId;
      }
    ) => {
      if (!pageManager.finishedGridInit) {
        return;
      }

      const metrcGridFilters = {
        ...ctx.state.metrcGridFilters,
        [uniqueMetrcGridId]: searchFilters,
      };

      const currentHashData = getHashData();

      setHashData({
        ...currentHashData,
        metrcGridFilters,
      });

      ctx.commit(SearchMutations.SEARCH_MUTATION, { metrcGridFilters });
    },
    [SearchActions.UPDATE_SEARCH_GROUPS]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        searchResultMetrcGridGroups,
      }: {
        searchResultMetrcGridGroups: MetrcGroup;
      }
    ) => {
      ctx.commit(SearchMutations.SEARCH_MUTATION, {
        searchResultMetrcGridGroups,
      });

      ctx.dispatch(SearchActions.EXECUTE_QUERY, {
        queryString: ctx.state.queryString,
      });
    },
    [SearchActions.SET_ACTIVE_METRC_GRID_ID]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        activeUniqueMetrcGridId,
      }: {
        activeUniqueMetrcGridId: UniqueMetrcGridId;
      }
    ) => {
      if (!pageManager.finishedGridInit) {
        return;
      }

      const currentHashData = getHashData();

      setHashData({
        ...currentHashData,
        activeUniqueMetrcGridId,
      });

      ctx.commit(SearchMutations.SEARCH_MUTATION, { activeUniqueMetrcGridId });
    },
    [SearchActions.EXECUTE_QUERY]: _.debounce(
      async (
        ctx: ActionContext<ISearchState, IPluginState>,
        { queryString }: { queryString: string }
      ) => {
        console.log("EXECUTE SEARCH", { queryString });

        if (!queryString.length) {
          ctx.commit(SearchMutations.SEARCH_MUTATION, {
            status: SearchStatus.INITIAL,
            statusMessage: null,
            searchResults: [],
          });

          return;
        }

        analyticsManager.track(MessageType.ENTERED_SEARCH_QUERY, {
          queryString,
        });

        const queryId: string = v4();

        ctx.commit(SearchMutations.SEARCH_MUTATION, {
          queryStringHistory: maybePushOntoUniqueStack(queryString, ctx.state.queryStringHistory),
          status: SearchStatus.INFLIGHT,
          searchResults: [],
          activeSearchResult: null,
          queryId,
        });

        type SearchConfigUnion =
          | SearchConfigEntry<PackageSearchParams, IIndexedPackageData>
          | SearchConfigEntry<TransferredPackageSearchParams, IIndexedTransferredPackageData>
          | SearchConfigEntry<PlantSearchParams, IIndexedPlantData>
          | SearchConfigEntry<TransferSearchParams, IIndexedTransferData>
          | SearchConfigEntry<TagSearchParams, IIndexedTagData>
          | SearchConfigEntry<HarvestSearchParams, IIndexedHarvestData>
          | SearchConfigEntry<SalesReceiptSearchParams, IIndexedSalesReceiptData>
          | SearchConfigEntry<PlantBatchSearchParams, IIndexedPlantBatchData>
          | SearchConfigEntry<ItemSearchParams, IIndexedItemData>
          | SearchConfigEntry<StrainSearchParams, IIndexedStrainData>;

        const searchConfig: SearchConfigUnion[] = [
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPackageSearch(onDemandSearchParams),
            params: { queryString, packageState: PackageState.ACTIVE },
            key: "pkg",
            uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_ACTIVE,
          } as SearchConfigEntry<PackageSearchParams, IIndexedPackageData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPackageSearch(onDemandSearchParams),
            params: { queryString, packageState: PackageState.INACTIVE },
            key: "pkg",
            uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_INACTIVE,
          } as SearchConfigEntry<PackageSearchParams, IIndexedPackageData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPackageSearch(onDemandSearchParams),
            params: { queryString, packageState: PackageState.IN_TRANSIT },
            key: "pkg",
            uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_IN_TRANSIT,
          } as SearchConfigEntry<PackageSearchParams, IIndexedPackageData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferredPackageSearch(onDemandSearchParams),
            params: { queryString },
            key: "transferPkg",
            uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_TRANSFERRED,
          } as SearchConfigEntry<TransferredPackageSearchParams, IIndexedTransferredPackageData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPlantSearch(onDemandSearchParams),
            params: { queryString, plantState: PlantState.FLOWERING },
            key: "plant",
            uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_FLOWERING,
          } as SearchConfigEntry<PlantSearchParams, IIndexedPlantData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPlantSearch(onDemandSearchParams),
            params: { queryString, plantState: PlantState.VEGETATIVE },
            key: "plant",
            uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_VEGETATIVE,
          } as SearchConfigEntry<PlantSearchParams, IIndexedPlantData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPlantSearch(onDemandSearchParams),
            params: { queryString, plantState: PlantState.INACTIVE },
            key: "plant",
            uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_INACTIVE,
          } as SearchConfigEntry<PlantSearchParams, IIndexedPlantData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferSearch(onDemandSearchParams),
            params: { queryString, transferState: TransferState.INCOMING },
            key: "incomingTransfer",
            uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_INCOMING,
          } as SearchConfigEntry<TransferSearchParams, IIndexedTransferData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferSearch(onDemandSearchParams),
            params: { queryString, transferState: TransferState.INCOMING_INACTIVE },
            key: "incomingTransfer",
            uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_INCOMING_INACTIVE,
          } as SearchConfigEntry<TransferSearchParams, IIndexedTransferData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferSearch(onDemandSearchParams),
            params: { queryString, transferState: TransferState.OUTGOING },
            key: "outgoingTransfer",
            uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_OUTGOING,
          } as SearchConfigEntry<TransferSearchParams, IIndexedTransferData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferSearch(onDemandSearchParams),
            params: { queryString, transferState: TransferState.OUTGOING_INACTIVE },
            key: "outgoingTransfer",
            uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_OUTGOING_INACTIVE,
          } as SearchConfigEntry<TransferSearchParams, IIndexedTransferData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTransferSearch(onDemandSearchParams),
            params: { queryString, transferState: TransferState.REJECTED },
            key: "outgoingTransfer",
            uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_REJECTED,
          } as SearchConfigEntry<TransferSearchParams, IIndexedTransferData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTagSearch(onDemandSearchParams),
            params: { queryString, tagState: TagState.AVAILABLE },
            key: "tag",
            uniqueMetrcGridId: UniqueMetrcGridId.TAGS_AVAILABLE,
          } as SearchConfigEntry<TagSearchParams, IIndexedTagData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTagSearch(onDemandSearchParams),
            params: { queryString, tagState: TagState.USED },
            key: "tag",
            uniqueMetrcGridId: UniqueMetrcGridId.TAGS_USED,
          } as SearchConfigEntry<TagSearchParams, IIndexedTagData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandTagSearch(onDemandSearchParams),
            params: { queryString, tagState: TagState.VOIDED },
            key: "tag",
            uniqueMetrcGridId: UniqueMetrcGridId.TAGS_VOIDED,
          } as SearchConfigEntry<TagSearchParams, IIndexedTagData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandHarvestSearch(onDemandSearchParams),
            params: { queryString, harvestState: HarvestState.ACTIVE },
            key: "harvest",
            uniqueMetrcGridId: UniqueMetrcGridId.HARVESTS_HARVESTED,
          } as SearchConfigEntry<HarvestSearchParams, IIndexedHarvestData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandHarvestSearch(onDemandSearchParams),
            params: { queryString, harvestState: HarvestState.INACTIVE },
            key: "harvest",
            uniqueMetrcGridId: UniqueMetrcGridId.HARVESTS_INACTIVE,
          } as SearchConfigEntry<HarvestSearchParams, IIndexedHarvestData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandSalesReceiptSearch(onDemandSearchParams),
            params: { queryString, salesReceiptState: SalesReceiptState.ACTIVE },
            key: "salesReceipt",
            uniqueMetrcGridId: UniqueMetrcGridId.SALES_ACTIVE,
          } as SearchConfigEntry<SalesReceiptSearchParams, IIndexedSalesReceiptData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandSalesReceiptSearch(onDemandSearchParams),
            params: { queryString, salesReceiptState: SalesReceiptState.INACTIVE },
            key: "salesReceipt",
            uniqueMetrcGridId: UniqueMetrcGridId.SALES_INACTIVE,
          } as SearchConfigEntry<SalesReceiptSearchParams, IIndexedSalesReceiptData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPlantBatchSearch(onDemandSearchParams),
            params: { queryString, plantBatchState: PlantBatchState.ACTIVE },
            key: "plantBatch",
            uniqueMetrcGridId: UniqueMetrcGridId.PLANT_BATCHES,
          } as SearchConfigEntry<PlantBatchSearchParams, IIndexedPlantBatchData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandPlantBatchSearch(onDemandSearchParams),
            params: { queryString, plantBatchState: PlantBatchState.INACTIVE },
            key: "plantBatch",
            uniqueMetrcGridId: UniqueMetrcGridId.PLANT_BATCHES_INACTIVE,
          } as SearchConfigEntry<PlantBatchSearchParams, IIndexedPlantBatchData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandItemSearch(onDemandSearchParams),
            params: { queryString, itemState: ItemState.ACTIVE },
            key: "item",
            uniqueMetrcGridId: UniqueMetrcGridId.ITEMS_GRID,
          } as SearchConfigEntry<ItemSearchParams, IIndexedItemData>,
          {
            loader: (onDemandSearchParams) =>
              primaryDataLoader.onDemandStrainSearch(onDemandSearchParams),
            params: { queryString, strainState: StrainState.ACTIVE },
            key: "strain",
            uniqueMetrcGridId: UniqueMetrcGridId.STRAIN_GRID,
          } as SearchConfigEntry<StrainSearchParams, IIndexedStrainData>,
        ];

        const enabledGridIds: Set<UniqueMetrcGridId> = new Set();

        for (const group of ctx.state.searchResultMetrcGridGroups) {
          for (const child of group.children) {
            if (child.enabled) {
              enabledGridIds.add(child.uniqueMetrcGridId);
            }
          }
        }

        const filteredSearchConfig = searchConfig.filter((x) =>
          enabledGridIds.has(x.uniqueMetrcGridId)
        );

        try {
          // Generate promises
          const promises = filteredSearchConfig.map(({ loader, params, key }) =>
            loader(params as any).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((entry) =>
                generateSearchResultMetadata(queryString, { [key]: entry })
              );

              if (ctx.state.queryId !== queryId) {
                console.log("Stale results, exiting");
                return;
              }

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            })
          );

          // Execute all promises using Promise.allSettled
          await Promise.allSettled(promises);

          // NEXT: handle what happens when some searches fail

          if (ctx.state.queryId !== queryId) {
            return;
          }
          ctx.commit(SearchMutations.SEARCH_MUTATION, {
            status: SearchStatus.SUCCESS,
          });
        } catch (e) {
          if (ctx.state.queryId !== queryId) {
            return;
          }
          console.error(e);
          ctx.commit(SearchMutations.SEARCH_MUTATION, {
            status: SearchStatus.ERROR,
            statusMessage: (e as Error).toString(),
          });
        }
      },
      QUERY_DEBOUNCE_MS
    ),
  },
};

export const searchReducer = (state: ISearchState): ISearchState => ({
  ...state,
  ...inMemoryState,
});
