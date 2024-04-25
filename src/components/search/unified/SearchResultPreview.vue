<template>
  <div
    class="flex flex-row gap-4 p-4"
    v-bind:class="{
      'bg-white': searchState.activeSearchResult === searchResult,
    }"
    @mouseenter="selectSearchResult({ searchResult })"
  >
    <complex-icon
      :primaryIconName="searchResult.primaryIconName"
      primaryIconNameIconSize="xl"
      :secondaryIconName="searchResult.secondaryIconName"
      secondaryIconNameIconSize="sm"
    ></complex-icon>
    <div>
      {{ searchResult.primaryTextualDescriptor }}
    </div>
  </div>
</template>

<script lang="ts">
import ComplexIcon from "@/components/overlay-widget/shared/ComplexIcon.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { ISearchResult } from "@/store/page-overlay/modules/search/interfaces";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "SearchResultPreview",
  store,
  router,
  props: {
    searchResult: Object as () => ISearchResult,
  },
  components: {
    ComplexIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      searchState: (state: IPluginState) => state.search,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      selectSearchResult: `search/${SearchActions.SELECT_SEARCH_RESULT}`,
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
