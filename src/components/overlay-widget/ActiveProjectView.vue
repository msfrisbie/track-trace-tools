<template>
  <div class="w-full flex flex-col items-center" style="min-height: 720px">
    <div class="flex flex-col space-y-8" style="width: 600px">
      <template v-if="activeProject">
        <div class="flex flex-row text-lg justify-center items-center space-x-4">
          <template v-if="pendingOrInflightRowCount > 0">
            <b-spinner style="color: #49276a" />
            <span>Submitting...</span>
          </template>

          <template v-else>
            <template v-if="failedRowCount > 0">
              <div class="flex flex-col space-y-2 text-center">
                <span
                  >Failed to submit {{ activeProject.failedRows.length }} {{ pluralRowDescriptor }}.
                  Click "Retry" to reattempt.</span
                >

                <template v-if="isHarvestProject">
                  <span
                    >If this problem persists,
                    <span style="font-weight: 500">try changing the harvest name.</span></span
                  >
                </template>
              </div>
            </template>

            <template v-else>
              <animated-checkmark></animated-checkmark>
              <span>Submit complete</span>
            </template>
          </template>
        </div>

        <b-progress
          class="w-full"
          :max="totalRowCount"
          :variant="progressVariant"
          show-progress
          height="2rem"
        >
          <b-progress-bar
            :value="failedRowCount + successRowCount"
            :label="`${failedRowCount + successRowCount} / ${totalRowCount}`"
          ></b-progress-bar>
        </b-progress>

        <template v-if="failedRowCount > 0 && pendingOrInflightRowCount > 0">
          <div class="text-center">
            {{ failedRowCount }} {{ pluralRowDescriptor }} failed to submit.
          </div>
        </template>

        <div class="flex flex-row items-center justify-center space-x-4">
          <template v-if="pendingOrInflightRowCount > 0">
            <b-button size="md" variant="outline-danger" @click="destroy()">CANCEL</b-button>
          </template>

          <template v-else>
            <template v-if="failedRowCount > 0">
              <div class="flex flex-col items-center">
                <div class="flex flex-row items-center space-x-4">
                  <b-button size="md" variant="outline-info" @click="retry()">RETRY</b-button>

                  <b-button size="md" variant="outline-danger" @click="destroy()">CANCEL</b-button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col items-center space-y-12">
                <next-step-options :builderType="activeProject.builderType" />

                <b-button size="md" variant="outline-dark" @click="destroy()">DONE</b-button>
              </div>
            </template>
          </template>
        </div>
      </template>

      <template v-else>
        <span>No active project.</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import NextStepOptions from "@/components/overlay-widget/NextStepOptions.vue";
import AnimatedCheckmark from "@/components/overlay-widget/shared/AnimatedCheckmark.vue";
import { BuilderType, ToolkitView } from "@/consts";
import { builderManager, IBuilderProject } from "@/modules/builder-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { MutationType } from "@/mutation-types";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  failedRowCount,
  pendingOrInflightRowCount,
  successRowCount,
  totalRowCount,
} from "@/utils/builder";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ActiveProjectView",
  store,
  router,
  components: {
    NextStepOptions,
    AnimatedCheckmark,
  },
  methods: {
    destroy() {
      builderManager.destroyProject();

      this.$router.go(-1);
    },
    retry() {
      builderManager.retryFailedRows();
    },
    openAccountView() {
      this.$store.commit(MutationType.SET_EXPANDED_OVERLAY, true);
      pageManager.setExpandedClass();
      this.$store.commit(MutationType.SELECT_VIEW, ToolkitView.MANAGE_ACCOUNT);
    },
  },
  data() {
    return {
      activeProject: null,
    };
  },
  async mounted() {},
  async created() {
    this.$data.activeProject = builderManager.activeBuilderProject;

    builderManager.activeBuilderProjectUpdate.subscribe(() => {
      this.$data.activeProject = builderManager.activeBuilderProject;
    });
  },
  computed: {
    ...mapState(["trackedInteractions", "settings", "accountEnabled"]),
    pendingOrInflightRowCount() {
      return pendingOrInflightRowCount(this.$data.activeProject);
    },
    successRowCount() {
      return successRowCount(this.$data.activeProject);
    },
    failedRowCount() {
      return failedRowCount(this.$data.activeProject);
    },
    totalRowCount() {
      return totalRowCount(this.$data.activeProject);
    },
    progressVariant() {
      if (pendingOrInflightRowCount(this.$data.activeProject) > 0) {
        if (failedRowCount(this.$data.activeProject) > 0) {
          return "warning";
        } else {
          return "primary";
        }
      }

      // This means there are no pending rows
      if (failedRowCount(this.$data.activeProject) > 0) {
        return "danger";
      }

      return "success";
    },
    pluralRowDescriptor() {
      switch (this.$data.activeProject.builderType) {
        case BuilderType.UNPACK_IMMATURE_PLANTS:
        case BuilderType.CREATE_IMMATURE_PLANTS_FROM_MOTHER:
        case BuilderType.PROMOTE_IMMATURE_PLANTS:
        case BuilderType.UNPACK_IMMATURE_PLANTS:
          return "plant batches";
        case BuilderType.CREATE_ITEMS:
          return "items";
        case BuilderType.ADJUST_PACKAGE:
        case BuilderType.CREATE_HARVEST_PACKAGE:
        case BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT:
        case BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH:
        case BuilderType.FINISH_PACKAGES:
        case BuilderType.MERGE_PACKAGES:
        case BuilderType.REMEDIATE_PACKAGE:
        case BuilderType.SPLIT_PACKAGE:
        case BuilderType.PACK_IMMATURE_PLANTS:
        case BuilderType.MOVE_PACKAGES:
          return "packages";
        case BuilderType.CREATE_TRANSFER:
        case BuilderType.CREATE_TRANSFER_TEMPLATE:
          return "transfers";
        case BuilderType.DESTROY_PLANTS:
        case BuilderType.HARVEST_PLANTS:
        case BuilderType.MANICURE_PLANTS:
        case BuilderType.MOVE_PLANTS:
          return "plants";
        default:
          return "entries";
      }
    },
    isHarvestProject() {
      const project: IBuilderProject = this.$data.activeProject;

      return (
        project &&
        (project.builderType === BuilderType.HARVEST_PLANTS ||
          project.builderType === BuilderType.MANICURE_PLANTS)
      );
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
