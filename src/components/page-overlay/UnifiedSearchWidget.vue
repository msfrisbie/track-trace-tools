<template
  ><div
    v-bind:class="{
      'max-z': enableMetrcModalMode
    }"
  >
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
import TagSearchWidget from "@/components/tag-search-widget/TagSearchWidget.vue";
import TransferSearchWidget from "@/components/transfer-search-widget/TransferSearchWidget.vue";
import PackageSearchWidget from "@/components/package-search-widget/PackageSearchWidget.vue";
import PlantSearchWidget from "@/components/plant-search-widget/PlantSearchWidget.vue";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SearchType } from "@/store/page-overlay/modules/search/interfaces";
import { timer } from "rxjs";
import {
  PLANTS_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_TAB_REGEX,
  PACKAGE_TAB_REGEX
} from "@/modules/page-manager.module";

export default Vue.extend({
  name: "UnifiedSearchWidget",
  store,
  router,
  props: {},
  components: {
    TagSearchWidget,
    TransferSearchWidget,
    PackageSearchWidget,
    PlantSearchWidget
  },
  computed: {
    ...mapState({
      searchType: (state: any) => state.search.searchType,
      enableSearchOverMetrcModal: (state: any) => state.settings.enableSearchOverMetrcModal
    }),
    searchType: {
      get(): SearchType {
        return this.$store.state.search.searchType;
      },
      set(searchType: SearchType) {
        this.setSearchType({ searchType });
      }
    },
    enableMetrcModalMode() {
      return false;

      // if (!this.enableSearchOverMetrcModal) {
      //   return false;
      // }

      // return this.$data.metrcModalVislble;
    }
  },
  data() {
    return {
      metrcModalVislble: false
    };
  },
  methods: {
    ...mapActions({
      setSearchType: `search/${SearchActions.SET_SEARCH_TYPE}`
    })
  },
  async created() {},
  async mounted() {
    timer(0, 1000).subscribe(() => {
      this.$data.metrcModalVislble = !!document.querySelector(".k-widget.k-window");
    });

    console.log(window.location.pathname);

    if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
      this.setSearchType({ searchType: "PLANTS" });
    } else if (window.location.pathname.match(TAG_TAB_REGEX)) {
      this.setSearchType({ searchType: "TAGS" });
    } else if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
      this.setSearchType({ searchType: "TRANSFERS" });
    } else if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
      this.setSearchType({ searchType: "PACKAGES" });
    }
  }
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
</style>
