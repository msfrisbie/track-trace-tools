import {
  BackgroundTaskState,
  DEBUG_ATTRIBUTE,
  LandingPage,
  SearchModalView,
  ToolkitView,
  VUEX_KEY,
} from "@/consts";
import {
  DarkModeState,
  IAccountSettings,
  IContactData,
  IMetrcStatusData,
  IPluginState,
  ISettings,
  ITagSearchFilters,
  ITrackedInteractions,
  ITransferSearchFilters,
  SnowflakeState,
} from "@/interfaces";
import { isDevelopment } from "@/modules/environment.module";
import { MutationType } from "@/mutation-types";
import { CsvUpload } from "@/types";
import { maybePushOntoUniqueStack } from "@/utils/search";
import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";
import { flagsModule, flagsReducer } from "./modules/flags/index";
import { listingModule, listingReducer } from "./modules/listing";
import { packageSearchModule, packageSearchReducer } from "./modules/package-search";
import { plantSearchModule, plantSearchReducer } from "./modules/plant-search";
import { pluginAuthModule, pluginAuthReducer } from "./modules/plugin-auth/index";
import {
  promoteImmaturePlantsBuilderModule,
  promoteImmaturePlantsBuilderReducer,
} from "./modules/promote-immature-plants-builder";
import { searchModule, searchReducer } from "./modules/search";
import {
  splitPackageBuilderModule,
  splitPackageBuilderReducer,
} from "./modules/split-package-builder";
import { transferBuilderModule, transferBuilderReducer } from "./modules/transfer-builder/index";

// Taken from https://gist.github.com/Myeris/3f13b42f6764ded6640cef693d9d1987
const vuexLocal = {
  key: VUEX_KEY,
  storage: window.localStorage,
};

// Firefox doesn't like this
// const vuexLocalForage = {
//   key: VUEX_KEY,
//   storage: localforage,
//   asyncStorage: true
// };

const vuexShared = {
  reducer: (state: IPluginState) => {
    return {
      ...state,
      // @ts-ignore
      pluginAuth: pluginAuthReducer(state.pluginAuth),
      // @ts-ignore
      search: searchReducer(state.search),
      // @ts-ignore
      transferBuilder: transferBuilderReducer(state.transferBuilder),
      // @ts-ignore
      packageSearch: packageSearchReducer(state.packageSearch),
      // @ts-ignore
      plantSearch: plantSearchReducer(state.plantSearch),
      // @ts-ignore
      flags: flagsReducer(state.flags),
      // @ts-ignore
      splitPackageBuilder: splitPackageBuilderReducer(state.splitPackageBuilder),
      promoteImmaturePlantsBuilder: promoteImmaturePlantsBuilderReducer(
        // @ts-ignore
        state.promoteImmaturePlantsBuilder
      ),
      // @ts-ignore
      listing: listingReducer(state.listing),
    };
  },
};

const vuexPersistence = new VuexPersistence({ ...vuexLocal, ...vuexShared });

Vue.use(Vuex);

const defaultState: IPluginState = {
  accountEnabled: false,
  accountSettings: {
    backupBuilderSubmits: true,
  },
  contactData: null,
  currentVersion: null,
  currentView: null,
  currentViewSelectedAt: null,
  credentials: null,
  debugMode: false,
  demoMode: false,
  mockDataMode: false,
  errorMessage: null,
  expanded: false,
  builderModalOpen: null,
  flashMessage: null,
  flashMessageTimeout: null,
  loadingMessage: null,
  muteAnalytics: isDevelopment(),
  navigateOnNextLoad: false,
  showTransferSearchResults: false,
  omniQueryString: "",
  omniQueryStringHistory: [],
  searchModalView: null,
  taskQueue: [],
  taskQueuePaused: false,
  metrcStatusData: null,
  // packageSearchFilters: {
  // },
  transferQueryString: "",
  transferQueryStringHistory: [],
  transferSearchFilters: {
    manifestNumber: null,
  },
  tagQueryString: "",
  tagQueryStringHistory: [],
  tagSearchFilters: {
    label: null,
  },
  settings: {
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
  },
  trackedInteractions: {
    dismissedScreenshotPopover: false,
    dismissedCsvBuilderPopover: false,
    dismissedBuilderPopover: false,
    dismissedToolboxPopover: false,
    dismissedReportsPopover: false,
    dismissedFacilityPopover: false,
    dismissedSearchPopover: false,
  },
  backgroundTasks: {
    finalizeSalesReceiptsState: BackgroundTaskState.IDLE,
    finalizeSalesReceiptsLicense: null,
    finalizeSalesReceiptsStopIsodate: null,
    finalizeSalesReceiptsReadout: null,
    finalizeSalesReceiptsRunningTotal: 0,
    voidTagsState: BackgroundTaskState.IDLE,
    finalizeSalesReceiptsConsecutiveErrorTotal: 0,
    voidTagsLicense: null,
    voidTagsStartTag: null,
    voidTagsEndTag: null,
    voidTagsLastAttemptedTag: null,
    voidTagsReadout: null,
    voidTagsRunningTotal: 0,
    voidTagsConsecutiveErrorTotal: 0,
  },
};

export default new Vuex.Store({
  state: defaultState,
  mutations: {
    [MutationType.RESET_STATE](state: IPluginState) {
      Object.assign(state, defaultState);
    },
    [MutationType.SET_CURRENT_VERSION](state: IPluginState, version: string) {
      state.currentVersion = version;
    },
    [MutationType.SELECT_VIEW](state: IPluginState, view: ToolkitView) {
      state.currentView = view;
    },
    [MutationType.TOGGLE_EXPANDED_OVERLAY](state: IPluginState) {
      state.expanded = !state.expanded;
    },
    [MutationType.SET_EXPANDED_OVERLAY](state: IPluginState, expanded: boolean) {
      state.expanded = expanded;
    },
    [MutationType.SET_CONTACT_DATA](state: IPluginState, contactData: IContactData) {
      state.contactData = {
        ...contactData,
      };
    },
    [MutationType.SET_HOME_LICENSE](state: IPluginState, homeLicense: [string, string]) {
      state.settings.homeLicenses[homeLicense[0]] = homeLicense[1];
    },
    [MutationType.UPDATE_SETTINGS](state: IPluginState, settings: ISettings) {
      state.settings = {
        ...settings,
      };
    },
    [MutationType.UPDATE_ACCOUNT_SETTINGS](state: IPluginState, accountSettings: IAccountSettings) {
      state.accountSettings = {
        ...accountSettings,
      };
    },
    [MutationType.UPDATE_TRACKED_INTERACTIONS](
      state: IPluginState,
      trackedInteractions: ITrackedInteractions
    ) {
      state.trackedInteractions = {
        ...trackedInteractions,
      };
    },
    [MutationType.RESET_TRACKED_INTERACTIONS](state: IPluginState) {
      state.trackedInteractions = defaultState.trackedInteractions;
    },
    [MutationType.SET_TRANSFER_SEARCH_FILTERS](
      state: IPluginState,
      transferSearchFilters: ITransferSearchFilters
    ) {
      state.transferSearchFilters = {
        ...transferSearchFilters,
      };
    },
    [MutationType.SET_TAG_SEARCH_FILTERS](
      state: IPluginState,
      tagSearchFilters: ITagSearchFilters
    ) {
      state.tagSearchFilters = {
        ...tagSearchFilters,
      };
    },
    // [MutationType.ENQUEUE_TASK](state: IPluginState, taskData: Task) {
    //   state.taskQueue.push(taskData);
    // },
    // [MutationType.DEQUEUE_TASK](state: IPluginState, taskId: string) {
    //   for (let i = 0; i < state.taskQueue.length; i++) {
    //     let obj = state.taskQueue[i];

    //     if (obj.taskId === taskId) {
    //       state.taskQueue.splice(i, 1);
    //       break;
    //     }
    //   }
    // },
    [MutationType.PURGE_TASK_QUEUE](state: IPluginState) {
      state.taskQueue = [];
    },
    // [MutationType.TOGGLE_PAUSE_TASK_QUEUE](state: IPluginState) {
    //   state.taskQueuePaused = !state.taskQueuePaused
    // },
    [MutationType.TOGGLE_DEBUG_MODE](state: IPluginState) {
      console.error("DEPRECATED! do not call this!");
      // state.debugMode = !state.debugMode;
    },
    [MutationType.SET_DEMO_MODE](state: IPluginState, demoMode: boolean) {
      state.demoMode = demoMode;
    },
    [MutationType.SET_MOCK_DATA_MODE](state: IPluginState, mockDataMode: boolean) {
      state.mockDataMode = mockDataMode;
    },
    [MutationType.SET_DEBUG_MODE](state: IPluginState, debugMode: boolean) {
      state.debugMode = debugMode;

      // Synchronously propagate to attribute
      document.body.setAttribute(DEBUG_ATTRIBUTE, debugMode.toString());
    },
    [MutationType.SET_MUTE_ANALYTICS](state: IPluginState, muteAnalytics: boolean) {
      state.muteAnalytics = muteAnalytics;
    },
    [MutationType.SET_TRANSFER_QUERY_STRING](state: IPluginState, transferQueryString: string) {
      state.transferQueryString = transferQueryString;

      state.transferQueryStringHistory = maybePushOntoUniqueStack(
        transferQueryString,
        state.transferQueryStringHistory
      );
    },
    [MutationType.SET_TAG_QUERY_STRING](state: IPluginState, tagQueryString: string) {
      state.tagQueryString = tagQueryString;

      state.tagQueryStringHistory = maybePushOntoUniqueStack(
        tagQueryString,
        state.tagQueryStringHistory
      );
    },
    [MutationType.SET_OMNI_QUERY_STRING](state: IPluginState, omniQueryString: string) {
      state.omniQueryString = omniQueryString;

      state.omniQueryStringHistory = maybePushOntoUniqueStack(
        omniQueryString,
        state.omniQueryStringHistory
      );
    },
    [MutationType.SET_LOADING_MESSAGE](state: IPluginState, loadingMessage: string | null) {
      state.loadingMessage = loadingMessage;
    },
    [MutationType.SET_ERROR_MESSAGE](state: IPluginState, errorMessage: string | null) {
      state.errorMessage = errorMessage;
    },
    [MutationType.SET_REDIRECT](state: IPluginState, value: boolean) {
      state.navigateOnNextLoad = value;
    },
    [MutationType.SET_FLASH_MESSAGE](state: IPluginState, flashMessage: string | null) {
      // DEPRECATED in favor of toast
      state.flashMessageTimeout && clearTimeout(state.flashMessageTimeout);

      state.flashMessage = flashMessage;

      if (flashMessage) {
        state.flashMessageTimeout = setTimeout(() => {
          state.flashMessage = null;
        }, 3000) as any;
      }
    },
    [MutationType.SET_SEARCH_MODAL_VIEW](state: IPluginState, searchModalView: SearchModalView) {
      state.searchModalView = searchModalView;
    },
    [MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS](
      state: IPluginState,
      showTransferSearchResults: boolean
    ) {
      state.showTransferSearchResults = showTransferSearchResults;
    },
    [MutationType.SET_BUILDER_MODAL_DISPLAY_STATE](
      state: IPluginState,
      builderModalOpen: CsvUpload | null
    ) {
      state.builderModalOpen = builderModalOpen;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_STATE](
      state: IPluginState,
      finalizeSalesReceiptsState: BackgroundTaskState
    ) {
      state.backgroundTasks.finalizeSalesReceiptsState = finalizeSalesReceiptsState;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_LICENSE](
      state: IPluginState,
      finalizeSalesReceiptsLicense: string
    ) {
      state.backgroundTasks.finalizeSalesReceiptsLicense = finalizeSalesReceiptsLicense;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_STOP_DATE](
      state: IPluginState,
      finalizeSalesReceiptsStopIsodate: string | null
    ) {
      state.backgroundTasks.finalizeSalesReceiptsStopIsodate = finalizeSalesReceiptsStopIsodate;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_READOUT](
      state: IPluginState,
      finalizeSalesReceiptsReadout: string | null
    ) {
      state.backgroundTasks.finalizeSalesReceiptsReadout = finalizeSalesReceiptsReadout;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_RUNNING_TOTAL](
      state: IPluginState,
      finalizeSalesReceiptsRunningTotal: number
    ) {
      state.backgroundTasks.finalizeSalesReceiptsRunningTotal = finalizeSalesReceiptsRunningTotal;
    },
    [MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL](
      state: IPluginState,
      finalizeSalesReceiptsConsecutiveErrorTotal: number
    ) {
      state.backgroundTasks.finalizeSalesReceiptsConsecutiveErrorTotal =
        finalizeSalesReceiptsConsecutiveErrorTotal;
    },
    [MutationType.SET_VOID_TAGS_STATE](state: IPluginState, voidTagsState: BackgroundTaskState) {
      state.backgroundTasks.voidTagsState = voidTagsState;
    },
    [MutationType.SET_VOID_TAGS_LICENSE](state: IPluginState, voidTagsLicense: string) {
      state.backgroundTasks.voidTagsLicense = voidTagsLicense;
    },
    [MutationType.SET_VOID_TAGS_DATA](
      state: IPluginState,
      {
        startTag = null,
        endTag = null,
        lastAttemptedTag = null,
      }: { startTag: string | null; endTag: string | null; lastAttemptedTag: null }
    ) {
      state.backgroundTasks.voidTagsStartTag = startTag;
      state.backgroundTasks.voidTagsEndTag = endTag;
      state.backgroundTasks.voidTagsLastAttemptedTag = lastAttemptedTag;
    },
    [MutationType.SET_VOID_TAGS_READOUT](state: IPluginState, voidTagsReadout: string | null) {
      state.backgroundTasks.voidTagsReadout = voidTagsReadout;
    },
    [MutationType.SET_VOID_TAGS_RUNNING_TOTAL](state: IPluginState, voidTagsRunningTotal: number) {
      state.backgroundTasks.voidTagsRunningTotal = voidTagsRunningTotal;
    },
    [MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL](
      state: IPluginState,
      voidTagsConsecutiveErrorTotal: number
    ) {
      state.backgroundTasks.voidTagsConsecutiveErrorTotal = voidTagsConsecutiveErrorTotal;
    },
    [MutationType.SET_ACCOUNT_ENABLED](state: IPluginState, accountEnabled: boolean) {
      state.accountEnabled = accountEnabled;
    },
    [MutationType.UPDATE_METRC_STATUS_DATA](
      state: IPluginState,
      metrcStatusData: IMetrcStatusData | null
    ) {
      state.metrcStatusData = metrcStatusData;
    },
    [MutationType.UPDATE_CREDENTIALS](state: IPluginState, credentials: string | null) {
      state.credentials = credentials;
    },
  },
  getters: {
    authState: (state) => state.pluginAuth?.authState || null,
    packagesUrl: (state) =>
      state.pluginAuth?.authState?.license
        ? `/industry/${state.pluginAuth?.authState?.license}/packages`
        : null,
  },
  actions: {},
  modules: {
    transferBuilder: {
      namespaced: true,
      ...transferBuilderModule,
    },
    pluginAuth: {
      namespaced: true,
      ...pluginAuthModule,
    },
    packageSearch: {
      namespaced: true,
      ...packageSearchModule,
    },
    plantSearch: {
      namespaced: true,
      ...plantSearchModule,
    },
    flags: {
      namespaced: true,
      ...flagsModule,
    },
    splitPackageBuilder: {
      namespaced: true,
      ...splitPackageBuilderModule,
    },
    promoteImmaturePlantsBuilder: {
      namespaced: true,
      ...promoteImmaturePlantsBuilderModule,
    },
    listing: {
      namespaced: true,
      ...listingModule,
    },
    search: {
      namespaced: true,
      ...searchModule,
    },
  },
  plugins: [vuexPersistence.plugin],
});
