<template>
  <div class="flex flex-col items-stretch gap-2">
    <smart-link
      v-for="(smartLink, idx) of smartLinks"
      v-bind:key="idx + smartLink.text"
      :text="smartLink.text"
      :targetType="smartLink.targetType"
    ></smart-link>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerTargetType } from "@/store/page-overlay/modules/explorer/consts";
import {
  extractOutgoingTransferManifestNumberOrNull,
  extractPackageLabelOrNull,
  extractPlantBatchNameOrNull,
} from "@/utils/history";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import SmartLink from "./SmartLink.vue";

export default Vue.extend({
  name: "SmartLinks",
  store,
  router,
  props: {
    description: String,
  },
  components: {
    SmartLink,
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
    smartLinks(): {
      text: string;
      targetType: ExplorerTargetType;
    }[] {
      const smartLinks: {
        text: string;
        targetType: ExplorerTargetType;
      }[] = [];

      const packageLabel = extractPackageLabelOrNull(this.description);
      if (packageLabel) {
        smartLinks.push({
          text: packageLabel,
          targetType: ExplorerTargetType.PACKAGE,
        });
      }

      const plantBatchName = extractPlantBatchNameOrNull(this.description);
      if (plantBatchName) {
        smartLinks.push({
          text: plantBatchName,
          targetType: ExplorerTargetType.PLANT_BATCH,
        });
      }

      const outgoingTransferManifestNumber = extractOutgoingTransferManifestNumberOrNull(
        this.description
      );
      if (outgoingTransferManifestNumber) {
        smartLinks.push({
          text: outgoingTransferManifestNumber,
          targetType: ExplorerTargetType.OUTGOING_TRANSFER,
        });
      }

      return smartLinks;
    },
  },
  data() {
    return {
      ExplorerTargetType,
    };
  },
  methods: {
    ...mapActions({}),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
