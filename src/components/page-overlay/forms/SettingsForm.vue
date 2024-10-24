<template>
  <div>
    <b-form class="grid grid-cols-2 gap-8">
      <div class="flex flex-col justify-start">
        <b-form-group>
          <div class="mb-2 text-gray-400 text-lg">Appearance &amp; Behavior</div>

          <b-form-checkbox id="checkbox-preventLogout" class="mb-2" v-model="settings.preventLogout"
            name="checkbox-preventLogout" @change="onChange()">
            Prevent Metrc from logging me out
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-autoDismissPopups" class="mb-2" v-model="settings.autoDismissPopups"
            name="checkbox-autoDismissPopups" @change="onChange()">
            Auto-dismiss Metrc banners
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-fixMetrcStyling" class="mb-2" v-model="settings.fixMetrcStyling"
            name="checkbox-fixMetrcStyling" @change="onChange()">
            Fix Metrc styling
          </b-form-checkbox>

          <!-- <b-form-checkbox id="checkbox-hideAiButton" class="mb-2" v-model="settings.hideAiButton"
            name="checkbox-hideAiButton" @change="onChange()">
            Hide Metrc AI button
          </b-form-checkbox> -->

          <b-form-checkbox id="checkbox-efficientSpacing" class="mb-2" v-model="settings.efficientSpacing"
            name="checkbox-efficientSpacing" @change="onChange()">
            Enable high-density Metrc UI
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-modalExpand" class="mb-2" v-model="settings.modalExpand"
            name="checkbox-modalExpand" @change="onChange()">
            Auto-expand Metrc windows to fill screen
          </b-form-checkbox>

          <!-- <b-form-checkbox
            id="checkbox-darkModeState"
            class="mb-2"
            v-model="settings.darkModeState"
            name="checkbox-darkModeState"
            @change="onChange()"
          >
            Dark mode
          </b-form-checkbox> -->

          <b-form-group label="Dark mode (beta)">
            <b-form-select :options="darkModeStateOptions" @change="onChange()"
              v-model="settings.darkModeState"></b-form-select>
          </b-form-group>

          <b-form-group label="Metrc Background">
            <b-form-select :options="backgroundOptions" @change="onChange()"
              v-model="settings.backgroundState"></b-form-select>
          </b-form-group>

          <template v-if="settings.backgroundState === 'COLOR'">
            <b-form-group label="Background color">
              <input type="color" v-model="settings.backgroundColor" @change="onChange()" />
            </b-form-group>
          </template>

          <template v-if="settings.backgroundState === 'GRADIENT'">
            <b-form-group label="Background gradient start color">
              <input type="color" v-model="settings.backgroundGradientStartColor" @change="onChange()" />
            </b-form-group>

            <b-form-group label="Background gradient end color">
              <input type="color" v-model="settings.backgroundGradientEndColor" @change="onChange()" />
            </b-form-group>
          </template>

          <template v-if="settings.backgroundState === 'IMAGE'">
            <b-form-group label="Custom background image">
              <b-form-file v-model="backgroundImage" accept="image/*"></b-form-file>
            </b-form-group>

            <template v-if="settings.backgroundImage">
              <div class="grid grid-cols-2 gap-2">
                <img :src="settings.backgroundImage" />
              </div>
            </template>
          </template>

          <b-form-group label="Snowflakes">
            <b-form-select :options="snowflakeStateOptions" @change="onChange()"
              v-model="settings.snowflakeState"></b-form-select>
          </b-form-group>

          <b-form-group label="Snowflake appearance" v-if="settings.snowflakeState === 'CSS'">
            <b-input-group>
              <b-form-select :options="snowflakeIconOptions" @change="onChange()"
                v-model="settings.snowflakeCharacter"></b-form-select>
              <b-form-select :options="snowflakeSizeOptions" @change="onChange()"
                v-model="settings.snowflakeSize"></b-form-select>
            </b-input-group>
          </b-form-group>
          <template v-if="settings.snowflakeState === 'CSS'">
            <b-form-group label="Custom snowflake text" v-if="settings.snowflakeCharacter === 'TEXT'">
              <b-form-textarea rows="3" v-model="settings.snowflakeText" @input="onChange()"></b-form-textarea>
            </b-form-group>

            <template v-if="settings.snowflakeCharacter === 'IMAGE'">
              <b-form-group label="Custom snowflake image">
                <b-form-file v-model="snowflakeImage" accept="image/*"></b-form-file>
              </b-form-group>

              <template v-if="settings.snowflakeImage">
                <div class="grid grid-cols-2 gap-2">
                  <img :src="settings.snowflakeImage" />
                  <b-form-group label="Crop">:
                    <b-form-select :options="snowflakeImageCropOptions" @change="onChange()"
                      v-model="settings.snowflakeImageCrop"></b-form-select>
                  </b-form-group>
                </div>
              </template>
            </template>
          </template>

          <!-- <b-form-checkbox
            id="checkbox-disableSnowAnimation"
            class="mb-2"
            v-model="settings.disableSnowAnimation"
            name="checkbox-disableSnowAnimation"
            @change="onChange()"
          >
            Disable snowflake animation
          </b-form-checkbox> -->

          <!-- <b-form-group label-cols="4" content-cols="8" label="After I log in:">
        <b-form-select
          v-model="settings.landingPage"
          :options="landingPageOptions"
          @change="onChange()"
        ></b-form-select>
      </b-form-group> -->
        </b-form-group>

        <b-form-group>
          <div class="mt-4 mb-2 text-gray-400 text-lg">Toolkit</div>

          <!-- <b-form-checkbox
        id="checkbox-hidePackageSearch"
        class="mb-2"
        v-model="settings.hidePackageSearch"
        name="checkbox-hidePackageSearch"
        @change="onChange()"
      >
        Hide package search
      </b-form-checkbox>

      <b-form-checkbox
        id="checkbox-hideTransferSearch"
        class="mb-2"
        v-model="settings.hideTransferSearch"
        name="checkbox-hideTransferSearch"
        @change="onChange()"
      >
        Hide transfer search
      </b-form-checkbox>

      <b-form-checkbox
        id="checkbox-hideQuickActionButtons"
        class="mb-2"
        v-model="settings.hideQuickActionButtons"
        name="checkbox-hideQuickActionButtons"
        @change="onChange()"
      >
        Hide quick action buttons
      </b-form-checkbox> -->

          <b-form-checkbox id="checkbox-enableTransferTools" class="mb-2" v-model="settings.enableTransferTools"
            name="checkbox-enableTransferTools" @change="onChange()">
            Add Transfer Tools to Metrc transfer window
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-disableAutoRefreshOnModalClose" class="mb-2"
            v-model="settings.disableAutoRefreshOnModalClose" name="checkbox-disableAutoRefreshOnModalClose"
            @change="onChange()">
            Disable auto-refresh Metrc interface after closing modal windows
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-preventActiveProjectPageLeave" class="mb-2"
            v-model="settings.preventActiveProjectPageLeave" name="checkbox-preventActiveProjectPageLeave"
            @change="onChange()">
            Stop me from leaving the page when T3 submit is in progress
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-loadDataInParallel" class="mb-2" v-model="settings.loadDataInParallel"
            name="checkbox-loadDataInParallel" @change="onChange()">
            Load Metrc data in parallel
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-useLegacyDateFormatForSubmit" class="mb-2"
            v-model="settings.useLegacyDateFormatForSubmit" name="checkbox-useLegacyDateFormatForSubmit"
            @change="onChange()">
            Use legacy format when submitting dates
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-writeSettingsToChromeStorage" class="mb-2"
            v-model="settings.writeSettingsToChromeStorage" name="checkbox-writeSettingsToChromeStorage"
            @change="onChange()">
            Persist T3 to Chrome storage
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-usePersistedCache" class="mb-2" v-model="settings.usePersistedCache"
            name="checkbox-usePersistedCache" @change="onChange()">
            Use persisted cache
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-disablePopups" class="mb-2" v-model="settings.disablePopups"
            name="checkbox-disablePopups" @change="onChange()">
            Disable overlay messages (not recommended)
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-hideInlineTransferButtons" class="mb-2"
            v-model="settings.hideInlineTransferButtons" name="checkbox-hideInlineTransferButtons" @change="onChange()">
            Hide inline table buttons
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-hideFacilityPicker" class="mb-2" v-model="settings.hideFacilityPicker"
            name="checkbox-hideFacilityPicker" @change="onChange()">
            Use default Metrc facility picker
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-enableSameItemPatch" class="mb-2" v-model="settings.enableSameItemPatch"
            name="checkbox-enableSameItemPatch" @change="onChange()">
            Enable same item patch
          </b-form-checkbox>

          <b-form-checkbox id="checkbox-enableLegacyTransferTools" class="mb-2"
            v-model="settings.enableLegacyTransferTools" name="checkbox-enableLegacyTransferTools" @change="onChange()">
            Enable legacy transfer tools
          </b-form-checkbox>

          <b-button variant="light" @click="toggleDebugMode()">TOGGLE DEBUG MODE</b-button>

          <!-- <b-form-checkbox
            id="checkbox-disableListingsButton"
            class="mb-2"
            v-model="settings.hideListingsButton"
            name="checkbox-hideListingsButton"
            @change="onChange()"
          >
            Hide the listings button
          </b-form-checkbox> -->
        </b-form-group>
      </div>

      <div class="grid grid-cols-2 items-center justify-start gap-2">
        <b-form-group class="col-span-2">
          <template v-if="!!settings.licenseKey">
            <template v-if="clientName">
              <div class="font-bold text-xl text-purple-800">Client: {{ clientName }}</div>
            </template>
            <!-- <template v-else>
              <div class="font-bold text-red-500">Error: no matching client data</div>
            </template> -->

            <b-input-group class="items-start">
              <b-form-input id="input-licenseKey" class="mb-2" v-model="settings.licenseKey" name="input-licenseKey"
                disabled="disabled">
              </b-form-input>

              <b-input-group-append>
                <b-button size="md" @click="clearLicenseKey()" variant="outline-danger">CLEAR</b-button>
              </b-input-group-append>
            </b-input-group>
          </template>

          <template v-else>
            <b-input-group class="items-start">
              <b-form-input id="input-licenseKey" placeholder="Paste your license key here" class="mb-2"
                v-model="unsavedLicenseKey" name="input-licenseKey" type="text"
                v-on:keydown.enter.prevent="saveLicenseKey()" autocomplete="off">
              </b-form-input>
              <b-input-group-append>
                <b-button :disabled="!unsavedLicenseKey" size="md" @click="saveLicenseKey()"
                  variant="outline-success">SAVE</b-button>
              </b-input-group-append>
            </b-input-group>
          </template>

          <a class="text-purple-600 underline" href="https://www.trackandtrace.tools/solutions" target="_blank">What is
            this?</a>
        </b-form-group>

        <b-form-group class="col-span-2">
          <template v-if="!!settings.email">
            <b-input-group class="items-start">
              <b-form-input id="input-email" class="mb-2" v-model="settings.email" name="input-email"
                disabled="disabled">
              </b-form-input>

              <b-input-group-append>
                <b-button size="md" @click="clearEmail()" variant="outline-danger">CLEAR</b-button>
              </b-input-group-append>
            </b-input-group>
          </template>

          <template v-else>
            <b-input-group class="items-start">
              <b-form-input id="input-email" placeholder="Enter your email here" class="mb-2" v-model="unsavedEmail"
                name="input-email" type="email" v-on:keydown.enter.prevent="saveEmail()" autocomplete="off"
                :state="emailValidState">
              </b-form-input>
              <b-input-group-append>
                <b-button :disabled="!unsavedEmail || emailValidState === false" size="md" @click="saveEmail()"
                  variant="outline-success">SAVE</b-button>
              </b-input-group-append>
            </b-input-group>
          </template>

          <small v-if="emailValidState === false">Invalid email</small>
        </b-form-group>

        <b-button-group vertical class="col-span-2 mb-4">
          <b-button variant="outline-primary" @click="resetSettings()">RESET SETTINGS</b-button>
          <b-button variant="outline-primary" @click="navToPermissions('/check-permissions')">CHECK MY
            PERMISSIONS</b-button>
        </b-button-group>

        <div class="col-span-2 text-gray-400 text-lg">Packages</div>

        <b-form-checkbox id="checkbox-autoOpenActivePackages" v-model="settings.autoOpenActivePackages"
          name="checkbox-autoOpenActivePackages" @change="onChange()">
          Auto-open Packages tab
        </b-form-checkbox>

        <b-form-select v-model="settings.autoOpenPackageTab" :options="packageTabOptions" @change="onChange()"
          v-if="settings.autoOpenActivePackages"></b-form-select>

        <span>Viewing # Packages:</span>

        <b-form-select v-model="settings.packageDefaultPageSize" :options="pageSizeOptions"
          @change="onChange()"></b-form-select>

        <div class="col-span-2 text-gray-400 text-lg py-4">Transfers</div>

        <b-form-checkbox id="checkbox-enableManifestDocumentViewer" class="col-span-2"
          v-model="settings.enableManifestDocumentViewer" name="checkbox-enableManifestDocumentViewer"
          @change="onChange()">
          Always use T3 PDF viewer for manifests
        </b-form-checkbox>

        <b-form-checkbox id="checkbox-autoOpenIncomingTransfers" v-model="settings.autoOpenIncomingTransfers"
          name="checkbox-autoOpenIncomingTransfers" @change="onChange()">
          Auto-open Transfers tab
        </b-form-checkbox>

        <b-form-select v-model="settings.autoOpenTransfersTab" :options="transfersTabOptions" @change="onChange()"
          v-if="settings.autoOpenIncomingTransfers"></b-form-select>

        <span>Viewing # Transfers:</span>

        <b-form-select v-model="settings.transferDefaultPageSize" :options="pageSizeOptions"
          @change="onChange()"></b-form-select>

        <div class="col-span-2 text-gray-400 text-lg py-4">Sales</div>

        <b-form-checkbox id="checkbox-autoOpenActiveSales" v-model="settings.autoOpenActiveSales"
          name="checkbox-autoOpenActiveSales" @change="onChange()">
          Auto-open Sales tab
        </b-form-checkbox>

        <b-form-select v-model="settings.autoOpenSalesTab" :options="salesTabOptions" @change="onChange()"
          v-if="settings.autoOpenActiveSales"></b-form-select>

        <span>Viewing # Sales:</span>

        <b-form-select v-model="settings.salesDefaultPageSize" :options="pageSizeOptions"
          @change="onChange()"></b-form-select>

        <div class="col-span-2 text-gray-400 text-lg py-4">Tags</div>

        <b-form-checkbox id="checkbox-autoOpenAvailableTags" v-model="settings.autoOpenAvailableTags"
          name="checkbox-autoOpenAvailableTags" @change="onChange()">
          Auto-open Tags tab
        </b-form-checkbox>

        <b-form-select v-model="settings.autoOpenTagsTab" :options="tagsTabOptions" @change="onChange()"
          v-if="settings.autoOpenAvailableTags"></b-form-select>

        <span>Viewing # Tags:</span>

        <b-form-select v-model="settings.tagDefaultPageSize" :options="pageSizeOptions"
          @change="onChange()"></b-form-select>

        <div class="col-span-2 text-gray-400 text-lg py-4">Plants</div>

        <b-form-checkbox id="checkbox-autoOpenFloweringPlants" v-model="settings.autoOpenFloweringPlants"
          name="checkbox-autoOpenFloweringPlants" @change="onChange()">
          Auto-open Plants tab
        </b-form-checkbox>

        <b-form-select v-model="settings.autoOpenPlantsTab" :options="plantsTabOptions" @change="onChange()"
          v-if="settings.autoOpenFloweringPlants"></b-form-select>

        <span>Viewing # Plants:</span>

        <b-form-select v-model="settings.plantDefaultPageSize" :options="pageSizeOptions"
          @change="onChange()"></b-form-select>
      </div>
    </b-form>
    <!-- <div class="exboost-slot"></div> -->
  </div>
</template>

<script lang="ts">
import {
  AnalyticsEvent,
  LandingPage,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel
} from "@/consts";
import { BackgroundState, DarkModeState, IPluginState, SnowflakeState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { SettingsActions } from "@/store/page-overlay/modules/settings/consts";
import { getMatchingDecryptedDataOrNull } from "@/utils/encryption";
import { generateThumbnail } from "@/utils/file";
import ExBoost from "exboost-js";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "SettingsForm",
  store,
  router,
  data() {
    return {
      snowflakeImage: null,
      backgroundImage: null,
      darkModeStateOptions: [
        { value: DarkModeState.DISABLED, text: "Disabled" },
        { value: DarkModeState.ENABLED, text: "Enabled" },
      ],
      snowflakeStateOptions: [
        { value: SnowflakeState.DISABLED, text: "Disable all" },
        { value: SnowflakeState.CSS, text: "Enable CPU-friendly snowflakes" },
        { value: SnowflakeState.ENABLED, text: "Enabled (Metrc default)" },
      ],
      snowflakeIconOptions: [
        "❆",
        "❅",
        "❄️",
        "😀",
        "💵",
        "🖕🏼",
        "☠️",
        "👽",
        "👾",
        "💩",
        "🥐",
        "🍆",
        "🍃",
        "💨",
        "🍁",
        "🌿",
        "TEXT",
        "IMAGE",
      ],
      snowflakeSizeOptions: [
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
        "3xl",
        "4xl",
        "5xl",
        "6xl",
        "7xl",
        "8xl",
        "9xl",
      ],
      backgroundOptions: [
        { value: BackgroundState.DEFAULT, text: "Metrc green mosaic (default)" },
        { value: BackgroundState.COLOR, text: "Custom color" },
        { value: BackgroundState.GRADIENT, text: "Custom color gradient" },
        { value: BackgroundState.IMAGE, text: "Custom image" },
      ],
      snowflakeImageCropOptions: ["none", "square", "rounded", "circle"],
      pageSizeOptions: [5, 10, 20, 50, 100, 500].map((x) => ({
        value: x,
        text: x,
      })),
      packageTabOptions: [
        PackageTabLabel.ACTIVE,
        PackageTabLabel.INACTIVE,
        PackageTabLabel.IN_TRANSIT,
      ],
      plantsTabOptions: [
        PlantsTabLabel.IMMATURE,
        PlantsTabLabel.VEGETATIVE,
        PlantsTabLabel.FLOWERING,
        PlantsTabLabel.HARVESTED,
      ],
      transfersTabOptions: [
        TransfersTabLabel.INCOMING,
        TransfersTabLabel.OUTGOING,
        TransfersTabLabel.REJECTED,
      ],
      tagsTabOptions: [TagsTabLabel.AVAILABLE, TagsTabLabel.USED, TagsTabLabel.VOIDED],
      salesTabOptions: [SalesTabLabel.ACTIVE, SalesTabLabel.INACTIVE],
      landingPageOptions: [
        {
          value: LandingPage.DEFAULT,
          text: "Do nothing",
        },
        {
          value: LandingPage.TRANSFERS,
          text: "Go to Licensed Transfers",
        },
        {
          value: LandingPage.TRANSFER_HUB,
          text: "Go to Transfers Hub",
        },
        {
          value: LandingPage.PACKAGES,
          text: "Go to Packages",
        },
        {
          value: LandingPage.PLANTS,
          text: "Go to Plants",
        },
      ],
      unsavedLicenseKey: "",
      unsavedEmail: "",
      settings: JSON.parse(JSON.stringify(store.state.settings)),
    };
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
      clientName: (state: IPluginState) => state.client.clientName,
      settingsState: (state: IPluginState) => state.settings,
    }),
    decryptedClientData() {
      return getMatchingDecryptedDataOrNull(store.state.settings?.licenseKey);
    },
    emailValidState(): boolean | null {
      if (this.$data.unsavedEmail.length === 0) {
        return null;
      }

      const test = /^\S+@\S+\.\S+$/.test(this.$data.unsavedEmail);

      return test;
    },
  },
  methods: {
    async toggleDebugMode() {
      window.location.hash = "";
      store.commit(MutationType.SET_DEBUG_MODE, !store.state.debugMode);
    },
    navToPermissions(route: string) {
      this.$router.push(route);
    },
    resetSettings() {
      /* eslint-disable-next-line no-alert */
      if (window.confirm("Are you sure you want to reset your settings?")) {
        // store.commit(MutationType.RESET_STATE);

        store.dispatch(`settings/${SettingsActions.RESET_SETTINGS}`);
      }
    },
    saveLicenseKey() {
      this.$data.settings.licenseKey = this.$data.unsavedLicenseKey;
      this.$data.unsavedLicenseKey = "";
      this.onChange();
      clientBuildManager.loadClientConfig();
    },
    saveEmail() {
      this.$data.settings.email = this.$data.unsavedEmail;
      this.$data.unsavedEmail = "";
      this.onChange();
    },
    clearLicenseKey() {
      /* eslint-disable-next-line no-alert */
      if (!window.confirm("Are you sure you want to remove your license key?")) {
        return;
      }
      this.$data.settings.licenseKey = "";
      this.onChange();
      clientBuildManager.loadClientConfig();
    },
    clearEmail() {
      /* eslint-disable-next-line no-alert */
      if (!window.confirm("Are you sure you want to remove your email?")) {
        return;
      }
      this.$data.settings.email = "";
      this.onChange();
    },
    onImageChange() { },
    onChange() {
      pageManager.pauseFor(3000);

      analyticsManager.track(AnalyticsEvent.UPDATED_SETTINGS, {
        settings: JSON.parse(JSON.stringify(this.settings)),
      });

      store.dispatch(`settings/${SettingsActions.UPDATE_SETTINGS}`, this.settings);

      toastManager.openToast(
        "T3 settings successfully updated. Refresh the page to apply changes.",
        {
          title: "Updated Settings",
          autoHideDelay: 3000,
          variant: "primary",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    },
  },
  watch: {
    snowflakeImage: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        generateThumbnail(newValue).then((b64image: string) => {
          this.$data.settings.snowflakeImage = b64image;

          this.onChange();
        });
      },
    },
    backgroundImage: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        generateThumbnail(newValue, 1080).then((b64image: string) => {
          this.$data.settings.backgroundImage = b64image;

          this.onChange();
        });
      },
    },
  },
  async mounted() {
    ExBoost.renderSlotDataOrError({
      exboostSlotId: "test",
      target: document.querySelector(".exboost-slot"),
      containerClass: "flex flex-col gap-2 text-center my-8",
      linkClass: "underline",
    });
  },
});
</script>
