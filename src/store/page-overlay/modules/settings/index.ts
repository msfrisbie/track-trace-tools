import {
  ChromeStorageKeys,
  LandingPage,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel
} from '@/consts';
import {
  BackgroundState, DarkModeState, IPluginState, SnowflakeState
} from '@/interfaces';
import { ActionContext } from 'vuex';
import { ClientActions } from '../client/consts';
import { SettingsActions, SettingsMutations } from './consts';
import { ISettingsState } from './interfaces';

const inMemoryState = {};

const persistedState: ISettingsState = {
  autoOpenActivePackages: true,
  autoOpenPackageTab: PackageTabLabel.ACTIVE,
  autoOpenActiveSales: true,
  autoOpenSalesTab: SalesTabLabel.ACTIVE,
  autoOpenAvailableTags: true,
  autoOpenTagsTab: TagsTabLabel.AVAILABLE,
  autoOpenFloweringPlants: true,
  autoOpenPlantsTab: PlantsTabLabel.FLOWERING,
  autoOpenIncomingTransfers: true,
  autoOpenTransfersTab: TransfersTabLabel.OUTGOING,
  darkModeState: DarkModeState.DISABLED,
  disablePopups: false,
  disableSnowAnimation: false,
  enableTransferTools: true,
  hideFacilityPicker: false,
  hideInlineTransferButtons: false,
  hidePackageSearch: false,
  hideQuickActionButtons: false,
  hideTransferSearch: false,
  landingPage: LandingPage.PACKAGES,
  licenseKey: '',
  homeLicenses: {},
  packageDefaultPageSize: 20,
  plantDefaultPageSize: 20,
  preventLogout: true,
  fixMetrcStyling: true,
  hideAiButton: true,
  efficientSpacing: false,
  modalExpand: false,
  autoDismissPopups: true,
  salesDefaultPageSize: 20,
  backgroundState: BackgroundState.DEFAULT,
  backgroundColor: '#49276a',
  backgroundGradientStartColor: '#49276a',
  backgroundGradientEndColor: '#ffffff',
  backgroundImage: '',
  snowflakeState: SnowflakeState.DISABLED,
  snowflakeCharacter: '❅',
  snowflakeImageCrop: 'none',
  snowflakeSize: 'md',
  snowflakeImage: '',
  snowflakeText: 'LET IT SNOW',
  tagDefaultPageSize: 20,
  transferDefaultPageSize: 20,
  enableManifestDocumentViewer: false,
  hideListingsButton: false,
  preventActiveProjectPageLeave: true,
  autoRefreshOnModalClose: false,
  disableAutoRefreshOnModalClose: false,
  useLegacyDateFormatForSubmit: false,
  writeSettingsToChromeStorage: false,
  enableSameItemPatch: false,
  enableLegacyTransferTools: false,
  loadDataInParallel: true,
  usePersistedCache: false,
  persistTimestamp: 0,
  email: ""
};

const defaultState: ISettingsState = {
  ...inMemoryState,
  ...persistedState,
};

export const settingsModule = {
  state: () => defaultState,
  mutations: {
    [SettingsMutations.SET_HOME_LICENSE](state: ISettingsState, homeLicense: [string, string]) {
      state.homeLicenses[homeLicense[0]] = homeLicense[1];
    },
    [SettingsMutations.SETTINGS_MUTATION](state: ISettingsState, data: Partial<ISettingsState>) {
      (Object.keys(data) as Array<keyof ISettingsState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {},
  actions: {
    [SettingsActions.RESET_SETTINGS](
      ctx: ActionContext<ISettingsState, IPluginState>,
    ) {
      ctx.dispatch(SettingsActions.UPDATE_SETTINGS, defaultState);
    },
    async [SettingsActions.UPDATE_SETTINGS](
      ctx: ActionContext<ISettingsState, IPluginState>,
      settings: Partial<ISettingsState>,
    ) {
      console.log('Updating settings');

      ctx.commit(SettingsMutations.SETTINGS_MUTATION, settings as Partial<ISettingsState>);
      ctx.commit(SettingsMutations.SETTINGS_MUTATION, { persistTimestamp: Date.now() } as Partial<ISettingsState>);

      // Always write
      try {
        await chrome.storage.local.set({ [ChromeStorageKeys.SETTINGS]: ctx.state });
      } catch (e) {
        console.error(e);
      }

      ctx.dispatch(
        `client/${ClientActions.UPDATE_CLIENT_VALUES}`,
        { notify: true },
        { root: true },
      );
    },
  },
};

export const settingsReducer = (state: ISettingsState): ISettingsState => ({
  ...state,
  ...inMemoryState,
});
