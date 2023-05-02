import { TransferFilterIdentifiers, TransferState } from "@/consts";
import { ITransferSearchFilters, IPluginState } from "@/interfaces";
import { pageManager } from "@/modules/page-manager.module";
import { maybePushOntoUniqueStack } from "@/utils/search";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { TransferSearchActions, TransferSearchMutations } from "./consts";
import { ITransferSearchState } from "./interfaces";

const inMemoryState = {
  transferQueryString: "",
  showTransferSearchResults: false,
  transferSearchFilters: {
    manifestNumber: null,
  }
};

const persistedState = {
  expandSearchOnNextLoad: false,
  transferQueryStringHistory: []
};

const defaultState: ITransferSearchState = {
  ...inMemoryState,
  ...persistedState
};

export const transferSearchModule = {
  state: () => defaultState,
  mutations: {
    [TransferSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      state: ITransferSearchState,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      state.expandSearchOnNextLoad = expandSearchOnNextLoad;
    },
    [TransferSearchMutations.SET_TRANSFER_QUERY_STRING](
      state: ITransferSearchState,
      { transferQueryString }: { transferQueryString: string }
    ) {
      state.transferQueryString = transferQueryString;

      state.transferQueryStringHistory = maybePushOntoUniqueStack(
        transferQueryString,
        state.transferQueryStringHistory
      );
    },
    [TransferSearchMutations.SET_SHOW_TRANSFER_SEARCH_RESULTS](
      state: ITransferSearchState,
      { showTransferSearchResults }: { showTransferSearchResults: boolean }
    ) {
      state.showTransferSearchResults = showTransferSearchResults;
    },
    [TransferSearchMutations.SET_TRANSFER_SEARCH_FILTERS](
      state: ITransferSearchState,
      { transferSearchFilters }: { transferSearchFilters: ITransferSearchFilters }
    ) {
      state.transferSearchFilters = {
        ...transferSearchFilters
      };
    }
  },
  getters: {},
  actions: {
    [TransferSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD](
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      { expandSearchOnNextLoad }: { expandSearchOnNextLoad: boolean }
    ) {
      ctx.commit(TransferSearchMutations.SET_EXPAND_SEARCH_ON_NEXT_LOAD, { expandSearchOnNextLoad });
    },
    [TransferSearchActions.SET_TRANSFER_QUERY_STRING](
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      { transferQueryString }: { transferQueryString: string }
    ) {
      ctx.commit(TransferSearchMutations.SET_TRANSFER_QUERY_STRING, { transferQueryString });
    },
    [TransferSearchActions.SET_SHOW_TRANSFER_SEARCH_RESULTS](
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      { showTransferSearchResults }: { showTransferSearchResults: boolean }
    ) {
      ctx.commit(TransferSearchMutations.SET_SHOW_TRANSFER_SEARCH_RESULTS, {
        showTransferSearchResults
      });
    },
    [TransferSearchActions.PARTIAL_UPDATE_TRANSFER_SEARCH_FILTERS]: async (
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      {
        transferSearchFilters,
        propagate = true,
        transferState = null
      }: {
        transferSearchFilters: ITransferSearchFilters;
        propagate?: boolean;
        transferState?: TransferState | null;
      }
    ) => {
      if (transferState) {
        switch (transferState as TransferState) {
          case TransferState.INCOMING:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Incoming");
            break;
          case TransferState.OUTGOING:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Outgoing");
            break;
          case TransferState.REJECTED:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Rejected");
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(TransferSearchActions.SET_TRANSFER_SEARCH_FILTERS, {
        transferSearchFilters: {
          ...ctx.state.transferSearchFilters,
          ...transferSearchFilters
        },
        propagate
      });
    },
    [TransferSearchActions.SET_TRANSFER_SEARCH_FILTERS](
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      {
        transferSearchFilters,
        propagate = true
      }: { transferSearchFilters: ITransferSearchFilters; propagate?: boolean }
    ) {
      const defaultTransferSearchFilters = {
        manifestNumber: null
      };

      transferSearchFilters = {
        ...defaultTransferSearchFilters,
        ...transferSearchFilters
      };

      if (propagate) {
        for (let [k, v] of Object.entries(transferSearchFilters)) {
          // @ts-ignore
          if (ctx.state.transferSearchFilters[k] !== v) {
            switch (k) {
              case "manifestNumber":
                pageManager.setTransferFilter(TransferFilterIdentifiers.ManifestNumber, v);
                break;
              default:
                break;
            }
          }
        }
      }

      ctx.commit(TransferSearchMutations.SET_TRANSFER_SEARCH_FILTERS, { transferSearchFilters });
    }
  }
};

export const transferSearchReducer = (state: ITransferSearchState): ITransferSearchState => {
  return {
    ...state,
    ...inMemoryState
  };
};
