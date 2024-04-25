<template>
  <div
    class="flex flex-row gap-4 p-4"
    v-bind:class="{
      'bg-white': searchState.activeSearchResult === searchResult,
    }"
    @mouseenter="selectSearchResult({ searchResult })"
  >
    <complex-icon
      :primaryIconName="searchResultIcons.primary"
      primaryIconSize="xl"
      :secondaryIconName="searchResultIcons.secondary"
      secondaryIconSize="sm"
    ></complex-icon>
    <div>
      {{ searchResult }}
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
    searchResultIcons(): { primary: string; secondary: string | null } {
      if (this.searchResult.incomingTransfer) {
        return { primary: "truck-loading", secondary: "arrow-left" };
      }

      if (this.searchResult.outgoingTransfer) {
        return { primary: "truck-loading", secondary: "arrow-right" };
      }

      if (this.searchResult.pkg) {
        return { primary: "box", secondary: null };
      }

      if (this.searchResult.tag) {
        return { primary: "tag", secondary: null };
      }

      if (this.searchResult.transferPkg) {
        return { primary: "box", secondary: "truck" };
      }

      if (this.searchResult.plant) {
        return { primary: "leaf", secondary: null };
      }

      if (this.searchResult.plantBatch) {
        return { primary: "seedling", secondary: null };
      }

      if (this.searchResult.harvest) {
        return { primary: "cannabis", secondary: "cut" };
      }

      if (this.searchResult.item) {
        return { primary: "box", secondary: "clipboard-list" };
      }

      if (this.searchResult.strain) {
        return { primary: "cannabis", secondary: "clipboard-list" };
      }

      if (this.searchResult.salesReceipt) {
        return { primary: "file-invoice-dollar", secondary: null };
      }

      return { primary: "question-circle", secondary: null };
    },
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
