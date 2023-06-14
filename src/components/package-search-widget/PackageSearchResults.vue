<template>
  <div
    class="hide-scrollbar grid grid-cols-6 grid-rows-2"
    style="height: 100%; grid-template-rows: auto 1fr"
  >
    <template v-if="packageSearchState.packageQueryString.length > 0">
      <div class="col-span-6 flex flex-row items-center space-x-2 p-4 border-purple-300 border-b">
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ packageSearchState.packageQueryString }}</span>
          matches {{ packages.length }}{{ packages.length === 500 ? "+" : "" }} packages
        </p>

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="packageSearchState.packageQueryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-purple-50 col-span-3">
        <package-result-groups :packages="packages" />

        <div class="flex-grow bg-purple-50"></div>
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
import PackageHistoryList from "@/components/package-search-widget/PackageHistoryList.vue";
import PackageResultGroups from "@/components/package-search-widget/PackageResultGroups.vue";
import PackageSearchResultDetail from "@/components/package-search-widget/PackageSearchResultDetail.vue";
import { IIndexedPackageData, IPackageData, IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { TransferBuilderGetters } from "@/store/page-overlay/modules/transfer-builder/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageSearchResults",
  store,
  components: {
    PackageSearchResultDetail,
    PackageResultGroups,
    PackageHistoryList,
  },
  data() {
    return {};
  },
  props: {
    packages: Array as () => IIndexedPackageData[],
    inflight: Boolean,
  },
  methods: {
    ...mapActions({
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
    }),
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      packageSearchState: (state: IPluginState) => state.packageSearch,
    }),
    ...mapGetters({
      // transferPackageList: `transferBuilder/${TransferBuilderGetters.ACTIVE_PACKAGE_LIST}`,
    }),
    filtersApplied() {
      return (
        Object.values(this.$store.state.packageSearchState.packageSearchFilters || {}).filter(
          (x) => !!x
        ).length > 0
      );
    },
  },
});
</script>

<style scoped type="text/scss" lang="scss"></style>
