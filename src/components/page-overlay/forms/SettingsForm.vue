<template>
  <div>
    <b-form class="grid grid-cols-2 gap-8">
      <div class="flex flex-col justify-start">
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
            <b-input-group>
              <b-form-select
                style="flex-basis: 75%"
                :options="snowflakeStateOptions"
                @change="onChange()"
                v-model="settings.snowflakeState"
              ></b-form-select>

              <b-form-select
                v-if="settings.snowflakeState === 'CSS'"
                :options="snowflakeIconOptions"
                @change="onChange()"
                v-model="settings.snowflakeCharacter"
              ></b-form-select>
            </b-input-group>
          </b-form-group>

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

          <b-form-checkbox
            id="checkbox-autoOpenActivePackages"
            class="mb-2"
            v-model="settings.autoOpenActivePackages"
            name="checkbox-autoOpenActivePackages"
            @change="onChange()"
          >
            Auto-open Active Packages tab
          </b-form-checkbox>

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

          <b-form-checkbox
            id="checkbox-autoOpenIncomingTransfers"
            class="mb-2"
            v-model="settings.autoOpenIncomingTransfers"
            name="checkbox-autoOpenIncomingTransfers"
            @change="onChange()"
          >
            Auto-open Incoming Transfers tab
          </b-form-checkbox>

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

          <b-form-checkbox
            id="checkbox-autoOpenActiveSales"
            class="mb-2"
            v-model="settings.autoOpenActiveSales"
            name="checkbox-autoOpenActiveSales"
            @change="onChange()"
          >
            Auto-open Active Sales tab
          </b-form-checkbox>

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

          <b-form-checkbox
            id="checkbox-autoOpenAvailableTags"
            class="mb-2"
            v-model="settings.autoOpenAvailableTags"
            name="checkbox-autoOpenAvailableTags"
            @change="onChange()"
          >
            Auto-open Available Tags tab
          </b-form-checkbox>

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

          <b-form-checkbox
            id="checkbox-autoOpenFloweringPlants"
            class="mb-2"
            v-model="settings.autoOpenFloweringPlants"
            name="checkbox-autoOpenFloweringPlants"
            @change="onChange()"
          >
            Auto-open Flowering Plants tab
          </b-form-checkbox>

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
import { LandingPage, MessageType } from "@/consts";
import { DarkModeState, SnowflakeState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "SettingsForm",
  store,
  data() {
    return {
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
      ],
      pageSizeOptions: [5, 10, 20, 50, 100, 500].map((x) => ({
        value: x,
        text: x,
      })),
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
      settings: JSON.parse(JSON.stringify(this.$store.state.settings)),
    };
  },
  methods: {
    async toggleDebugMode() {
      window.location.hash = "";
      this.$store.commit(MutationType.SET_DEBUG_MODE, !this.$store.state.debugMode);
    },
    onChange() {
      pageManager.pauseFor(3000);

      analyticsManager.track(MessageType.UPDATED_SETTINGS, {
        settings: JSON.parse(JSON.stringify(this.settings)),
      });

      this.$store.commit(MutationType.UPDATE_SETTINGS, this.settings);

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
});
</script>
