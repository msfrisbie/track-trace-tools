import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { ListingActions, ListingMutations } from './consts';
import { IListingState } from './interfaces';

const inMemoryState = {
  packageData: null,
  packageHistory: []
};

const persistedState = {
  enablePackageUpsert: false,
};

const defaultState: IListingState = {
  ...inMemoryState,
  ...persistedState
};

export const listingModule = {
  state: () => defaultState,
  mutations: {
    [ListingMutations.SET_LISTING_DATA](state: IListingState, data: any) {
      for (const [key, value] of Object.entries(data)) {
        // @ts-ignore
        state[key] = value;
      }
    },
    [ListingMutations.RESET_LISTING_DATA](state: IListingState) {
      for (const [key, value] of Object.entries(defaultState)) {
        // @ts-ignore
        state[key] = value;
      }
    },
  },
  getters: {},
  actions: {
    [ListingActions.SET_LISTING_DATA](ctx: ActionContext<IListingState, IPluginState>, data: any) {
      ctx.commit(ListingMutations.SET_LISTING_DATA, data);
    },
    [ListingActions.RESET_LISTING_DATA](ctx: ActionContext<IListingState, IPluginState>) {
      ctx.commit(ListingMutations.RESET_LISTING_DATA);
    },
  },
};

export const listingReducer = (state: IListingState): IListingState => ({
  ...state,
  ...inMemoryState
});
