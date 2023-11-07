import { IPluginState } from '@/interfaces';
import { authManager } from '@/modules/auth-manager.module';
import { findMatchingTransferPackages } from '@/utils/transfer';
import { ActionContext } from 'vuex';
import {
  TransferPackageSearchActions,
  TransferPackageSearchAlgorithm,
  TransferPackageSearchGetters,
  TransferPackageSearchMutations,
  TransferPackageSearchState,
} from './consts';
import { ITransferPackageSearchState } from './interfaces';

const inMemoryState = {
  startDate: null,
  state: TransferPackageSearchState.INITIAL,
  algorithm: TransferPackageSearchAlgorithm.NEW_TO_OLD,
  results: [],
  abortController: new AbortController(),
  messages: [],
};

const persistedState = {};

const defaultState: ITransferPackageSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const transferPackageSearchModule = {
  state: () => defaultState,
  mutations: {
    [TransferPackageSearchMutations.TRANSFER_PACKAGE_SEARCH_MUTATION](
      state: ITransferPackageSearchState,
      data: any,
    ) {
      // state.data = data;
    },
  },
  getters: {
    [TransferPackageSearchGetters.TRANSFER_PACKAGE_SEARCH_GETTER]: (
      state: ITransferPackageSearchState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    // [TransferPackageSearchActions.TRANSFER_PACKAGE_SEARCH_ACTION]: async (
    //   ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
    //   data: any
    // ) => {
    //   ctx.commit(TransferPackageSearchMutations.TRANSFER_PACKAGE_SEARCH_MUTATION, data);
    // },
    [TransferPackageSearchActions.EXECUTE_SEARCH]: async (
      ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
      data: any,
    ) => {
      ctx.state.state = TransferPackageSearchState.INFLIGHT;
      ctx.state.abortController = new AbortController();

      ctx.state.messages.push({
        message: 'Searching outgoing transfers for packages...',
        variant: 'primary',
        timestamp: Date.now(),
      });

      ctx.state.results = await findMatchingTransferPackages({
        queryString: ctx.rootState.search.queryString,
        startDate: ctx.state.startDate,
        licenses: [(await authManager.authStateOrError()).license],
        signal: ctx.state.abortController.signal,
        algorithm: ctx.state.algorithm,
        updateFn: (matchingTransfers) => {
          ctx.state.results = matchingTransfers;
        },
      });

      ctx.state.messages.push({
        message: `Found ${ctx.state.results.length} matching transfers`,
        variant: 'primary',
        timestamp: Date.now(),
      });
    },
    [TransferPackageSearchActions.STOP_SEARCH]: async (
      ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
      data: any,
    ) => {
      ctx.state.abortController.abort();
      ctx.state.state = TransferPackageSearchState.SUCCESS;
      ctx.state.messages.push({
        message: 'Search terminated, results may be incomplete',
        variant: 'warning',
        timestamp: Date.now(),
      });
    },
    [TransferPackageSearchActions.RESET_SEARCH]: async (
      ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
      data: any,
    ) => {
      ctx.state.algorithm = TransferPackageSearchAlgorithm.OLD_TO_NEW;
      ctx.state.startDate = null;
      ctx.state.results = [];
      ctx.state.state = TransferPackageSearchState.INITIAL;
      ctx.state.messages = [];
      ctx.state.abortController = new AbortController();
    },
    [TransferPackageSearchActions.UPDATE_SEARCH_PARAMETERS]: async (
      ctx: ActionContext<ITransferPackageSearchState, IPluginState>,
      searchParameters: { startDate: string | null; algorithm: TransferPackageSearchAlgorithm },
    ) => {
      ctx.state.algorithm = searchParameters.algorithm;
      ctx.state.startDate = searchParameters.startDate;
    },
  },
};

export const transferPackageSearchReducer = (
  state: ITransferPackageSearchState,
): ITransferPackageSearchState => ({
  ...state,
  ...inMemoryState,
});
