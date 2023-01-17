<template>
  <div>
    <b-form class="grid grid-cols-2 gap-8">
      <div class="flex flex-col justify-start">
        <b-form-group>
          <div class="mb-2 text-gray-400 text-lg">License Key</div>

          <template v-if="!!settings.licenseKey">
            <template v-if="decryptedClientData">
              <div class="font-bold text-xl text-purple-800">
                Client: {{ decryptedClientData.clientName }}
              </div>
            </template>
            <template v-else>
              <div class="font-bold text-red-500">Error: no matching client data</div>
            </template>

            <b-input-group class="items-start">
              <b-form-input
                id="input-licenseKey"
                class="mb-2"
                v-model="settings.licenseKey"
                name="input-licenseKey"
                disabled="disabled"
              >
              </b-form-input>

              <b-input-group-append>
                <b-button size="md" @click="clearLicenseKey()" variant="outline-danger"
                  >CLEAR</b-button
                >
              </b-input-group-append>
            </b-input-group>
          </template>

          <template v-else>
            <b-input-group class="items-start">
              <b-form-input
                id="input-licenseKey"
                placeholder="Paste your license key here"
                class="mb-2"
                v-model="unsavedLicenseKey"
                :state="validKey"
                name="input-licenseKey"
              >
              </b-form-input>
              <b-input-group-append>
                <b-button
                  :disabled="!unsavedLicenseKey"
                  size="md"
                  @click="saveLicenseKey()"
                  variant="outline-success"
                  >SAVE</b-button
                >
              </b-input-group-append>
            </b-input-group>
          </template>

          <a
            class="text-purple-600 underline"
            href="https://www.trackandtrace.tools/solutions"
            target="_blank"
            >What is this?</a
          >
        </b-form-group>

        <b-form-group>
          <div class="mb-2 text-gray-400 text-lg">Appearance &amp; Behavior</div>

          <b-form-checkbox
            id="checkbox-preventLogout"
            class="mb-2"
            v-model="settings.preventLogout"
            name="checkbox-preventLogout"
            @change="onChange()"
          >
            Prevent Metrc from logging me out
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
            <b-form-select
              :options="darkModeStateOptions"
              @change="onChange()"
              v-model="settings.darkModeState"
            ></b-form-select>
          </b-form-group>

          <b-form-group label="Snowflakes">
            <!-- style="flex-basis: 75%" -->
            <b-form-select
              :options="snowflakeStateOptions"
              @change="onChange()"
              v-model="settings.snowflakeState"
            ></b-form-select>
          </b-form-group>

          <b-form-group label="Snowflake appearance" v-if="settings.snowflakeState === 'CSS'">
            <b-input-group>
              <b-form-select
                :options="snowflakeIconOptions"
                @change="onChange()"
                v-model="settings.snowflakeCharacter"
              ></b-form-select>
              <b-form-select
                :options="snowflakeSizeOptions"
                @change="onChange()"
                v-model="settings.snowflakeSize"
              ></b-form-select>
            </b-input-group>
          </b-form-group>
          <template v-if="settings.snowflakeState === 'CSS'">
            <b-form-group
              label="Custom snowflake text"
              v-if="settings.snowflakeCharacter === 'TEXT'"
            >
              <b-form-textarea
                rows="3"
                v-model="settings.snowflakeText"
                @input="onChange()"
              ></b-form-textarea>
            </b-form-group>

            <template v-if="settings.snowflakeCharacter === 'IMAGE'">
              <b-form-group label="Custom snowflake image">
                <b-form-file v-model="image" accept="image/*"></b-form-file>
              </b-form-group>

              <template v-if="settings.snowflakeImage">
                <div class="grid grid-cols-2 gap-2">
                  <img :src="settings.snowflakeImage" />
                  <b-form-group label="Crop">
                    <b-form-select
                      :options="snowflakeImageCropOptions"
                      @change="onChange()"
                      v-model="settings.snowflakeImageCrop"
                    ></b-form-select>
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

          <b-form-checkbox
            id="checkbox-enableSearchOverMetrcModal"
            class="mb-2"
            v-model="settings.enableSearchOverMetrcModal"
            name="checkbox-enableSearchOverMetrcModal"
            @change="onChange()"
          >
            Show TTT search over Metrc modal windows
          </b-form-checkbox>

          <b-form-checkbox
            id="checkbox-preventActiveProjectPageLeave"
            class="mb-2"
            v-model="settings.preventActiveProjectPageLeave"
            name="checkbox-preventActiveProjectPageLeave"
            @change="onChange()"
          >
            Stop me from leaving the page when TTT submit is in progress
          </b-form-checkbox>

          <b-form-checkbox
            id="checkbox-disablePopups"
            class="mb-2"
            v-model="settings.disablePopups"
            name="checkbox-disablePopups"
            @change="onChange()"
          >
            Disable overlay messages (not recommended)
          </b-form-checkbox>

          <!-- <b-form-checkbox
          id="checkbox-hideScreenshotButton"
          class="mb-2"
          v-model="settings.hideScreenshotButton"
          name="checkbox-hideScreenshotButton"
          @change="onChange()"
        >
          Hide screenshot button
        </b-form-checkbox> -->

          <!-- <b-form-checkbox
            id="checkbox-useLegacyScreenshot"
            class="mb-2"
            v-model="settings.useLegacyScreenshot"
            name="checkbox-useLegacyScreenshot"
            @change="onChange()"
          >
            Use legacy screenshot (slower, not recommended)
          </b-form-checkbox> -->

          <b-form-checkbox
            id="checkbox-hideInlineTransferButtons"
            class="mb-2"
            v-model="settings.hideInlineTransferButtons"
            name="checkbox-hideInlineTransferButtons"
            @change="onChange()"
          >
            Hide inline table buttons
          </b-form-checkbox>

          <b-form-checkbox
            id="checkbox-hideFacilityPicker"
            class="mb-2"
            v-model="settings.hideFacilityPicker"
            name="checkbox-hideFacilityPicker"
            @change="onChange()"
          >
            Use default Metrc facility picker
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

      <div class="flex flex-col justify-start">
        <b-form-group>
          <div class="mb-2 text-gray-400 text-lg">Packages</div>

          <div class="mb-2 flex flex-row items-center gap-2">
            <b-form-checkbox
              id="checkbox-autoOpenActivePackages"
              v-model="settings.autoOpenActivePackages"
              name="checkbox-autoOpenActivePackages"
              @change="onChange()"
            >
            </b-form-checkbox>

            <span>Auto-open Packages tab</span>

            <b-form-select
              class="w-40"
              v-model="settings.autoOpenPackageTab"
              :options="packageTabOptions"
              @change="onChange()"
              v-if="settings.autoOpenActivePackages"
            ></b-form-select>
          </div>

          <b-form-group label-cols="6" content-cols="6" label="Viewing # Packages:">
            <b-form-select
              v-model="settings.packageDefaultPageSize"
              :options="pageSizeOptions"
              @change="onChange()"
            ></b-form-select>
          </b-form-group>
        </b-form-group>

        <b-form-group>
          <div class="mt-4 mb-2 text-gray-400 text-lg">Transfers</div>

          <b-form-checkbox
            id="checkbox-enableManifestDocumentViewer"
            class="mb-2"
            v-model="settings.enableManifestDocumentViewer"
            name="checkbox-enableManifestDocumentViewer"
            @change="onChange()"
          >
            Always use TTT PDF viewer for manifests
          </b-form-checkbox>

          <div class="mb-2 flex flex-row items-center gap-2">
            <b-form-checkbox
              id="checkbox-autoOpenIncomingTransfers"
              v-model="settings.autoOpenIncomingTransfers"
              name="checkbox-autoOpenIncomingTransfers"
              @change="onChange()"
            >
            </b-form-checkbox>

            <span>Auto-open Transfers tab</span>

            <b-form-select
              class="w-40"
              v-model="settings.autoOpenTransfersTab"
              :options="transfersTabOptions"
              @change="onChange()"
              v-if="settings.autoOpenIncomingTransfers"
            ></b-form-select>
          </div>

          <b-form-group label-cols="6" content-cols="6" label="Viewing # Transfers:">
            <b-form-select
              v-model="settings.transferDefaultPageSize"
              :options="pageSizeOptions"
              @change="onChange()"
            ></b-form-select>
          </b-form-group>
        </b-form-group>

        <b-form-group>
          <div class="mt-4 mb-2 text-gray-400 text-lg">Sales</div>

          <div class="mb-2 flex flex-row items-center gap-2">
            <b-form-checkbox
              id="checkbox-autoOpenActiveSales"
              v-model="settings.autoOpenActiveSales"
              name="checkbox-autoOpenActiveSales"
              @change="onChange()"
            >
            </b-form-checkbox>

            <span>Auto-open Sales tab</span>

            <b-form-select
              class="w-40"
              v-model="settings.autoOpenSalesTab"
              :options="salesTabOptions"
              @change="onChange()"
              v-if="settings.autoOpenActiveSales"
            ></b-form-select>
          </div>

          <b-form-group label-cols="6" content-cols="6" label="Viewing # Sales:">
            <b-form-select
              v-model="settings.salesDefaultPageSize"
              :options="pageSizeOptions"
              @change="onChange()"
            ></b-form-select>
          </b-form-group>
        </b-form-group>

        <b-form-group>
          <div class="mt-4 mb-2 text-gray-400 text-lg">Tags</div>

          <div class="mb-2 flex flex-row items-center gap-2">
            <b-form-checkbox
              id="checkbox-autoOpenAvailableTags"
              v-model="settings.autoOpenAvailableTags"
              name="checkbox-autoOpenAvailableTags"
              @change="onChange()"
            >
            </b-form-checkbox>

            <span>Auto-open Tags tab</span>

            <b-form-select
              class="w-40"
              v-model="settings.autoOpenTagsTab"
              :options="tagsTabOptions"
              @change="onChange()"
              v-if="settings.autoOpenAvailableTags"
            ></b-form-select>
          </div>

          <b-form-group label-cols="6" content-cols="6" label="Viewing # Tags:">
            <b-form-select
              v-model="settings.tagDefaultPageSize"
              :options="pageSizeOptions"
              @change="onChange()"
            ></b-form-select>
          </b-form-group>
        </b-form-group>

        <b-form-group>
          <div class="mt-4 mb-2 text-gray-400 text-lg">Plants</div>

          <div class="mb-2 flex flex-row items-center gap-2">
            <b-form-checkbox
              id="checkbox-autoOpenFloweringPlants"
              v-model="settings.autoOpenFloweringPlants"
              name="checkbox-autoOpenFloweringPlants"
              @change="onChange()"
            >
            </b-form-checkbox>

            <span>Auto-open Plants tab</span>

            <b-form-select
              class="w-40"
              v-model="settings.autoOpenPlantsTab"
              :options="plantsTabOptions"
              @change="onChange()"
              v-if="settings.autoOpenFloweringPlants"
            ></b-form-select>
          </div>

          <b-form-group label-cols="6" content-cols="6" label="Viewing # Plants:">
            <b-form-select
              v-model="settings.plantDefaultPageSize"
              :options="pageSizeOptions"
              @change="onChange()"
            ></b-form-select>
          </b-form-group>
        </b-form-group>
      </div>
    </b-form>
  </div>
</template>

<script lang="ts">
import {
  LandingPage,
  MessageType,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel,
} from "@/consts";
import { DarkModeState, SnowflakeState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { SettingsMutations } from "@/store/page-overlay/modules/settings/consts";
import { getMatchingDecryptedDataOrNull } from "@/utils/encryption";
import { generateThumbnail } from "@/utils/file";
import Vue from "vue";

export default Vue.extend({
  name: "SettingsForm",
  store,
  data() {
    return {
      image: null,
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
      settings: JSON.parse(JSON.stringify(this.$store.state.settings)),
    };
  },
  computed: {
    validKey() {
      if (!this.$data.unsavedLicenseKey) {
        return null;
      }

      return !!getMatchingDecryptedDataOrNull(this.$data.unsavedLicenseKey);
    },
    decryptedClientData() {
      return getMatchingDecryptedDataOrNull(this.$store.state.settings?.licenseKey);
    },
  },
  methods: {
    async toggleDebugMode() {
      window.location.hash = "";
      this.$store.commit(MutationType.SET_DEBUG_MODE, !this.$store.state.debugMode);
    },
    saveLicenseKey() {
      this.$data.settings.licenseKey = this.$data.unsavedLicenseKey;
      this.$data.unsavedLicenseKey = "";
      this.onChange();
      clientBuildManager.loadClientConfig();
    },
    clearLicenseKey() {
      if (!window.confirm("Are you sure you want to remove your license key?")) {
        return;
      }
      this.$data.settings.licenseKey = "";
      this.onChange();
      clientBuildManager.loadClientConfig();
    },
    onImageChange() {},
    onChange() {
      pageManager.pauseFor(3000);

      analyticsManager.track(MessageType.UPDATED_SETTINGS, {
        settings: JSON.parse(JSON.stringify(this.settings)),
      });

      this.$store.commit(`settings/${SettingsMutations.SET_SETTINGS}`, this.settings);

      toastManager.openToast(
        `TTT settings successfully updated. Refresh the page to apply changes.`,
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
    image: {
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
  },
});
</script>
