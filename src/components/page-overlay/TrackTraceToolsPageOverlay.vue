<template>
  <div class="ttt-wrapper absolute">
    <div class="fixed bottom-2 right-2">
      <floating-button-container />
    </div>

    <snowflakes></snowflakes>
  </div>
</template>

<script lang="ts">
import FloatingButtonContainer from "@/components/page-overlay/FloatingButtonContainer.vue";
// import PageOverlayContainer from "@/components/page-overlay/PageOverlayContainer.vue";
import Snowflakes from "@/components/page-overlay/Snowflakes.vue";
import { MessageType, VUEX_KEY } from "@/consts";
import { IAuthState } from "@/interfaces";
import { accountManager } from "@/modules/account-manager.module";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { announcementsManager } from "@/modules/announcements-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { backgroundTaskManager } from "@/modules/background-task-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { contactDataManager } from "@/modules/contact-data-manager.module";
import { credentialManager } from "@/modules/credential-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { env, isDevelopment } from "@/modules/environment.module";
import { expiringCacheManager } from "@/modules/expiring-cache-manager.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { integrityManager } from "@/modules/integrity-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import { metrcModalManager } from "@/modules/metrc-modal-manager.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { mockDataManager } from "@/modules/mock-data-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { passivePageAnalyzer } from "@/modules/passive-page-analyzer.module";
import { sandboxManager } from "@/modules/sandbox-manager.module";
import { searchManager } from "@/modules/search-manager.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { telemetryManager } from "@/modules/telemetry-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { updateManager } from "@/modules/update-manager.module";
import store from "@/store/page-overlay/index";
import { library } from "@fortawesome/fontawesome-svg-core";
import * as fontawesomeBrands from "@fortawesome/free-brands-svg-icons";
import * as fontawesomeRegular from "@fortawesome/free-regular-svg-icons";
import * as fontawesomeSolid from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import { mapState } from "vuex";

// This allows firefox to render, but errors are uncollected.
setTimeout(() => {
  // Don't send error tracking on local
  const dsn = isDevelopment()
    ? null
    : "https://cbcb096c827249a099008253b508f74b@o241482.ingest.sentry.io/5559932";

  // https://github.com/getsentry/sentry-javascript/blob/master/MIGRATION.md#how-to-use-sentryintegrations
  Sentry.init({
    Vue,
    // @ts-ignore
    dsn,
    autoSessionTracking: true,
    integrations: [
      new Integrations.Vue({
        Vue,
        attachProps: true,
      }),
    ],
    beforeSend(event, hint) {
      for (const blacklistEntry of [
        "timed out",
        "Setting the value of 'vuex' exceeded the quota",
        "No metrc kendo present",
      ]) {
        if (hint && hint?.originalException?.toString().includes(blacklistEntry)) {
          if (Math.random() > 0.001) {
            return null;
          }
        }
      }

      return event;
    },
    tracesSampleRate: 0.1,
  });
}, 0);

Vue.use(VueRouter);
Vue.use(BootstrapVue);

Vue.component("VueSlider", VueSlider);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("font-awesome-icon", FontAwesomeIcon);

library.add(
  // @ts-ignore
  fontawesomeBrands.faFacebook,
  fontawesomeBrands.faGoogle,
  fontawesomeBrands.faLinkedin,
  fontawesomeBrands.faTwitter,
  fontawesomeBrands.faReddit,
  fontawesomeSolid.faEnvelope,
  fontawesomeSolid.faLink,
  fontawesomeRegular.faCircle,
  fontawesomeRegular.faCopy,
  fontawesomeSolid.faArchive,
  fontawesomeSolid.faPlusCircle,
  fontawesomeSolid.faArrowsAlt,
  fontawesomeSolid.faArrowLeft,
  fontawesomeSolid.faArrowRight,
  fontawesomeSolid.faBackspace,
  fontawesomeSolid.faBarcode,
  fontawesomeSolid.faBolt,
  fontawesomeSolid.faBox,
  fontawesomeSolid.faBoxOpen,
  fontawesomeSolid.faBoxes,
  fontawesomeSolid.faBug,
  fontawesomeSolid.faCalendar,
  fontawesomeSolid.faCamera,
  fontawesomeSolid.faCannabis,
  fontawesomeSolid.faCapsules,
  fontawesomeSolid.faCaretDown,
  fontawesomeSolid.faCaretRight,
  fontawesomeSolid.faCheck,
  fontawesomeSolid.faCheckSquare,
  fontawesomeSolid.faChevronDown,
  fontawesomeSolid.faChevronLeft,
  fontawesomeSolid.faChevronRight,
  fontawesomeSolid.faClipboardCheck,
  fontawesomeRegular.faClock,
  fontawesomeSolid.faClock,
  fontawesomeSolid.faCog,
  fontawesomeSolid.faCogs,
  fontawesomeSolid.faCompressArrowsAlt,
  fontawesomeSolid.faCookieBite,
  fontawesomeSolid.faCopy,
  fontawesomeSolid.faCut,
  fontawesomeSolid.faDirections,
  fontawesomeSolid.faDollarSign,
  fontawesomeSolid.faEdit,
  fontawesomeSolid.faEllipsisV,
  fontawesomeSolid.faExchangeAlt,
  fontawesomeSolid.faExchangeAlt,
  fontawesomeSolid.faExclamationTriangle,
  fontawesomeSolid.faExpandAlt,
  fontawesomeSolid.faExpandArrowsAlt,
  fontawesomeSolid.faExternalLinkAlt,
  fontawesomeSolid.faEye,
  fontawesomeSolid.faEyeDropper,
  fontawesomeSolid.faFile,
  fontawesomeSolid.faFileAlt,
  fontawesomeSolid.faFileCsv,
  fontawesomeSolid.faFileDownload,
  fontawesomeSolid.faFilePdf,
  fontawesomeSolid.faFilter,
  fontawesomeSolid.faFlask,
  fontawesomeSolid.faHistory,
  fontawesomeSolid.faHome,
  fontawesomeSolid.faInfo,
  fontawesomeSolid.faInfoCircle,
  fontawesomeSolid.faJoint,
  fontawesomeSolid.faLeaf,
  fontawesomeSolid.faLevelUpAlt,
  fontawesomeSolid.faLink,
  fontawesomeSolid.faMapMarkerAlt,
  fontawesomeSolid.faNotesMedical,
  fontawesomeSolid.faPhone,
  fontawesomeSolid.faPlus,
  fontawesomeSolid.faPlusCircle,
  fontawesomeSolid.faPoll,
  fontawesomeSolid.faProjectDiagram,
  fontawesomeSolid.faPrint,
  fontawesomeSolid.faPumpMedical,
  fontawesomeSolid.faQuestionCircle,
  fontawesomeSolid.faSave,
  fontawesomeSolid.faSearch,
  fontawesomeSolid.faSeedling,
  fontawesomeSolid.faShieldAlt,
  fontawesomeSolid.faSitemap,
  fontawesomeSolid.faSlidersH,
  fontawesomeSolid.faSync,
  fontawesomeSolid.faTable,
  fontawesomeSolid.faTachometerAlt,
  fontawesomeSolid.faTag,
  fontawesomeSolid.faTags,
  fontawesomeSolid.faTasks,
  fontawesomeSolid.faTimes,
  fontawesomeSolid.faTint,
  fontawesomeSolid.faToggleOn,
  fontawesomeSolid.faTools,
  fontawesomeSolid.faTrashAlt,
  fontawesomeSolid.faTrashAlt,
  fontawesomeSolid.faTruck,
  fontawesomeSolid.faTruckLoading,
  fontawesomeSolid.faUndo,
  fontawesomeSolid.faUser,
  fontawesomeSolid.faUsers,
  fontawesomeSolid.faVial,
  fontawesomeSolid.faWeight
);

/**
 * This is the top-level component rendered on the page
 */
export default Vue.extend({
  name: "TrackTraceToolsPageOverlay",
  store,
  components: {
    // PageOverlayContainer,
    FloatingButtonContainer,
    Snowflakes,
  },
  computed: {
    ...mapState(["expanded", "settings"]),
  },
  async created() {
    console.log(`Mode: ${env()}`);

    sandboxManager.init();
    await sandboxManager.runsBeforeModuleInit();

    // Initialize modules that are not dependent on auth state
    clientBuildManager.init();
    expiringCacheManager.init();
    primaryMetrcRequestManager.init();
    t3RequestManager.init();
    credentialManager.init();
    mockDataManager.init();
    toastManager.init();
    modalManager.init();
    updateManager.init();
    pageManager.init();
    authManager.init();
    integrityManager.init();
    passivePageAnalyzer.init();
    metrcModalManager.init();
    announcementsManager.init();

    const authState: IAuthState | null = await authManager.authStateOrNull();

    if (authState) {
      analyticsManager.setAuthState({ authState });

      // User is logged in
      analyticsManager.identify(authState.identity);

      // This changes for many users between pageloads as they change licenses
      analyticsManager.setUserProperties({ license: authState.license });

      await sandboxManager.runsAfterAuthInit();

      // Initialize modules that should run only when logged in
      // The order these appear must not be important
      primaryDataLoader.init();
      contactDataManager.init();
      builderManager.init();
      // apiKeyManager.init();
      backgroundTaskManager.init();
      accountManager.init();
      dynamicConstsManager.init();
      facilityManager.init();
      searchManager.init();

      const identities: string[] = [];

      if (authState.identity && !identities.includes(authState.identity)) {
        messageBus.sendMessageToBackground(MessageType.UPDATE_UNINSTALL_URL, {});
      }

      analyticsManager.setUserProperties({
        totalFacilities: (await facilityManager.ownedFacilitiesOrError()).length,
        facilities: (await facilityManager.ownedFacilitiesOrError())
          .map((x) => x.licenseNumber)
          .join(","),
        vuexBlobSize: (localStorage.getItem(VUEX_KEY) || "").length,
      });
    } else {
      // User is not logged in. Collect what we can.
      analyticsManager.setUserProperties({});
    }

    // Run this in both states, but only after auth is acquired
    telemetryManager.init();

    await sandboxManager.runsAfterModuleInit();
  },
  mounted() {
  },
});
</script>

<style type="text/scss" lang="scss">
@import "src/scss/styles";
</style>
