import {
  ChromeStorageKeys,
  LandingPage,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel,
} from "@/consts";
import { DarkModeState, IPluginState, SnowflakeState } from "@/interfaces";
import { ActionContext } from "vuex";
import { ClientActions } from "../client/consts";
import { SettingsActions, SettingsMutations } from "./consts";
import { ISettingsState } from "./interfaces";

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
  hideFacilityPicker: false,
  hideInlineTransferButtons: false,
  hidePackageSearch: false,
  hideQuickActionButtons: false,
  hideScreenshotButton: false,
  hideTransferSearch: false,
  landingPage: LandingPage.PACKAGES,
  licenseKey: "",
  homeLicenses: {},
  packageDefaultPageSize: 20,
  plantDefaultPageSize: 20,
  preventLogout: true,
  fixMetrcStyling: true,
  efficientSpacing: false,
  autoDismissPopups: true,
  salesDefaultPageSize: 20,
  snowflakeState: SnowflakeState.DISABLED,
  snowflakeCharacter: "❅",
  snowflakeImageCrop: "none",
  snowflakeSize: "md",
  snowflakeImage: "",
  snowflakeText: "LET IT SNOW",
  tagDefaultPageSize: 20,
  transferDefaultPageSize: 20,
  useLegacyScreenshot: false,
  enableManifestDocumentViewer: false,
  hideListingsButton: false,
  preventActiveProjectPageLeave: true,
  autoRefreshOnModalClose: false,
  disableAutoRefreshOnModalClose: false,
  useLegacyDateFormatForSubmit: false,
  writeSettingsToChromeStorage: false,
  loadDataInParallel: true,
  usePersistedCache: false,
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
  },
  getters: {},
  actions: {
    [SettingsActions.UPDATE_SETTINGS](
      ctx: ActionContext<ISettingsState, IPluginState>,
      settings: any
    ) {
      for (const [key, value] of Object.entries(settings)) {
        // @ts-ignore
        ctx.state[key] = value;
      }

      if (ctx.state.writeSettingsToChromeStorage) {
        console.log("Persisting settings");
        try {
          chrome.storage.local.set({ [ChromeStorageKeys.SETTINGS]: ctx.state });
        } catch (e) {
          console.error(e);
        }
      }

      ctx.dispatch(
        `client/${ClientActions.UPDATE_CLIENT_VALUES}`,
        { notify: true },
        { root: true }
      );
    },
  },
};

export const settingsReducer = (state: ISettingsState): ISettingsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
