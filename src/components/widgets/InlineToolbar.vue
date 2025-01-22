<template>
  <div class="ttt-wrapper">
    <transfer-tools v-if="!settingsState.disableTransferTools && showTransferTools"></transfer-tools>
    <csv-fill-tool v-if="!settingsState.disableCsvFormFill && showCsvFillTool"></csv-fill-tool>
  </div>
</template>

<script lang="ts">
import CsvFillTool from "@/components/widgets/CsvFillTool.vue";
import TransferTools from "@/components/widgets/TransferTools.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "InlineToolbar",
  store,
  router,
  props: {
    showTransferTools: {
      type: Boolean,
      required: false,
      default: false
    },
    showCsvFillTool: {
      type: Boolean,
      required: false,
      default: false
    },
  },
  components: {
    TransferTools,
    CsvFillTool
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      settingsState: (state: IPluginState) => state.settings
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
    }),
  },
  async created() { },
  async mounted() { },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) { },
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "src/scss/styles";
</style>
