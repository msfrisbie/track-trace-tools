<template>
  <div v-if="showFinishPackages || showMergePackages" class="flex flex-row items-center space-x-2">
    <span class="text-lg">NEXT STEPS:</span>

    <template v-if="showMergePackages">
      <b-button variant="outline-primary" size="md" @click="visit('/package/merge-packages')"
        >MERGE PACKAGES</b-button
      >
    </template>

    <template v-if="showFinishPackages">
      <b-button variant="outline-primary" size="md" @click="visit('/package/finish-packages')"
        >FINISH EMPTY PACKAGES</b-button
      >
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BuilderType } from "@/consts";
import router from "@/router/index";
import { builderManager } from "@/modules/builder-manager.module";

export default Vue.extend({
  name: "NextStepOptions",
  router,
  props: {
    builderType: String as () => BuilderType
  },
  methods: {
    visit(path: string) {
      builderManager.destroyProject();

      // Don't return to the project view on a back click
      this.$router.replace(path);
    }
  },
  computed: {
    showFinishPackages() {
      switch (this.$props.builderType) {
        case BuilderType.UNPACK_IMMATURE_PLANTS:
        case BuilderType.MERGE_PACKAGES:
          return true;
        default:
          return false;
      }
    },
    showMergePackages() {
      switch (this.$props.builderType) {
        case BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT:
          return true;
        default:
          return false;
      }
    }
  }
});
</script>
