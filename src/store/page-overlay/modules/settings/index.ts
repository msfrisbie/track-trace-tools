import { LandingPage } from "@/consts";
import { DarkModeState, SnowflakeState } from "@/interfaces";
import { SettingsMutations } from "./consts";
import { ISettingsState } from "./interfaces";

const inMemoryState = {};

const persistedState: ISettingsState = {
  autoOpenActivePackages: true,
  autoOpenActiveSales: true,
  autoOpenAvailableTags: true,
  autoOpenFloweringPlants: true,
  autoOpenIncomingTransfers: true,
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
  enableSearchOverMetrcModal: true,
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
    },
    [SettingsMutations.SET_HOME_LICENSE](state: ISettingsState, homeLicense: [string, string]) {
      state.homeLicenses[homeLicense[0]] = homeLicense[1];
    },
  },
  getters: {},
  actions: {},
};

export const flagsReducer = (state: ISettingsState): ISettingsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
