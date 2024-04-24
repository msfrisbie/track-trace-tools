<template>
  <div>
    <!-- {{ searchState.activeSearchResult }} -->
    <package-search-result-detail></package-search-result-detail>
    <plant-search-result-detail></plant-search-result-detail>
    <tag-search-result-detail></tag-search-result-detail>
    <transfer-search-result-detail></transfer-search-result-detail>
  </div>
</template>

<script lang="ts">
import PackageSearchResultDetail from "@/components/search/package-search/PackageSearchResultDetail.vue";
import PlantSearchResultDetail from "@/components/search/plant-search/PlantSearchResultDetail.vue";
import TagSearchResultDetail from "@/components/search/tag-search/TagSearchResultDetail.vue";
import TransferSearchResultDetail from "@/components/search/transfer-search/TransferSearchResultDetail.vue";
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
    PackageSearchResultDetail,
    PlantSearchResultDetail,
    TransferSearchResultDetail,
    TagSearchResultDetail,
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
