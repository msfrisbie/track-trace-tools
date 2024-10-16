import { HarvestState, MessageType, MetrcGridId, TagState, TransferState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { generateSearchResultMetadata } from "@/modules/page-manager/search-utils";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { getHashData, setHashData } from "@/utils/url";
import _ from "lodash-es";
import { ActionContext } from "vuex";
import { SearchActions, SearchMutations, SearchStatus, SearchType } from "./consts";
import { ISearchResult, ISearchState } from "./interfaces";

const inMemoryState = {
  queryString: "",
  status: SearchStatus.INITIAL,
  statusMessage: null,
  showSearchResults: false,
  modalSearchOpen: false,
  queryLicenseNumber: "", // TODO
  searchResults: [],
  activeSearchResult: null,
  searchType: SearchType.PACKAGES,
  metrcGridFilters: {},
  activeMetrcGridId: null,
};

const persistedState = {
  queryStringHistory: [],
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
      { newSearchResults, searchId }: { newSearchResults: ISearchResult[]; searchId: string }
    ) {
      // If this search did not come from the current queryString, discard
      // if (state.queryString !== searchId) {
      //   return;
      // }

      state.searchResults = [...newSearchResults, ...state.searchResults].sort(
        (a, b) => b.score - a.score
      );

      const highestScoreSearchResult: ISearchResult | null = state.searchResults[0] ?? null;

      if (!highestScoreSearchResult) {
        return;
      }

      if (
        !state.activeSearchResult ||
        state.activeSearchResult.score < highestScoreSearchResult.score
      ) {
        state.activeSearchResult = highestScoreSearchResult;
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
    [SearchActions.SET_SEARCH_TYPE](
      ctx: ActionContext<ISearchState, IPluginState>,
      { searchType }: { searchType: SearchType }
    ) {
      ctx.commit(SearchMutations.SEARCH_MUTATION, { searchType });
    },
    // [SearchActions.INITIALIZE_SEARCH_TYPE](ctx: ActionContext<ISearchState, IPluginState>) {
    //   // if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
    //   //   ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: SearchType.PLANTS });
    //   // } else if (window.location.pathname.match(TAG_TAB_REGEX)) {
    //   //   ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: SearchType.TAGS });
    //   // } else if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
    //   //   ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: SearchType.TRANSFERS });
    //   // } else if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
    //   //   ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: SearchType.PACKAGES });
    //   // }
    // },

    [SearchActions.MIRROR_METRC_SEARCH_FILTERS]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        searchFilters,
        metrcGridId,
      }: {
        searchFilters: { [key: string]: string };
        metrcGridId: MetrcGridId;
      }
    ) => {
      const metrcGridFilters = {
        ...ctx.state.metrcGridFilters,
        [metrcGridId]: searchFilters,
      };

      ctx.commit(SearchMutations.SEARCH_MUTATION, { metrcGridFilters });
    },
    [SearchActions.SET_ACTIVE_METRC_GRID_ID]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        metrcGridId,
      }: {
        metrcGridId: MetrcGridId;
      }
    ) => {
      const currentHashData = getHashData();

      setHashData({
        ...currentHashData,
        activeMetrcGridId: metrcGridId,
      });

      ctx.commit(SearchMutations.SEARCH_MUTATION, { activeMetrcGridId: metrcGridId });
    },
    [SearchActions.EXECUTE_QUERY]: _.debounce(
      async (
        ctx: ActionContext<ISearchState, IPluginState>,
        { queryString }: { queryString: string }
      ) => {
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

        ctx.commit(SearchMutations.SEARCH_MUTATION, {
          queryStringHistory: maybePushOntoUniqueStack(queryString, ctx.state.queryStringHistory),
          status: SearchStatus.INFLIGHT,
          searchResults: [],
        });

        const searchId = queryString.toString();

        try {
          await Promise.allSettled([
            primaryDataLoader.onDemandActivePackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) =>
                generateSearchResultMetadata(queryString, {
                  pkg,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInTransitPackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) =>
                generateSearchResultMetadata(queryString, {
                  pkg,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInactivePackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) =>
                generateSearchResultMetadata(queryString, {
                  pkg,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandTransferredPackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((transferPkg) =>
                generateSearchResultMetadata(queryString, {
                  transferPkg,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandFloweringPlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) =>
                generateSearchResultMetadata(queryString, {
                  plant,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandVegetativePlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) =>
                generateSearchResultMetadata(queryString, {
                  plant,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInactivePlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) =>
                generateSearchResultMetadata(queryString, {
                  plant,
                })
              );

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                searchId,
                newSearchResults,
              });
            }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.INCOMING,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((incomingTransfer) =>
                  generateSearchResultMetadata(queryString, {
                    incomingTransfer,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.INCOMING_INACTIVE,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((incomingTransfer) =>
                  generateSearchResultMetadata(queryString, {
                    incomingTransfer,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.OUTGOING,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) =>
                  generateSearchResultMetadata(queryString, {
                    outgoingTransfer,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.OUTGOING_INACTIVE,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) =>
                  generateSearchResultMetadata(queryString, {
                    outgoingTransfer,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.REJECTED,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) =>
                  generateSearchResultMetadata(queryString, {
                    outgoingTransfer,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.AVAILABLE })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) =>
                  generateSearchResultMetadata(queryString, {
                    tag,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.USED })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) =>
                  generateSearchResultMetadata(queryString, {
                    tag,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.VOIDED })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) =>
                  generateSearchResultMetadata(queryString, {
                    tag,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandHarvestSearch({ queryString, harvestState: HarvestState.ACTIVE })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((harvest) =>
                  generateSearchResultMetadata(queryString, {
                    harvest,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            primaryDataLoader
              .onDemandHarvestSearch({ queryString, harvestState: HarvestState.INACTIVE })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((harvest) =>
                  generateSearchResultMetadata(queryString, {
                    harvest,
                  })
                );

                ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                  searchId,
                  newSearchResults,
                });
              }),
            // TODO load sales
          ]);

          // TODO handle what happens when some searches fail

          ctx.commit(SearchMutations.SEARCH_MUTATION, {
            status: SearchStatus.SUCCESS,
          });
        } catch (e) {
          ctx.commit(SearchMutations.SEARCH_MUTATION, {
            status: SearchStatus.ERROR,
            statusMessage: (e as Error).toString(),
          });
        }
      },
      700
    ),
  },
};

export const searchReducer = (state: ISearchState): ISearchState => ({
  ...state,
  ...inMemoryState,
});
