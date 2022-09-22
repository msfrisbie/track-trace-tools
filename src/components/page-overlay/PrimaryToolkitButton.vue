<template>
  <b-button id="status-popover-target" @click="toggleOverlay($event)" variant="light">
    <track-trace-tools-logo :fill="metrcStatusFill" :inverted="true" />
  </b-button>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { authManager } from "@/modules/auth-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PrimaryToolkitButton",
  store,
  components: {
    TrackTraceToolsLogo,
  },
  data() {
    return {
      authState: null,
    };
  },
  async mounted() {
    this.$data.authState = await authManager.authStateOrNull();
  },
  computed: {
    ...mapState(["trackedInteractions", "settings", "metrcStatusData"]),
  },
  methods: {
    toggleOverlay(event: any) {
      this.$store.commit(MutationType.TOGGLE_EXPANDED_OVERLAY);
      pageManager.setExpandedClass();
    },
  },
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
