<template>
  <div
    class="flex flex-column-shim flex-col justify-between"
    style="width: 400px; height: 100%; overflow-y: auto"
  >
    <template v-if="!authState || !authState.identity">
      <p class="p-4">Log in to your Metrc account to use the plugin.</p>
    </template>

    <template v-else>
      <div>
        <div class="p-3">
          <page-overlay-header />
        </div>

        <hr />
      </div>

      <div class="p-4 flex-grow overflow-y-auto">
        <page-overlay-body />
      </div>
    </template>
    <div>
      <!-- <global-message-view /> -->
      <hr />
      <div class="p-4">
        <page-overlay-footer />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import PageOverlayBody from "@/components/page-overlay/PageOverlayBody.vue";
import PageOverlayFooter from "@/components/page-overlay/PageOverlayFooter.vue";
import PageOverlayHeader from "@/components/page-overlay/PageOverlayHeader.vue";
import { authManager } from "@/modules/auth-manager.module";
import Vue from "vue";

export default Vue.extend({
  name: "DefaultOverlayView",
  data() {
    return {
      authState: null,
    };
  },
  async mounted() {
    this.$data.authState = await authManager.authStateOrNull();
  },
  computed: {},
  components: {
    PageOverlayHeader,
    PageOverlayBody,
    PageOverlayFooter,
    // GlobalMessageView,
  },
});
</script>
