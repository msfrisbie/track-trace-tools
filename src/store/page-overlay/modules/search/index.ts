import { MessageType, MetrcGridId, TagState, TransferState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
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
  metrcSearchFilters: {},
  activeGridId: null,
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
      { newSearchResults }: { newSearchResults: ISearchResult[] }
    ) {
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

    [SearchActions.SET_METRC_SEARCH_FILTERS]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        searchFilters,
        metrcGridId,
      }: {
        searchFilters: { [key: string]: string };
        metrcGridId: MetrcGridId;
      }
    ) => {
      const metrcSearchFilters = {
        ...ctx.state.metrcSearchFilters,
        [metrcGridId]: searchFilters,
      };

      ctx.commit(SearchMutations.SEARCH_MUTATION, { metrcSearchFilters });
    },
    [SearchActions.SET_ACTIVE_GRID_ID]: async (
      ctx: ActionContext<ISearchState, IPluginState>,
      {
        metrcGridId,
      }: {
        metrcGridId: MetrcGridId;
      }
    ) => {
      ctx.commit(SearchMutations.SEARCH_MUTATION, { activeGridId: metrcGridId });
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

        try {
          await Promise.allSettled([
            primaryDataLoader.onDemandActivePackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) => ({
                score: 1,
                pkg,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInTransitPackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) => ({
                score: 1,
                pkg,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInactivePackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((pkg) => ({
                score: 1,
                pkg,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandTransferredPackageSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((transferredPkg) => ({
                score: 1,
                transferredPkg,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandFloweringPlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) => ({
                score: 1,
                plant,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandVegetativePlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) => ({
                score: 1,
                plant,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader.onDemandInactivePlantSearch({ queryString }).then((result) => {
              const newSearchResults: ISearchResult[] = result.map((plant) => ({
                score: 1,
                plant,
              }));

              ctx.commit(SearchMutations.PUSH_SEARCH_RESULTS, {
                newSearchResults,
              });
            }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.INCOMING,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((incomingTransfer) => ({
                  score: 1,
                  incomingTransfer,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.INCOMING_INACTIVE,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((incomingTransfer) => ({
                  score: 1,
                  incomingTransfer,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.OUTGOING,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) => ({
                  score: 1,
                  outgoingTransfer,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.OUTGOING_INACTIVE,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) => ({
                  score: 1,
                  outgoingTransfer,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTransferSearch({
                transferState: TransferState.REJECTED,
                queryString,
              })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((outgoingTransfer) => ({
                  score: 1,
                  outgoingTransfer,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.AVAILABLE })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) => ({
                  score: 1,
                  tag,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.USED })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) => ({
                  score: 1,
                  tag,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
            primaryDataLoader
              .onDemandTagSearch({ queryString, tagState: TagState.VOIDED })
              .then((result) => {
                const newSearchResults: ISearchResult[] = result.map((tag) => ({
                  score: 1,
                  tag,
                }));

                ctx.commit(SearchMutations.SEARCH_MUTATION, {
                  searchResults: [...ctx.state.searchResults, ...newSearchResults],
                });
              }),
          ]);

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
