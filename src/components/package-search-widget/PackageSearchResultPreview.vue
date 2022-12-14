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
          {{ pkg.Quantity }}{{ pkg.UnitOfMeasureAbbreviation }}
          {{ pkg.Item.Name }}
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
import Vue from "vue";
import { mapActions } from "vuex";

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
      setShowPackageSearchResults: `packageSearch/${PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS}`,
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
    }),
    selectPackage(pkg: IIndexedPackageData) {
      this.$emit("selected-package", pkg);
    },
    async setPackageLabelFilter(pkg: IIndexedPackageData) {
      analyticsManager.track(MessageType.SELECTED_PACKAGE);

      this.$store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageState: pkg.PackageState,
          packageSearchFilters: {
            label: pkg.Label,
          },
        }
      );

      (this as any).setShowPackageSearchResults({ showPackageSearchResults: false });
    },
  },
});
</script>
