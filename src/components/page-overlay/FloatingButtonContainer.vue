<template>
  <div class="flex flex-row gap-2" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <b-button-group style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)">
      <template v-if="pluginAuth.authState">
        <!-- <template v-if="isIdentityEligibleForListingsImpl && !settings.hideListingsButton">
          <listings-button />
        </template> -->

        <builder-button />
      </template>

      <!-- <primary-toolkit-button /> -->
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import PrimaryToolkitButton from "@/components/page-overlay/PrimaryToolkitButton.vue";
import BuilderButton from "@/components/page-overlay/BuilderButton.vue";
import ScrollButton from "@/components/page-overlay/ScrollButton.vue";
import DebugButton from "@/components/page-overlay/DebugButton.vue";
import ListingsButton from "@/components/page-overlay/ListingsButton.vue";
import { mapState } from "vuex";
import { authManager } from "@/modules/auth-manager.module";
import { getUrl } from "@/utils/assets";
import { MutationType } from "@/mutation-types";
import { isIdentityEligibleForListings } from "@/utils/access-control";

export default Vue.extend({
  name: "FloatingButtonContainer",
  store,
  components: {
    BuilderButton,
    // PrimaryToolkitButton,
    // ListingsButton,
    ScrollButton,
    DebugButton
  },
  async mounted() {},
  data() {
    return {};
  },
  computed: {
    ...mapState(["pluginAuth", "trackedInteractions", "settings", "debugMode"]),
    isIdentityEligibleForListingsImpl(): boolean {
      return isIdentityEligibleForListings({
        identity: this.pluginAuth?.authState?.identity,
        hostname: window.location.hostname
      });
    }
  },
  methods: {}
});
</script>

<style type="text/scss" lang="scss">
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}
</style>
