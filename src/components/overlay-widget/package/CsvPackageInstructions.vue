<template>
  <div class="flex flex-col text-center">
    <div class="flex flex-col text-left gap-12 max-w-lg text-lg">
      <div class="ttt-purple text-2xl font-light">
        Step 1: Download a CSV template and fill it out
      </div>
      <div>
        Start with an empty template each time. Fill out the template as you would with Metrc's New
        Package form, entering tags, item names, locations, quantities, etc.
      </div>
      <div class="ttt-purple text-2xl font-light">
        Step 3: Upload the completed CSV and review the checks
      </div>
      <div>
        Once uploaded, T3 will analyze your CSV, intelligently fill in any blank values, and let you
        know if anything looks off before submitting to Metrc.
      </div>
      <div class="ttt-purple text-2xl font-light">Step 3: Submit to Metrc</div>
      <div>If there are no errors, you can submit directly to Metrc.</div>
      <hr />
      <div class="ttt-purple text-2xl font-light">Tips:</div>
      <ul class="list-disc ml-4 text-lg">
        <li>
          <span class="font-bold">Most cells can be left blank.</span> T3 will intelligently fill
          out cells and display the results.
        </li>
        <li>
          <span class="font-bold">Use one row for each input package.</span> For example, if you are
          combining 5 packages into one, your CSV would use 5 rows.
        </li>
        <li>
          <span class="font-bold">T3 tracks which CSV cells are invalid.</span> Click the + next to
          the error message to see which cells are causing issues.
        </li>
      </ul>
      <hr />
      <div class="ttt-purple text-2xl font-light">Examples:</div>
      <div>FOO</div>
      <div>BAR</div>
      <div>BAZ</div>

      <b-button variant="outline-primary" @click="open('/package/create-package-csv')"
        >GO BACK</b-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "CsvPackageInstructions",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
  },
  data() {
    return {
      interval: 5000,
    };
  },
  methods: {
    open(path: string) {
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
    },
    next() {
      // @ts-ignore
      this.$refs.csvPackageCarousel.next();
    },
    onSlideStart(slide: any) {
      this.$data.sliding = true;
    },
    onSlideEnd(slide: any) {
      this.$data.sliding = false;
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
