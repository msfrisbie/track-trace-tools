<template>
  <div class="ttt-wrapper">
    <transfer-tools></transfer-tools>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import _ from "lodash-es";
import TransferTools from "@/components/widgets/TransferTools.vue";

export default Vue.extend({
  name: "InlineToolbar",
  store,
  router,
  props: {},
  components: {
    TransferTools,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
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
  async created() {},
  async mounted() {},
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "src/scss/styles";
</style>
