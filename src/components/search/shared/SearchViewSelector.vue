<template>
  <!-- <div class="flex flex-row items-stretch space-x-4">
    <b-form-select
      style="border-radius: 0"
      v-model="searchType"
      :options="['PLANTS', 'PACKAGES', 'TRANSFERS', 'TAGS']"
    ></b-form-select>
  </div> -->

  <div class="flex p-2">
    <b-button-group>
      <b-button
        size="sm"
        v-for="searchTypeOption of searchTypeOptions"
        v-bind:key="searchTypeOption.value"
        :disabled="!searchTypeOption.enabled"
        :variant="searchType === searchTypeOption.value ? 'primary' : 'outline-primary'"
        @click.stop.prevent="setSearchType({ searchType: searchTypeOption.value })"
        >{{ searchTypeOption.text }}
        <template v-if="searchTypeOption.enabled">({{ searchTypeOption.count }})</template>
        <b-badge class="ml-2" v-if="searchTypeOption.plus" variant="primary">T3+</b-badge>
      </b-button>
    </b-button-group>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { SearchActions, SearchType } from "@/store/page-overlay/modules/search/consts";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "SearchViewSelector",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      searchType: (state: IPluginState) => state.search.searchType,
      packageSearchState: (state: IPluginState) => state.packageSearch,
      plantSearchState: (state: IPluginState) => state.plantSearch,
      tagSearchState: (state: IPluginState) => state.tagSearch,
      transferSearchState: (state: IPluginState) => state.transferSearch,
    }),
    searchTypeOptions(): {
      text: string;
      value: SearchType;
      count: number;
      enabled: boolean;
      plus: boolean;
    }[] {
      return [
        {
          text: "PACKAGES",
          value: SearchType.PACKAGES,
          count: store.state.packageSearch.packages.length,
          enabled: true,
          plus: false,
        },
        {
          text: "PLANTS",
          value: SearchType.PLANTS,
          count: store.state.plantSearch.plants.length,
          enabled: true,
          plus: false,
        },
        {
          text: "TRANSFERS",
          value: SearchType.TRANSFERS,
          count: store.state.transferSearch.transfers.length,
          enabled: true,
          plus: false,
        },
        {
          text: "TAGS",
          value: SearchType.TAGS,
          count: store.state.tagSearch.tags.length,
          enabled: true,
          plus: false,
        },
        {
          text: "TRANSFERRED PACKAGES",
          value: SearchType.TRANSFER_PACKAGES,
          // Not technically a package count, but it should be accurate enough
          count: store.state.transferPackageSearch.results.length,
          enabled: hasPlusImpl(),
          plus: true,
        },
        // {
        //   text: "TRANSFER TEMPLATES",
        //   value: SearchType.TRANSFER_TEMPLATES,
        //   count: 0,
        //   enabled: false,
        // },
        {
          text: "HARVESTS",
          value: SearchType.HARVESTS,
          count: 0,
          enabled: false,
          plus: false,
        },
        {
          text: "PLANT BATCHES",
          value: SearchType.PLANT_BATCHES,
          count: 0,
          enabled: false,
          plus: false,
        },
        {
          text: "SALES",
          value: SearchType.SALES,
          count: 0,
          enabled: false,
          plus: false,
        },
      ];
    },
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      setSearchType: `search/${SearchActions.SET_SEARCH_TYPE}`,
    }),
  },
  async created() {},
  async mounted() {
    // if (window.location.href.includes("transfer")) {
    //   this.setSearchType("TRANSFERS");
    // } else if (window.location.href.includes("tag")) {
    //   this.setSearchType("TAGS");
    // }
    //   this.setSearchType("TRANSFERS");
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
