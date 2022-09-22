<template>
  <div
    class="hide-scrollbar grid grid-cols-6 grid-rows-2"
    style="height: 100%; grid-template-rows: auto 1fr"
  >
    <template v-if="plantQueryString.length > 0">
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
          <b-button-group v-if="plantSearchFilters.locationName">
            <b-button variant="outline-dark" disabled
              >Location matches "{{ plantSearchFilters.locationName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="partialUpdatePlantSearchFilters({ plantSearchFilters: { locationName: '' } })"
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="plantSearchFilters.strainName">
            <b-button variant="outline-dark" disabled
              >Strain matches "{{ plantSearchFilters.strainName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="partialUpdatePlantSearchFilters({ plantSearchFilters: { strainName: '' } })"
              >&#10006;</b-button
            >
          </b-button-group>
        </template> -->

        <!-- <template v-if="!filtersApplied"> -->
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ plantQueryString }}</span>
          matches {{ filteredPlants.length }}{{ filteredPlants.length === 500 ? "+" : "" }} plants
        </p>
        <!-- </template> -->

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="plantQueryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-blue-50 col-span-3">
        <plant-result-groups :plants="filteredPlants" />

        <div class="flex-grow bg-blue-50"></div>
      </div>

      <div class="flex flex-col overflow-y-auto col-span-3">
        <plant-search-result-detail />
      </div>
    </template>

    <template v-else>
      <div class="col-span-6">
        <!-- Top row is sized "auto", so this placeholer is needed -->
      </div>

      <div class="flex flex-col overflow-y-auto col-span-6">
        <plant-history-list />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { MutationType } from "@/mutation-types";
import { IIndexedPlantData, IPlantData, IPluginState } from "@/interfaces";
import { MessageType, PlantFilterIdentifiers, PlantState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import PlantSearchResultDetail from "@/components/plant-search-widget/PlantSearchResultDetail.vue";
import PlantResultGroups from "@/components/plant-search-widget/PlantResultGroups.vue";
// import PlantManifestCartBuilder from "@/components/plant-search-widget/PlantManifestCartBuilder.vue";
import PlantHistoryList from "@/components/plant-search-widget/PlantHistoryList.vue";
import { searchManager } from "@/modules/search-manager.module";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { mapActions, mapGetters, mapState } from "vuex";
import { TransferBuilderGetters } from "@/store/page-overlay/modules/transfer-builder/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";

export default Vue.extend({
  name: "PlantSearchResults",
  store,
  components: {
    PlantSearchResultDetail,
    PlantResultGroups,
    // PlantManifestCartBuilder,
    PlantHistoryList
  },
  data() {
    return {};
  },
  props: {
    plants: Array as () => IIndexedPlantData[],
    inflight: Boolean
  },
  watch: {
    plants: {
      immediate: true,
      handler(newValue, oldValue) {
        // if (
        //   !this.$data.detailPlantData ||
        //   !newValue.find((x: any) => x.Id === this.$data.detailPlantData?.Id)
        // ) {
        //   searchManager.selectedPlant.next(newValue[0]);
        // }
      }
    }
  },
  methods: {
    ...mapActions({
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`
    })
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      plantQueryString: (state: any) => state.plantSearch?.plantQueryString,
      plantSearchFilters: (state: any) => state.plantSearch?.plantSearchFilters
    }),
    ...mapGetters({}),
    filteredPlants() {
      return this.plants.filter((x: IPlantData) => {
        // if (!!this.plantSearchFilters.strainName) {
        //   if (!!x.StrainName && !x.StrainName.includes(this.plantSearchFilters.strainName)) {
        //     return false;
        //   }
        // }
        // if (!!this.plantSearchFilters.locationName) {
        //   if (!!x.LocationName && !x.LocationName.includes(this.plantSearchFilters.locationName)) {
        //     return false;
        //   }
        // }

        return true;
      });
    },
    filtersApplied() {
      return Object.values(this.plantSearchFilters || {}).filter(x => !!x).length > 0;
    }
  }
});
</script>

<style scoped type="text/scss" lang="scss"></style>
