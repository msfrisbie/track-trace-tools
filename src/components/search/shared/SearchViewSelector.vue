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
        v-for="searchTypeOption of ['PLANTS', 'PACKAGES', 'TRANSFERS', 'TAGS']"
        v-bind:key="searchTypeOption"
        :variant="searchType === searchTypeOption ? 'primary' : 'outline-primary'"
        @click.stop.prevent="setSearchType({ searchType: searchTypeOption })"
        >{{ searchTypeOption }}</b-button
      >
    </b-button-group>
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
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SearchType } from "@/store/page-overlay/modules/search/interfaces";
import { IPluginState } from "@/interfaces";

export default Vue.extend({
  name: "SearchViewSelector",
  store,
  router,
  props: {},
  components: {},
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
