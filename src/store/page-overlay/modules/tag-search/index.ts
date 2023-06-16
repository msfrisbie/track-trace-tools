import { TagFilterIdentifiers, TagState } from "@/consts";
import { IPluginState, ITagSearchFilters } from "@/interfaces";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { TagSearchActions, TagSearchMutations } from "./consts";
import { ITagSearchState } from "./interfaces";

const inMemoryState = {
  tagQueryString: "",
  showTagSearchResults: false,
  tagSearchFilters: {
    label: null,
    strainName: null,
    locationName: null,
  },
};

const persistedState = {
  expandSearchOnNextLoad: false,
  tagQueryStringHistory: [],
};

const defaultState: ITagSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const tagSearchModule = {
  state: () => defaultState,
  mutations: {
    [TagSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      state: ITagSearchState,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [TagSearchMutations.SET_TAG_QUERY_STRING](
      state: ITagSearchState,
      { tagQueryString }: { tagQueryString: string }
    ) {
      state.tagQueryString = tagQueryString;

      state.tagQueryStringHistory = maybePushOntoUniqueStack(
        tagQueryString,
        state.tagQueryStringHistory
      );
    },
    [TagSearchMutations.SET_SHOW_TAG_SEARCH_RESULTS](
      state: ITagSearchState,
      { showTagSearchResults }: { showTagSearchResults: boolean }
    ) {
      state.showTagSearchResults = showTagSearchResults;
    },
    [TagSearchMutations.SET_TAG_SEARCH_FILTERS](
      state: ITagSearchState,
      { tagSearchFilters }: { tagSearchFilters: ITagSearchFilters }
    ) {
      state.tagSearchFilters = {
        ...tagSearchFilters,
      };
    },
  },
  getters: {},
  actions: {
    [TagSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<ITagSearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.commit(TagSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD, { expandSearchOnNextLoad });
    },
    [TagSearchActions.SET_TAG_QUERY_STRING](
      ctx: ActionContext<ITagSearchState, IPluginState>,
      { tagQueryString }: { tagQueryString: string }
    ) {
      ctx.commit(TagSearchMutations.SET_TAG_QUERY_STRING, { tagQueryString });
    },
    [TagSearchActions.SET_SHOW_TAG_SEARCH_RESULTS](
      ctx: ActionContext<ITagSearchState, IPluginState>,
      { showTagSearchResults }: { showTagSearchResults: boolean }
    ) {
      ctx.commit(TagSearchMutations.SET_SHOW_TAG_SEARCH_RESULTS, {
        showTagSearchResults,
      });
    },
    [TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS]: async (
      ctx: ActionContext<ITagSearchState, IPluginState>,
      {
        tagSearchFilters,
        propagate = true,
        tagState = null,
      }: {
        tagSearchFilters: ITagSearchFilters;
        propagate?: boolean;
        tagState?: TagState | null;
      }
    ) => {
      if (tagState) {
        switch (tagState as TagState) {
          case TagState.AVAILABLE:
            await pageManager.clickTabStartingWith(pageManager.tagTabs, "Available");
            break;
          case TagState.USED:
            await pageManager.clickTabStartingWith(pageManager.tagTabs, "Used");
            break;
          case TagState.VOIDED:
            await pageManager.clickTabStartingWith(pageManager.tagTabs, "Void");
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(TagSearchActions.SET_TAG_SEARCH_FILTERS, {
        tagSearchFilters: {
          ...ctx.state.tagSearchFilters,
          ...tagSearchFilters,
        },
        propagate,
      });
    },
    [TagSearchActions.SET_TAG_SEARCH_FILTERS](
      ctx: ActionContext<ITagSearchState, IPluginState>,
      {
        tagSearchFilters,
        propagate = true,
      }: { tagSearchFilters: ITagSearchFilters; propagate?: boolean }
    ) {
      const defaultTagSearchFilters = {
        label: null,
      };

      tagSearchFilters = {
        ...defaultTagSearchFilters,
        ...tagSearchFilters,
      };

      if (propagate) {
        for (let [k, v] of Object.entries(tagSearchFilters)) {
          // @ts-ignore
          if (ctx.state.tagSearchFilters[k] !== v) {
            switch (k) {
              case "label":
                pageManager.setTagFilter(TagFilterIdentifiers.Label, v);
                break;
              default:
                break;
            }
          }
        }
      }

      ctx.commit(TagSearchMutations.SET_TAG_SEARCH_FILTERS, { tagSearchFilters });
    },
  },
};

export const tagSearchReducer = (state: ITagSearchState): ITagSearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
