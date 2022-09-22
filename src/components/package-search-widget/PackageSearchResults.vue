<template>
  <div
    class="hide-scrollbar grid grid-cols-6 grid-rows-2"
    style="height: 100%; grid-template-rows: auto 1fr"
  >
    <template v-if="packageQueryString.length > 0">
      <div
        class="
          col-span-6
          flex flex-row
          items-center
          space-x-2
          p-4
          border-blue-300 border-b
        "
      >
        <!-- <template v-if="filtersApplied">
          <b-button-group v-if="packageSearchFilters.sourceHarvestName">
            <b-button variant="outline-dark" disabled
              >Harvest matches "{{ packageSearchFilters.sourceHarvestName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="
                partialUpdatePackageSearchFilters({
                  packageSearchFilters: { sourceHarvestName: '' }
                })
              "
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="packageSearchFilters.sourcePackageLabel">
            <b-button variant="outline-dark" disabled
              >Source package tag matches "{{ packageSearchFilters.sourcePackageLabel }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="
                partialUpdatePackageSearchFilters({
                  packageSearchFilters: { sourcePackageLabel: '' }
                })
              "
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="packageSearchFilters.itemName">
            <b-button variant="outline-dark" disabled
              >Item matches "{{ packageSearchFilters.itemName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { itemName: '' } })"
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="packageSearchFilters.locationName">
            <b-button variant="outline-dark" disabled
              >Location matches "{{ packageSearchFilters.locationName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="
                partialUpdatePackageSearchFilters({ packageSearchFilters: { locationName: '' } })
              "
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="packageSearchFilters.itemStrainName">
            <b-button variant="outline-dark" disabled
              >Strain matches "{{ packageSearchFilters.itemStrainName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="
                partialUpdatePackageSearchFilters({ packageSearchFilters: { itemStrainName: '' } })
              "
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="packageSearchFilters.itemProductCategoryName">
            <b-button variant="outline-dark" disabled
              >Category matches "{{ packageSearchFilters.itemProductCategoryName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="
                partialUpdatePackageSearchFilters({
                  packageSearchFilters: { itemProductCategoryName: '' }
                })
              "
              >&#10006;</b-button
            >
          </b-button-group>
        </template> -->

        <!-- <template v-if="!filtersApplied"> -->
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ packageQueryString }}</span>
          matches {{ filteredPackages.length
          }}{{ filteredPackages.length === 500 ? "+" : "" }} packages
        </p>
        <!-- </template> -->

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="packageQueryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-blue-50 col-span-3">
        <package-result-groups :packages="filteredPackages" />

        <div class="flex-grow bg-blue-50"></div>
      </div>

      <div class="flex flex-col overflow-y-auto col-span-3">
        <package-search-result-detail />
      </div>
    </template>

    <template v-else>
      <div class="col-span-6">
        <!-- Top row is sized "auto", so this placeholer is needed -->
      </div>

      <div class="flex flex-col overflow-y-auto col-span-6">
        <package-history-list />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { MutationType } from "@/mutation-types";
import { IIndexedPackageData, IPackageData, IPluginState } from "@/interfaces";
import { MessageType, PackageFilterIdentifiers, PackageState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import PackageSearchResultDetail from "@/components/package-search-widget/PackageSearchResultDetail.vue";
import PackageResultGroups from "@/components/package-search-widget/PackageResultGroups.vue";
// import PackageManifestCartBuilder from "@/components/package-search-widget/PackageManifestCartBuilder.vue";
import PackageHistoryList from "@/components/package-search-widget/PackageHistoryList.vue";
import { searchManager } from "@/modules/search-manager.module";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { mapActions, mapGetters, mapState } from "vuex";
import { TransferBuilderGetters } from "@/store/page-overlay/modules/transfer-builder/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";

export default Vue.extend({
  name: "PackageSearchResults",
  store,
  components: {
    PackageSearchResultDetail,
    PackageResultGroups,
    // PackageManifestCartBuilder,
    PackageHistoryList
  },
  data() {
    return {};
  },
  props: {
    packages: Array as () => IIndexedPackageData[],
    inflight: Boolean
  },
  watch: {
    packages: {
      immediate: true,
      handler(newValue, oldValue) {
        // if (
        //   !this.$data.detailPackageData ||
        //   !newValue.find((x: any) => x.Id === this.$data.detailPackageData?.Id)
        // ) {
        //   searchManager.selectedPackage.next(newValue[0]);
        // }
      }
    }
  },
  methods: {
    ...mapActions({
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`
    })
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      packageQueryString: (state: any) => state.packageSearch?.packageQueryString,
      packageSearchFilters: (state: any) => state.packageSearch?.packageSearchFilters
    }),
    ...mapGetters({
      transferPackageList: `transferBuilder/${TransferBuilderGetters.ACTIVE_PACKAGE_LIST}`
    }),
    filteredPackages() {
      return this.packages.filter((x: IPackageData) => {
        // if (!!this.packageSearchFilters.sourceHarvestName) {
        //   if (!x.SourceHarvestNames.includes(this.packageSearchFilters.sourceHarvestName)) {
        //     return false;
        //   }
        // }
        // if (!!this.packageSearchFilters.sourcePackageLabel) {
        //   if (!x.SourcePackageLabels.includes(this.packageSearchFilters.sourcePackageLabel)) {
        //     return false;
        //   }
        // }
        // if (!!this.packageSearchFilters.itemName) {
        //   if (!x.Item.Name.includes(this.packageSearchFilters.itemName)) {
        //     return false;
        //   }
        // }
        // if (!!this.packageSearchFilters.itemStrainName) {
        //   if (
        //     !!x.Item.StrainName &&
        //     !x.Item.StrainName.includes(this.packageSearchFilters.itemStrainName)
        //   ) {
        //     return false;
        //   }
        // }
        // if (!!this.packageSearchFilters.itemProductCategoryName) {
        //   if (
        //     !x.Item.ProductCategoryName.includes(this.packageSearchFilters.itemProductCategoryName)
        //   ) {
        //     return false;
        //   }
        // }
        // if (!!this.packageSearchFilters.locationName) {
        //   if (
        //     !!x.LocationName &&
        //     !x.LocationName.includes(this.packageSearchFilters.locationName)
        //   ) {
        //     return false;
        //   }
        // }

        return true;
      });
    },
    filtersApplied() {
      return Object.values(this.packageSearchFilters || {}).filter(x => !!x).length > 0;
    }
  }
});
</script>

<style scoped type="text/scss" lang="scss"></style>
