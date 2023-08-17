<template>
  <div class="w-full facility-picker" @click="focus()">
    <!-- showAll is causing problems when using the arrow keys to select -->
    <vue-typeahead-bootstrap
      v-model="query"
      :data="facilities"
      :showOnFocus="true"
      :serializer="(facility) => facility.name"
      :placeholder="activeFacilityName"
      inputClass="special-input-class"
      highlightClass="special-highlight-class"
      ref="typeahead"
      size="md"
      @hit="facilityHit($event)"
      :maxMatches="100"
    >
      <template slot="suggestion" slot-scope="{ htmlText, data }">
        <div class="flex flex-row items-center justify-between">
          <div v-html="htmlText" />

          <div class="flex flex-row items-center space-x-4">
            <a
              title="COPY LICENSE"
              class="cursor-pointer opacity-60 hover:opacity-100"
              @click.stop.prevent="copyToClipboard(data)"
            >
              <font-awesome-icon :icon="['far', 'copy']" />
            </a>
            <a
              title="OPEN FACILITY IN NEW TAB"
              class="cursor-pointer opacity-60 hover:opacity-100"
              @click.stop.prevent="openFacilityInNewTab(data)"
            >
              <font-awesome-icon icon="external-link-alt" />
            </a>
            <template v-if="facilities.length > 1">
              <template v-if="data.name.endsWith(settings.homeLicenses[identity])">
                <a
                  title="REMOVE HOME LICENSE"
                  class="cursor-pointer opacity-80 hover:opacity-100"
                  @click.stop.prevent="unsetHomeLicense()"
                >
                  <font-awesome-icon icon="home" style="color: #49276a" />
                </a>
              </template>
              <template v-else>
                <a
                  title="SET AS HOME LICENSE"
                  class="opacity-20 hover:opacity-100"
                  @click.stop.prevent="setHomeLicense(data)"
                >
                  <font-awesome-icon icon="home" />
                </a>
              </template>
            </template>
          </div>
        </div>
      </template>

      <template slot="append" v-if="query">
        <b-button
          style="border: 1px solid #777777; background-color: #111111"
          variant="dark"
          @click.stop.prevent="clear()"
        >
          <font-awesome-icon icon="backspace" />
        </b-button>
      </template>

      <!-- <template slot="append" v-if="!query">
        <b-button
          style="border: 1px solid #777777; background-color: #111111"
          variant="dark"
          title="COPY"
          @click.stop.prevent="copyToClipboard({ name: activeFacilityName })"
        >
          <font-awesome-icon
            :icon="['far', 'copy']"
            class="opacity-60 hover:opacity-100"
          />
        </b-button>
      </template> -->
    </vue-typeahead-bootstrap>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPageMetrcFacilityData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { SettingsMutations } from "@/store/page-overlay/modules/settings/consts";
import { copyToClipboard } from "@/utils/dom";
import { getLicenseFromNameOrError } from "@/utils/facility";
import { timer } from "rxjs";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "FacilityPicker",
  store,
  components: {},
  data() {
    return {
      activeFacilityName: null,
      query: "",
      facilities: [],
      identity: null,
    };
  },
  computed: {
    ...mapState(["settings"]),
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.identity = authState.identity;

    this.$data.activeFacilityName = (await facilityManager.activeFacilityOrError()).name;

    this.updateFacilityList();
  },
  methods: {
    clear() {
      this.$data.query = "";

      this.focus();
    },
    focus() {
      if (this.$data.query.length === 0) {
        this.blur();
      }

      timer(0).subscribe(() =>
        // @ts-ignore
        this.$refs.typeahead.$el.querySelector("input").focus()
      );
    },
    blur() {
      // @ts-ignore
      this.$refs.typeahead.$el.querySelector("input").blur();
    },
    async updateFacilityList() {
      const authState = await authManager.authStateOrError();

      const facilities = (await facilityManager.ownedFacilitiesOrError())
        // Initialize to alphabetical order
        .sort((a: IPageMetrcFacilityData, b: IPageMetrcFacilityData) =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0
        );

      const homeLicense: string | null = store.state.settings.homeLicenses[authState.identity];

      this.$data.facilities = facilities;

      if (homeLicense) {
        this.$data.facilities = [
          ...facilities.filter((x) => x.name.endsWith(homeLicense)),
          ...facilities.filter((x) => !x.name.endsWith(homeLicense)),
        ];
      }
    },
    facilityHit(newFacility: IPageMetrcFacilityData) {
      analyticsManager.track(MessageType.CHANGED_FACILITY, {
        newFacility,
      });

      window.location.href = newFacility.link;
    },
    openFacilityInNewTab(facility: IPageMetrcFacilityData) {
      // @ts-ignore
      window.open(facility?.link, "_blank"); //.blur();
      // window.focus();

      analyticsManager.track(MessageType.FACILITY_PICKER_ENGAGEMENT, {
        action: "openInNewTab",
        value: facility.name,
      });
    },
    copyToClipboard({ name }: { name: string }) {
      // If for some reason the split fails, just fall back to the entire string
      let license;
      try {
        license = getLicenseFromNameOrError(name);
      } catch (e) {
        license = name;
      }

      copyToClipboard(license);

      analyticsManager.track(MessageType.COPIED_TEXT, {
        value: license,
      });

      toastManager.openToast(`'${license}' copied to clipboard`, {
        title: "Copied License",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      analyticsManager.track(MessageType.FACILITY_PICKER_ENGAGEMENT, {
        action: "copyToClipboard",
        value: license,
      });
    },
    async setHomeLicense({ name }: { name: string }) {
      const license = getLicenseFromNameOrError(name);

      store.commit(`settings/${SettingsMutations.SET_HOME_LICENSE}`, [
        this.$data.identity,
        license,
      ]);

      this.updateFacilityList();

      toastManager.openToast(`Set your pinned facility to ${license}.`, {
        title: "Pinned Facility",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      analyticsManager.track(MessageType.FACILITY_PICKER_ENGAGEMENT, {
        action: "setHomeLicense",
        value: license,
      });
    },
    async unsetHomeLicense() {
      store.commit(`settings/${SettingsMutations.SET_HOME_LICENSE}`, [this.$data.identity, null]);

      this.updateFacilityList();

      toastManager.openToast(`Pinned facility was removed.`, {
        title: "Unpinned Facility",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      analyticsManager.track(MessageType.FACILITY_PICKER_ENGAGEMENT, {
        action: "setHomeLicense",
        value: null,
      });
    },
  },
});
</script>

<style type="text/scss" lang="scss">
.facility-picker {
  .special-input-class {
    background-color: #111111 !important;
    color: #cccccc !important;
    border: 1px solid #777777 !important;
    cursor: pointer;
    font-weight: bold !important;
  }

  .special-highlight-class {
    color: #49276a;
    font-weight: bold;
  }

  .vbst-item {
    color: #cccccc !important;
    font-size: 1.2rem !important;
    background-color: #111111 !important;
  }
}
</style>
