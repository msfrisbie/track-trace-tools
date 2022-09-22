<template>
  <div class="flex flex-col items-center">
    <div class="w-full flex flex-col space-y-4 items-center">
      <template v-if="!submitInflight">
        <div class="w-full grid grid-cols-2 gap-4">
          <div class="text-center text-xl">Package Tags</div>
          <div class="text-center text-xl">Plant Tags</div>
          <tag-picker
            :selectedTags.sync="selectedPackageTags"
            tagTypeName="CannabisPackage"
            :tagCount="0"
          />
          <tag-picker
            :selectedTags.sync="selectedPlantTags"
            tagTypeName="CannabisPlant"
            :tagCount="0"
          />
        </div>
      </template>

      <template v-if="!submitInflight">
        <b-button
          @click="startVoid()"
          variant="success"
          :disabled="selectedPackageTags.length + selectedPlantTags.length === 0"
          >VOID {{ selectedPackageTags.length + selectedPlantTags.length }} TAGS</b-button
        >
        <div class="py-8 flex flex-col gap-2">
          <div class="text-center font-bold">How can I select a range of tags?</div>
          <div>1. Hover over the start tag, click it, and then click "Check # After"</div>
          <div>2. Hover over the end tag and click "Uncheck # After"</div>
        </div>
      </template>

      <template v-else>
        <div>Successfully voided {{ runningSuccessTotal }} tags.</div>
        <div v-if="runningErrorTotal > 0">Failed to void {{ runningErrorTotal }} tags.</div>
        <b-button @click="stopVoid()" variant="danger" v-if="!successfulFinish">STOP VOID</b-button>
        <b-button @click="stopVoid()" variant="primary" v-if="successfulFinish">DONE</b-button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { mapState } from "vuex";
import { authManager } from "@/modules/auth-manager.module";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import { timer } from "rxjs";
import { ITagData } from "@/interfaces";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { getVoidTagBody } from "@/utils/tags";

export default Vue.extend({
  name: "VoidTagForm",
  store,
  components: {
    TagPicker
  },
  data() {
    return {
      submitInflight: false,
      successfulFinish: false,
      runningSuccessTotal: 0,
      runningErrorTotal: 0,
      selectedPlantTags: [],
      selectedPackageTags: []
    };
  },
  computed: {
    ...mapState([])
  },
  methods: {
    async reset() {
      await timer(0).toPromise();

      this.$data.submitInflight = false;
      this.$data.successfulFinish = false;
      this.$data.runningSuccessTotal = 0;
      this.$data.runningErrorTotal = 0;
      this.$data.selectedPlantTags = [];
      this.$data.selectedPackageTags = [];
    },
    async startVoid() {
      analyticsManager.track(MessageType.STARTED_VOID_TAGS_BACKGROUND_JOB);
      this.$data.submitInflight = true;

      for (let tagData of this.$data.selectedPlantTags) {
        if (!this.$data.submitInflight) {
          return;
        }
        await this.voidTag({ tagData });
      }

      for (let tagData of this.$data.selectedPackageTags) {
        if (!this.$data.submitInflight) {
          return;
        }
        await this.voidTag({ tagData });
      }

      this.$data.successfulFinish = true;
      analyticsManager.track(MessageType.VOID_TAGS_SUCCESS);
    },
    async stopVoid() {
      analyticsManager.track(MessageType.STOPPED_VOID_TAGS_BACKGROUND_JOB);
      await this.reset();
    },
    async voidTag({ tagData }: { tagData: ITagData }) {
      try {
        const response = await primaryMetrcRequestManager.voidTag(getVoidTagBody(tagData.Id));

        if (response.status !== 200) {
          this.$data.runningErrorTotal += 1;

          analyticsManager.track(MessageType.VOID_TAGS_ERROR, {
            error: `Returned response status ${response.status}`
          });
        } else {
          this.$data.runningSuccessTotal += 1;
        }
      } catch (e) {
        this.$data.runningErrorTotal += 1;
        console.error(e);
        analyticsManager.track(MessageType.VOID_TAGS_ERROR, { error: e });

        await timer(3000).toPromise();
      }
    }
  },
  async mounted() {
    await authManager.authStateOrError();
  }
});
</script>
