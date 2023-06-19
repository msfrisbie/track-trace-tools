import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import {
  PACKAGE_TAB_REGEX,
  PLANTS_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_TAB_REGEX,
} from "@/modules/page-manager/consts";
import { maybePushOntoUniqueStack } from "@/utils/search";
import _ from "lodash-es";
import { ActionContext } from "vuex";
import { PackageSearchActions } from "../package-search/consts";
import { PlantSearchActions } from "../plant-search/consts";
import { TagSearchActions } from "../tag-search/consts";
import { TransferSearchActions } from "../transfer-search/consts";
import { SearchActions } from "./consts";
import { ISearchState, SearchType } from "./interfaces";

const inMemoryState = {
  queryString: "",
  searchType: "PACKAGES" as SearchType,
  showSearchResults: false,
};

const persistedState = {
  expandSearchOnNextLoad: false,
  queryStringHistory: [],
};

const defaultState: ISearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const searchModule = {
  state: () => defaultState,
  mutations: {},
  getters: {},
  actions: {
    [SearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<ISearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [SearchActions.SET_QUERY_STRING](
      ctx: ActionContext<ISearchState, IPluginState>,
      { queryString }: { queryString: string }
    ) {
      ctx.state.queryString = queryString;

      ctx.dispatch(SearchActions.EXECUTE_QUERY, { queryString });
    },
    [SearchActions.SET_SHOW_SEARCH_RESULTS](
      ctx: ActionContext<ISearchState, IPluginState>,
      { showSearchResults }: { showSearchResults: boolean }
    ) {
      ctx.state.showSearchResults = showSearchResults;
    },
    [SearchActions.SET_SEARCH_TYPE](
      ctx: ActionContext<ISearchState, IPluginState>,
      { searchType }: { searchType: SearchType }
    ) {
      ctx.state.searchType = searchType;
    },
    [SearchActions.INITIALIZE_SEARCH_TYPE](ctx: ActionContext<ISearchState, IPluginState>) {
      if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
        ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: "PLANTS" });
      } else if (window.location.pathname.match(TAG_TAB_REGEX)) {
        ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: "TAGS" });
      } else if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: "TRANSFERS" });
      } else if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        ctx.dispatch(SearchActions.SET_SEARCH_TYPE, { searchType: "PACKAGES" });
      }
    },
    [SearchActions.EXECUTE_QUERY]: _.debounce(
      (
        ctx: ActionContext<ISearchState, IPluginState>,
        { queryString }: { queryString: string }
      ) => {
        if (!queryString.length) {
          return;
        }

        analyticsManager.track(MessageType.ENTERED_SEARCH_QUERY, {
          queryString,
        });

        ctx.state.queryStringHistory = maybePushOntoUniqueStack(
          queryString,
          ctx.state.queryStringHistory
        );

        // searchManager.selectedPackage.next(null);
        // searchManager.selectedPlant.next(null);
        // searchManager.selectedTag.next(null);
        // searchManager.selectedTransfer.next(null);

        ctx.dispatch(
          `packageSearch/${PackageSearchActions.EXECUTE_QUERY}`,
          { queryString },
          { root: true }
        );
        ctx.dispatch(
          `plantSearch/${PlantSearchActions.EXECUTE_QUERY}`,
          { queryString },
          { root: true }
        );
        ctx.dispatch(
          `tagSearch/${TagSearchActions.EXECUTE_QUERY}`,
          { queryString },
          { root: true }
        );
        ctx.dispatch(
          `transferSearch/${TransferSearchActions.EXECUTE_QUERY}`,
          { queryString },
          { root: true }
        );
      },
      500
    ),
  },
};

export const searchReducer = (state: ISearchState): ISearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
