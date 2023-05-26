import {
  ChromeStorageKeys,
  LandingPage,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel,
} from "@/consts";
import { DarkModeState, SnowflakeState } from "@/interfaces";
import { SettingsMutations } from "./consts";
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
  enableSearchOverMetrcModal: false,
  autoRefreshOnModalClose: false,
  useIsoDateFormatForSubmit: true,
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
    [SettingsMutations.SET_SETTINGS](state: ISettingsState, settings: any) {
      for (const [key, value] of Object.entries(settings)) {
        // @ts-ignore
        state[key] = value;
      }

      if (state.writeSettingsToChromeStorage) {
        console.log("Persisting settings");
        try {
          chrome.storage.local.set({ [ChromeStorageKeys.SETTINGS]: state });
        } catch (e) {
          console.error(e);
        }
      }
    },
    [SettingsMutations.SET_HOME_LICENSE](state: ISettingsState, homeLicense: [string, string]) {
      state.homeLicenses[homeLicense[0]] = homeLicense[1];
    },
  },
  getters: {},
  actions: {},
};

export const settingsReducer = (state: ISettingsState): ISettingsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
