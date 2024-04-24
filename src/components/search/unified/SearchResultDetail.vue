<template>
  <div>
    <!-- {{ searchState.activeSearchResult }} -->
    <package-search-result-detail-v2></package-search-result-detail-v2>
    <plant-search-result-detail-v2></plant-search-result-detail-v2>
    <tag-search-result-detail-v2></tag-search-result-detail-v2>
    <transfer-search-result-detail-v2></transfer-search-result-detail-v2>
  </div>
</template>

<script lang="ts">
import PackageSearchResultDetailV2 from "@/components/search/unified/PackageSearchResultDetailV2.vue";
import PlantSearchResultDetailV2 from "@/components/search/unified/PlantSearchResultDetailV2.vue";
import TagSearchResultDetailV2 from "@/components/search/unified/TagSearchResultDetailV2.vue";
import TransferSearchResultDetailV2 from "@/components/search/unified/TransferSearchResultDetailV2.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions } from "@/store/page-overlay/modules/example/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "SearchResultDetail",
  store,
  router,
  props: {},
  components: {
    PackageSearchResultDetailV2,
    PlantSearchResultDetailV2,
    TransferSearchResultDetailV2,
    TagSearchResultDetailV2,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      searchState: (state: IPluginState) => state.search,
    }),
    ...mapGetters({
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
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

<style type="text/scss" lang="scss" scoped></style>
