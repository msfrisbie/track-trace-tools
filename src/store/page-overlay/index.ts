import {
  BackgroundTaskState,
  DEBUG_ATTRIBUTE,
  SearchModalView,
  ToolkitView,
  VUEX_KEY,
} from "@/consts";
import {
  IAccountSettings,
  IContactData,
  IMetrcStatusData,
  IPluginState,
  IRootState,
  ITagSearchFilters,
  ITrackedInteractions,
  ITransferSearchFilters,
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
import { reportsModule, reportsReducer } from "./modules/reports";
import { packageHistoryModule, packageHistoryReducer } from "./modules/package-history";
import { packageSearchModule, packageSearchReducer } from "./modules/package-search";
import { plantSearchModule, plantSearchReducer } from "./modules/plant-search";
import { pluginAuthModule, pluginAuthReducer } from "./modules/plugin-auth/index";
import {
  promoteImmaturePlantsBuilderModule,
  promoteImmaturePlantsBuilderReducer,
} from "./modules/promote-immature-plants-builder";
import { searchModule, searchReducer } from "./modules/search";
import { settingsModule, settingsReducer } from "./modules/settings";
import {
  splitPackageBuilderModule,
  splitPackageBuilderReducer,
} from "./modules/split-package-builder";
import { transferBuilderModule, transferBuilderReducer } from "./modules/transfer-builder/index";
import { explorerModule, explorerReducer } from "./modules/explorer";
import { transferSearchModule, transferSearchReducer } from "./modules/transfer-search";

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
      pluginAuth: pluginAuthReducer(state.pluginAuth),
      search: searchReducer(state.search),
      transferBuilder: transferBuilderReducer(state.transferBuilder),
      packageSearch: packageSearchReducer(state.packageSearch),
      explorer: explorerReducer(state.explorer),
      plantSearch: plantSearchReducer(state.plantSearch),
      transferSearch: transferSearchReducer(state.transferSearch),
      flags: flagsReducer(state.flags),
      splitPackageBuilder: splitPackageBuilderReducer(state.splitPackageBuilder),
      promoteImmaturePlantsBuilder: promoteImmaturePlantsBuilderReducer(
        state.promoteImmaturePlantsBuilder
      ),
      listing: listingReducer(state.listing),
      settings: settingsReducer(state.settings),
      packageHistory: packageHistoryReducer(state.packageHistory),
      reports: reportsReducer(state.reports),
    };
  },
};

const vuexPersistence = new VuexPersistence({ ...vuexLocal, ...vuexShared });

Vue.use(Vuex);

const defaultState: IRootState = {
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
  trackedInteractions: {
    dismissedScreenshotPopover: false,
    dismissedCsvBuilderPopover: false,
    dismissedBuilderPopover: false,
    dismissedToolboxPopover: false,
    dismissedReportsPopover: false,
    dismissedFacilityPopover: false,
    dismissedSearchPopover: false,
    dismissedQuickScriptsPopover: false,
    dismissedSnapshotPopover: false
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
  }
};

export default new Vuex.Store<IPluginState>({
  // Modules will set their own default state
  state: defaultState as IPluginState,
  mutations: {
    [MutationType.RESET_STATE](state: IRootState) {
      Object.assign(state, defaultState);
    },
    [MutationType.SET_CURRENT_VERSION](state: IRootState, version: string) {
      state.currentVersion = version;
    },
    [MutationType.SELECT_VIEW](state: IRootState, view: ToolkitView) {
      state.currentView = view;
    },
    [MutationType.TOGGLE_EXPANDED_OVERLAY](state: IRootState) {
      state.expanded = !state.expanded;
    },
    [MutationType.SET_EXPANDED_OVERLAY](state: IRootState, expanded: boolean) {
      state.expanded = expanded;
    },
    [MutationType.SET_CONTACT_DATA](state: IRootState, contactData: IContactData) {
      state.contactData = {
        ...contactData,
      };
    },
    [MutationType.UPDATE_ACCOUNT_SETTINGS](state: IRootState, accountSettings: IAccountSettings) {
      state.accountSettings = {
        ...accountSettings,
      };
    },
    [MutationType.UPDATE_TRACKED_INTERACTIONS](
      state: IRootState,
      trackedInteractions: ITrackedInteractions
    ) {
      state.trackedInteractions = {
        ...trackedInteractions,
      };
    },
    [MutationType.RESET_TRACKED_INTERACTIONS](state: IRootState) {
      state.trackedInteractions = defaultState.trackedInteractions;
    },
    [MutationType.SET_TRANSFER_SEARCH_FILTERS](
      state: IRootState,
      transferSearchFilters: ITransferSearchFilters
    ) {
      state.transferSearchFilters = {
        ...transferSearchFilters,
      };
    },
    [MutationType.SET_TAG_SEARCH_FILTERS](state: IRootState, tagSearchFilters: ITagSearchFilters) {
      state.tagSearchFilters = {
        ...tagSearchFilters,
      };
    },
    // [MutationType.ENQUEUE_TASK](state: IRootState, taskData: Task) {
    //   state.taskQueue.push(taskData);
    // },
    // [MutationType.DEQUEUE_TASK](state: IRootState, taskId: string) {
    //   for (let i = 0; i < state.taskQueue.length; i++) {
    //     let obj = state.taskQueue[i];

    //     if (obj.taskId === taskId) {
    //       state.taskQueue.splice(i, 1);
    //       break;
    //     }
    //   }
    // },
    [MutationType.PURGE_TASK_QUEUE](state: IRootState) {
      state.taskQueue = [];
    },
    // [MutationType.TOGGLE_PAUSE_TASK_QUEUE](state: IRootState) {
    //   state.taskQueuePaused = !state.taskQueuePaused
    // },
    [MutationType.TOGGLE_DEBUG_MODE](state: IRootState) {
      console.error("DEPRECATED! do not call this!");
      // state.debugMode = !state.debugMode;
    },
    [MutationType.SET_DEMO_MODE](state: IRootState, demoMode: boolean) {
      state.demoMode = demoMode;
    },
    [MutationType.SET_MOCK_DATA_MODE](state: IRootState, mockDataMode: boolean) {
      state.mockDataMode = mockDataMode;
    },
    [MutationType.SET_DEBUG_MODE](state: IRootState, debugMode: boolean) {
      state.debugMode = debugMode;

      // Synchronously propagate to attribute
      document.body.setAttribute(DEBUG_ATTRIBUTE, debugMode.toString());
    },
    [MutationType.SET_MUTE_ANALYTICS](state: IRootState, muteAnalytics: boolean) {
      state.muteAnalytics = muteAnalytics;
    },
    [MutationType.SET_TRANSFER_QUERY_STRING](state: IRootState, transferQueryString: string) {
      state.transferQueryString = transferQueryString;

      state.transferQueryStringHistory = maybePushOntoUniqueStack(
        transferQueryString,
        state.transferQueryStringHistory
      );
    },
    [MutationType.SET_TAG_QUERY_STRING](state: IRootState, tagQueryString: string) {
      state.tagQueryString = tagQueryString;

      state.tagQueryStringHistory = maybePushOntoUniqueStack(
        tagQueryString,
        state.tagQueryStringHistory
      );
    },
    [MutationType.SET_OMNI_QUERY_STRING](state: IRootState, omniQueryString: string) {
      state.omniQueryString = omniQueryString;

      state.omniQueryStringHistory = maybePushOntoUniqueStack(
        omniQueryString,
        state.omniQueryStringHistory
      );
    },
    [MutationType.SET_LOADING_MESSAGE](state: IRootState, loadingMessage: string | null) {
      state.loadingMessage = loadingMessage;
    },
    [MutationType.SET_ERROR_MESSAGE](state: IRootState, errorMessage: string | null) {
      state.errorMessage = errorMessage;
    },
    [MutationType.SET_REDIRECT](state: IRootState, value: boolean) {
      state.navigateOnNextLoad = value;
    },
    [MutationType.SET_FLASH_MESSAGE](state: IRootState, flashMessage: string | null) {
      // DEPRECATED in favor of toast
      state.flashMessageTimeout && clearTimeout(state.flashMessageTimeout);

      state.flashMessage = flashMessage;

      if (flashMessage) {
        state.flashMessageTimeout = setTimeout(() => {
          state.flashMessage = null;
        }, 3000) as any;
      }
    },
    [MutationType.SET_SEARCH_MODAL_VIEW](state: IRootState, searchModalView: SearchModalView) {
      state.searchModalView = searchModalView;
    },
    [MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS](
      state: IRootState,
      showTransferSearchResults: boolean
    ) {
      state.showTransferSearchResults = showTransferSearchResults;
    },
    [MutationType.SET_BUILDER_MODAL_DISPLAY_STATE](
      state: IRootState,
      builderModalOpen: CsvUpload | null
    ) {
      state.builderModalOpen = builderModalOpen;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_STATE](
      state: IRootState,
      finalizeSalesReceiptsState: BackgroundTaskState
    ) {
      state.backgroundTasks.finalizeSalesReceiptsState = finalizeSalesReceiptsState;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_LICENSE](
      state: IRootState,
      finalizeSalesReceiptsLicense: string
    ) {
      state.backgroundTasks.finalizeSalesReceiptsLicense = finalizeSalesReceiptsLicense;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_STOP_DATE](
      state: IRootState,
      finalizeSalesReceiptsStopIsodate: string | null
    ) {
      state.backgroundTasks.finalizeSalesReceiptsStopIsodate = finalizeSalesReceiptsStopIsodate;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_READOUT](
      state: IRootState,
      finalizeSalesReceiptsReadout: string | null
    ) {
      state.backgroundTasks.finalizeSalesReceiptsReadout = finalizeSalesReceiptsReadout;
    },
    [MutationType.SET_FINALIZE_SALES_RECEIPTS_RUNNING_TOTAL](
      state: IRootState,
      finalizeSalesReceiptsRunningTotal: number
    ) {
      state.backgroundTasks.finalizeSalesReceiptsRunningTotal = finalizeSalesReceiptsRunningTotal;
    },
    [MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL](
      state: IRootState,
      finalizeSalesReceiptsConsecutiveErrorTotal: number
    ) {
      state.backgroundTasks.finalizeSalesReceiptsConsecutiveErrorTotal =
        finalizeSalesReceiptsConsecutiveErrorTotal;
    },
    [MutationType.SET_VOID_TAGS_STATE](state: IRootState, voidTagsState: BackgroundTaskState) {
      state.backgroundTasks.voidTagsState = voidTagsState;
    },
    [MutationType.SET_VOID_TAGS_LICENSE](state: IRootState, voidTagsLicense: string) {
      state.backgroundTasks.voidTagsLicense = voidTagsLicense;
    },
    [MutationType.SET_VOID_TAGS_DATA](
      state: IRootState,
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
    [MutationType.SET_VOID_TAGS_READOUT](state: IRootState, voidTagsReadout: string | null) {
      state.backgroundTasks.voidTagsReadout = voidTagsReadout;
    },
    [MutationType.SET_VOID_TAGS_RUNNING_TOTAL](state: IRootState, voidTagsRunningTotal: number) {
      state.backgroundTasks.voidTagsRunningTotal = voidTagsRunningTotal;
    },
    [MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL](
      state: IRootState,
      voidTagsConsecutiveErrorTotal: number
    ) {
      state.backgroundTasks.voidTagsConsecutiveErrorTotal = voidTagsConsecutiveErrorTotal;
    },
    [MutationType.SET_ACCOUNT_ENABLED](state: IRootState, accountEnabled: boolean) {
      state.accountEnabled = accountEnabled;
    },
    [MutationType.UPDATE_METRC_STATUS_DATA](
      state: IRootState,
      metrcStatusData: IMetrcStatusData | null
    ) {
      state.metrcStatusData = metrcStatusData;
    },
    [MutationType.UPDATE_CREDENTIALS](state: IRootState, credentials: string | null) {
      state.credentials = credentials;
    },
  },
  getters: {
    // Used in transfer builder TODO fix
    authState: (state) => state.pluginAuth?.authState || null,
    // packagesUrl: (state) =>
    //   state.pluginAuth?.authState?.license
    //     ? `/industry/${state.pluginAuth?.authState?.license}/packages`
    //     : null,
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
    packageHistory: {
      namespaced: true,
      ...packageHistoryModule,
    },
    plantSearch: {
      namespaced: true,
      ...plantSearchModule,
    },
    transferSearch: {
      namespaced: true,
      ...transferSearchModule,
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
    reports: {
      namespaced: true,
      ...reportsModule
    },
    search: {
      namespaced: true,
      ...searchModule,
    },
    settings: {
      namespaced: true,
      ...settingsModule,
    },
    explorer: {
      namespaced: true,
      ...explorerModule,
    },
  },
  plugins: [vuexPersistence.plugin],
});
