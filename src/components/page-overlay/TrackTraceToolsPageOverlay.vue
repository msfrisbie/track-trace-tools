<template>
  <div class="ttt-wrapper absolute">
    <template v-if="expanded">
      <div class="fixed bottom-0 right-0">
        <page-overlay-container />
      </div>
    </template>
    <template v-else>
      <div class="fixed bottom-2 right-2">
        <floating-button-container />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import FloatingButtonContainer from "@/components/page-overlay/FloatingButtonContainer.vue";
import PageOverlayContainer from "@/components/page-overlay/PageOverlayContainer.vue";
import { MessageType } from "@/consts";
// import { queueWrapper } from "@/modules/queue-wrapper.module";
import { IAuthState } from "@/interfaces";
import { accountManager } from "@/modules/account-manager.module";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { apiKeyManager } from "@/modules/api-key-manager.module";
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
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { mockDataManager } from "@/modules/mock-data-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { passivePageAnalyzer } from "@/modules/passive-page-analyzer.module";
import { telemetryManager } from "@/modules/telemetry-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { updateManager } from "@/modules/update-manager.module";
import { upsertManager } from "@/modules/upsert-manager.module";
import store from "@/store/page-overlay/index";
import { library } from "@fortawesome/fontawesome-svg-core";
import * as fontawesomeRegular from "@fortawesome/free-regular-svg-icons";
import * as fontawesomeSolid from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import { mapState } from "vuex";

// TODO this allows firefox to render, but errors are uncollected.
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
      for (let blacklistEntry of [
        `timed out`,
        `Setting the value of 'vuex' exceeded the quota`,
        `No metrc kendo present`,
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
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("font-awesome-icon", FontAwesomeIcon);

library.add(fontawesomeRegular.faCircle);
library.add(fontawesomeRegular.faCopy);
library.add(fontawesomeSolid.faArchive);
library.add(fontawesomeSolid.faArrowLeft);
library.add(fontawesomeSolid.faArrowRight);
library.add(fontawesomeSolid.faBackspace);
library.add(fontawesomeSolid.faBarcode);
library.add(fontawesomeSolid.faBolt);
library.add(fontawesomeSolid.faBox);
library.add(fontawesomeSolid.faBoxOpen);
library.add(fontawesomeSolid.faBoxes);
library.add(fontawesomeSolid.faCalendar);
library.add(fontawesomeSolid.faCamera);
library.add(fontawesomeSolid.faCannabis);
library.add(fontawesomeSolid.faCapsules);
library.add(fontawesomeSolid.faCaretDown);
library.add(fontawesomeSolid.faCaretRight);
library.add(fontawesomeSolid.faCheck);
library.add(fontawesomeSolid.faCheckSquare);
library.add(fontawesomeSolid.faChevronDown);
library.add(fontawesomeSolid.faChevronLeft);
library.add(fontawesomeSolid.faChevronRight);
library.add(fontawesomeSolid.faClipboardCheck);
library.add(fontawesomeSolid.faClock);
library.add(fontawesomeSolid.faCog);
library.add(fontawesomeSolid.faCogs);
library.add(fontawesomeSolid.faCompressArrowsAlt);
library.add(fontawesomeSolid.faCookieBite);
library.add(fontawesomeSolid.faCopy);
library.add(fontawesomeSolid.faCut);
library.add(fontawesomeSolid.faDollarSign);
library.add(fontawesomeSolid.faEdit);
library.add(fontawesomeSolid.faSlidersH);
library.add(fontawesomeSolid.faEllipsisV);
library.add(fontawesomeSolid.faExchangeAlt);
library.add(fontawesomeSolid.faExchangeAlt);
library.add(fontawesomeSolid.faExclamationTriangle);
library.add(fontawesomeSolid.faExpandAlt);
library.add(fontawesomeSolid.faExternalLinkAlt);
library.add(fontawesomeSolid.faEye);
library.add(fontawesomeSolid.faEyeDropper);
library.add(fontawesomeSolid.faFile);
library.add(fontawesomeSolid.faFileAlt);
library.add(fontawesomeSolid.faFileCsv);
library.add(fontawesomeSolid.faFileDownload);
library.add(fontawesomeSolid.faFilter);
library.add(fontawesomeSolid.faFlask);
library.add(fontawesomeSolid.faHistory);
library.add(fontawesomeSolid.faHome);
library.add(fontawesomeSolid.faInfo);
library.add(fontawesomeSolid.faJoint);
library.add(fontawesomeSolid.faLeaf);
library.add(fontawesomeSolid.faLevelUpAlt);
library.add(fontawesomeSolid.faLink);
library.add(fontawesomeSolid.faMapMarkerAlt);
library.add(fontawesomeSolid.faNotesMedical);
library.add(fontawesomeSolid.faPlus);
library.add(fontawesomeSolid.faPlusCircle);
library.add(fontawesomeSolid.faPhone);
library.add(fontawesomeSolid.faPrint);
library.add(fontawesomeSolid.faPumpMedical);
library.add(fontawesomeSolid.faQuestionCircle);
library.add(fontawesomeSolid.faSave);
library.add(fontawesomeSolid.faSearch);
library.add(fontawesomeSolid.faSeedling);
library.add(fontawesomeSolid.faShieldAlt);
library.add(fontawesomeSolid.faSync);
library.add(fontawesomeSolid.faTachometerAlt);
library.add(fontawesomeSolid.faTag);
library.add(fontawesomeSolid.faTags);
library.add(fontawesomeSolid.faTasks);
library.add(fontawesomeSolid.faTimes);
library.add(fontawesomeSolid.faTint);
library.add(fontawesomeSolid.faTools);
library.add(fontawesomeSolid.faTrashAlt);
library.add(fontawesomeSolid.faTrashAlt);
library.add(fontawesomeSolid.faTruck);
library.add(fontawesomeSolid.faTruckLoading);
library.add(fontawesomeSolid.faUndo);
library.add(fontawesomeSolid.faUser);
library.add(fontawesomeSolid.faVial);
library.add(fontawesomeSolid.faWeight);

/**
 * This is the top-level component rendered on the page
 */
export default Vue.extend({
  name: "TrackTraceToolsPageOverlay",
  store,
  // router,
  computed: {
    ...mapState(["expanded", "settings"]),
  },
  async created() {
    console.log(`Mode: ${env()}`);

    // Initialize modules that are not dependent on auth state
    clientBuildManager.init();
    expiringCacheManager.init();
    primaryMetrcRequestManager.init();
    credentialManager.init();
    mockDataManager.init();
    toastManager.init();
    modalManager.init();
    updateManager.init();
    pageManager.init();
    authManager.init();
    integrityManager.init();
    upsertManager.init();
    passivePageAnalyzer.init();

    //   scriptContextManager.init();

    const authState: IAuthState | null = await authManager.authStateOrNull();

    if (authState) {
      analyticsManager.setAuthState({ authState });

      // User is logged in
      analyticsManager.identify(authState.identity);

      // TODO: this changes for most users, deprecate
      analyticsManager.setUserProperties({ license: authState.license });

      // Initialize modules that should run only when logged in
      // The order these appear must not be important
      primaryDataLoader.init();
      contactDataManager.init();
      builderManager.init();
      apiKeyManager.init();
      backgroundTaskManager.init();
      accountManager.init();
      dynamicConstsManager.init();
      facilityManager.init();

      const identities: string[] = [];

      if (authState.identity && !identities.includes(authState.identity)) {
        messageBus.sendMessageToBackground(MessageType.UPDATE_UNINSTALL_URL, {});
      }
    } else {
      // User is not logged in. Collect what we can.
      analyticsManager.setUserProperties({});
    }

    // Run this in both states, but only after auth is acquired
    telemetryManager.init();
  },
  mounted() {
    pageManager.setExpandedClass();
  },
  components: {
    PageOverlayContainer,
    FloatingButtonContainer,
  },
});
</script>

<style type="text/scss" lang="scss">
@import "src/scss/styles";
</style>
