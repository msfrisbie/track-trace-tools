import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { SearchActions, SearchMutations } from "./consts";
import { ISearchState, SearchType } from "./interfaces";

const inMemoryState = {};

const persistedState = {
  searchType: "PACKAGES" as SearchType
};

const defaultState: ISearchState = {
  ...inMemoryState,
  ...persistedState
};

export const searchModule = {
  state: () => defaultState,
  mutations: {
    [SearchMutations.SET_SEARCH_TYPE](
      state: ISearchState,
      { searchType }: { searchType: SearchType }
    ) {
      state.searchType = searchType;
    }
  },
  getters: {},
  actions: {
    [SearchActions.SET_SEARCH_TYPE](
      ctx: ActionContext<ISearchState, IPluginState>,
      { searchType }: { searchType: SearchType }
    ) {
      ctx.commit(SearchMutations.SET_SEARCH_TYPE, { searchType });
    }
  }
};

export const searchReducer = (state: ISearchState): ISearchState => {
  return {
    ...state,
    ...inMemoryState
  };
};
