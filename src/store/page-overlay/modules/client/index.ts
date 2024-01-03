import { IPluginState } from '@/interfaces';
import { t3RequestManager } from '@/modules/t3-request-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import { ActionContext } from 'vuex';
import { ClientActions, ClientGetters, ClientMutations } from './consts';
import { IClientState } from './interfaces';

const inMemoryState = {};

const persistedState = {
  clientName: null,
  t3plus: false,
  values: {},
  flags: {}
};

const defaultState: IClientState = {
  ...inMemoryState,
  ...persistedState,
};

export const clientModule = {
  state: () => defaultState,
  mutations: {
    [ClientMutations.CLIENT_MUTATION](state: IClientState, data: Partial<IClientState>) {
      (Object.keys(data) as Array<keyof IClientState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [ClientGetters.T3PLUS]: (
      state: IClientState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => state.t3plus || !!state.values.ENABLE_T3PLUS,
  },
  actions: {
    [ClientActions.UPDATE_CLIENT_VALUES]: async (
      ctx: ActionContext<IClientState, IPluginState>,
      data: { notify?: boolean } = {},
    ) => {
      const plusUsers = await t3RequestManager.loadT3plus();

      const t3plus = plusUsers.length > 0;

      ctx.state.t3plus = t3plus;

      if (!ctx.rootState.settings.licenseKey) {
        ctx.commit(ClientMutations.CLIENT_MUTATION, {
          clientName: null,
          values: {}
        } as Partial<IClientState>);
      } else {
        const { clientName, values } = await t3RequestManager.loadClientDataOrError(
          ctx.rootState.settings.licenseKey,
        );

        if (data.notify && !clientName) {
          toastManager.openToast('This license key is invalid.', {
            title: 'License Key Error',
            autoHideDelay: 5000,
            variant: 'danger',
            appendToast: true,
            toaster: 'ttt-toaster',
            solid: true,
          });
        }

        ctx.commit(ClientMutations.CLIENT_MUTATION, {
          clientName,
          values
        } as Partial<IClientState>);
      }

      const flags = await t3RequestManager.loadFlags();

      ctx.state.flags = flags;
    },
  },
};

export const clientReducer = (state: IClientState): IClientState => ({
  ...state,
  ...inMemoryState,
});
