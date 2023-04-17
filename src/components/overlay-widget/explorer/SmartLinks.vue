<template>
  <div class="flex flex-col items-stretch gap-2">
    <b-button
      v-for="smartLink of smartLinks"
      v-bind:key="smartLink.text"
      size="sm"
      class="flex flex-row gap-2 items-center"
    >
      <font-awesome-icon :icon="smartLink.icon" size="sm"></font-awesome-icon>
      <span class="flex-grow text-center">{{ smartLink.text }}</span>
    </b-button>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerTargetType } from "@/store/page-overlay/modules/explorer/consts";
import {
  extractChildPackageLabelOrNull,
  extractMotherPlantBatchNameOrNull,
  extractPackagedPlantBatchNameOrNull,
  extractParentPackageLabelOrNull,
} from "@/utils/history";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "SmartLinks",
  store,
  router,
  props: {
    description: String,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
    smartLinks(): {
      icon: string;
      text: string;
    }[] {
      const smartLinks: {
        icon: string;
        text: string;
      }[] = [];

      const parentPackageTag = extractParentPackageLabelOrNull(this.description);
      if (parentPackageTag) {
        smartLinks.push({
          icon: "box",
          text: parentPackageTag,
        });
      }

      const childPackageTag = extractChildPackageLabelOrNull(this.description);
      if (childPackageTag) {
        smartLinks.push({
          icon: "box",
          text: childPackageTag,
        });
      }

      const motherPlantBatchName = extractMotherPlantBatchNameOrNull(this.description);
      if (motherPlantBatchName) {
        smartLinks.push({
          icon: "leaf",
          text: motherPlantBatchName,
        });
      }

      const packagedPlantBatchName = extractPackagedPlantBatchNameOrNull(this.description);
      if (packagedPlantBatchName) {
        smartLinks.push({
          icon: "leaf",
          text: packagedPlantBatchName,
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
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
