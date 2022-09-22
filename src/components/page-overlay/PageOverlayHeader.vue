<template>
  <div class="flex flex-column-shim flex-col space-y-4">
    <div class="flex flex-row justify-center items-center">
      <title-banner />
    </div>

    <!-- <facility-picker /> -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import TitleBanner from "@/components/shared/TitleBanner.vue";
import FacilityPicker from "@/components/shared/FacilityPicker.vue";
import store from "@/store/page-overlay/index";
import { MutationType } from "@/mutation-types";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import _ from "lodash";

export default Vue.extend({
  name: "PageOverlayHeader",
  store,
  components: {
    TitleBanner,
    // FacilityPicker,
  },
  data() {
    return {};
  },
  computed: {},
  watch: {},
  methods: {},
});
</script>
