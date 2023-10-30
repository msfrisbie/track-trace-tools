<template>
  <div class="flex flex-row items-stretch space-x-4">
    <b-form-select
      style="border-radius: 0"
      v-model="searchType"
      :options="['PLANTS', 'PACKAGES', 'TRANSFERS', 'TAGS']"
    ></b-form-select>
  </div>
</template>

<script lang="ts">
import { IPluginState } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { SearchActions, SearchType } from '@/store/page-overlay/modules/search/consts';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  name: 'SearchPickerSeelect',
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      searchType: (state: IPluginState) => state.search.searchType,
    }),
    searchType: {
      get(): SearchType {
        return store.state.search.searchType;
      },
      set(searchType: SearchType) {
        this.setSearchType({ searchType });
      },
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
