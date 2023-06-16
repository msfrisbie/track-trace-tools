<template>
  <div
    class="flex flex-col items-stretch"
    v-bind:class="{ 'inline-search': !enableModalStyling, 'modal-search': enableModalStyling }"
  >
    <b-input-group size="md">
      <b-input-group-prepend @click="setShowSearchResults({ showSearchResults: true })"
        ><b-input-group-text class="search-icon">
          <font-awesome-icon icon="search" />
        </b-input-group-text>

        <search-picker-select />
      </b-input-group-prepend>

      <b-form-input
        v-model="queryString"
        type="text"
        placeholder="Tag #, item, location, harvest, strain..."
        autocomplete="off"
        @input="search($event)"
        @click="setShowSearchResults({ showSearchResults: true })"
        @focus="setShowSearchResults({ showSearchResults: true })"
        ref="search"
      ></b-form-input>

      <b-input-group-append v-if="queryString.length > 0">
        <b-button variant="light" @click="clearSearchField"
          ><font-awesome-icon icon="backspace"
        /></b-button>
      </b-input-group-append>
    </b-input-group>

    <template v-if="searchType === 'PACKAGES'">
      <package-search-widget />
    </template>
    <template v-if="searchType === 'TRANSFERS'">
      <transfer-search-widget />
    </template>
    <template v-if="searchType === 'TAGS'">
      <tag-search-widget />
    </template>
    <template v-if="searchType === 'PLANTS'">
      <plant-search-widget />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState, mapActions } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import TagSearchWidget from "@/components/search/tag-search/TagSearchWidget.vue";
import TransferSearchWidget from "@/components/search/transfer-search/TransferSearchWidget.vue";
import PackageSearchWidget from "@/components/search/package-search/PackageSearchWidget.vue";
import PlantSearchWidget from "@/components/search/plant-search/PlantSearchWidget.vue";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { IPluginState } from "@/interfaces";

export default Vue.extend({
  name: "UnifiedSearchWidget",
  store,
  router,
  props: {
    enableModalStyling: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  components: {
    TagSearchWidget,
    TransferSearchWidget,
    PackageSearchWidget,
    PlantSearchWidget,
  },
  computed: {
    ...mapState<IPluginState>({
      searchType: (state: IPluginState) => state.search.searchType,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      setSearchType: `search/${SearchActions.INITIALIZE_SEARCH_TYPE}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss">
.max-z {
  position: fixed !important;
  width: 100% !important;
  z-index: 1000000 !important;
  top: 0 !important;
  left: 0 !important;
  height: 0 !important;
}

.inline-search {
  max-width: calc(100% - 400px) !important;
}
</style>
