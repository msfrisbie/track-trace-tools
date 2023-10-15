<template>
  <div
    class="border-purple-300"
    v-bind:class="{
      'bg-white': selected,
    }"
    @mouseenter="selectPackage(pkg)"
    @click.stop.prevent="setPackageLabelFilter(pkg)"
  >
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div
        class="flex flex-column-shim flex-col space-y-2"
        v-bind:class="{ 'font-bold': selected }"
      >
        <div class="text-xl text-purple-700 demo-blur">
          {{ getNormalizedPackageContentsDescription(pkg) }}
        </div>
        <div class="text-gray-700 text-lg metrc-tag">{{ pkg.Label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IIndexedPackageData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import Vue from "vue";
import { mapActions } from "vuex";
import store from "@/store/page-overlay/index";
import { getNormalizedPackageContentsDescription } from "@/utils/package";

export default Vue.extend({
  name: "PackageSearchResultPreview",
  props: {
    sectionName: String,
    pkg: Object as () => IIndexedPackageData,
    selected: Boolean,
    idx: Number,
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
    }),
    selectPackage(pkg: IIndexedPackageData) {
      this.$emit("selected-package", pkg);
    },
    async setPackageLabelFilter(pkg: IIndexedPackageData) {
      analyticsManager.track(MessageType.SELECTED_PACKAGE);

      store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageState: pkg.PackageState,
          packageSearchFilters: {
            label: pkg.Label,
          },
        }
      );

      this.setShowSearchResults({ showSearchResults: false });
    },
    getNormalizedPackageContentsDescription
  },
});
</script>
