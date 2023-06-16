import { IPluginState } from "@/interfaces";
import {
  PACKAGE_TAB_REGEX,
  PLANTS_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_TAB_REGEX,
} from "@/modules/page-manager/consts";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { ActionContext } from "vuex";
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

      ctx.state.queryStringHistory = maybePushOntoUniqueStack(
        queryString,
        ctx.state.queryStringHistory
      );
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
    [SearchActions.INITIALIZE_SEARCH_TYPE](ctx: ActionContext<ISearchState, IPluginState>, {}: {}) {
      console.log(window.location.pathname);

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
  },
};

export const searchReducer = (state: ISearchState): ISearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
