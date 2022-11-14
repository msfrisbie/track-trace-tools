<template>
  <div class="w-full flex-grow grid grid-cols-2 auto-rows-fr gap-4" style="max-height: 50vh">
    <!-- PlantBatch filter -->
    <div class="flex flex-col items-center p-4">
      <div class="w-full flex flex-col space-y-4" style="width: 420px">
        <div class="flex flex-row items-center justify-center">
          <span class="text-lg font-bold">Select plant batches by location:</span>
        </div>

        <location-picker :location.sync="location" />

        <template v-if="strain || location">
          <b-form-group label="Filter strain: (optional)" label-size="sm">
            <strain-picker :strain.sync="strain" />
          </b-form-group>
        </template>

        <template v-if="selectedPlantBatches.length >= maxPlantBatchCount">
          <div class="font-bold text-red-700 text-center">Plant Batch Maximum Reached</div>
          <div class="text-red-700 text-center">
            Can't load any more plant batches. Submit this chunk before loading the next chunk.
          </div>
        </template>

        <div class="flex flex-col items-center text-center space-y-4">
          <error-readout
            v-if="error || inflight"
            :inflight="inflight"
            :error="error"
            loadingMessage="Loading plant batches..."
            errorMessage="Unable to load plant batches."
            permissionsErrorMessage="Check that your employee account has full 'Veg/Flower Plant Batches' permissions."
            v-on:retry="loadPlantBatches()"
          />

          <template v-if="!inflight && !sourcePlantBatches.length && !!location">
            <span>0 matching plant batches.</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Selected tags -->
    <div class="flex flex-col items-center space-y-4 p-4">
      <template v-if="sourcePlantBatches.length > 0">
        <b-dropdown
          style="width: 420px"
          :text="selectedMenuItem.toUpperCase()"
          variant="outline-primary"
          class="w-full"
          menu-class="w-100 pt-0 pb-0"
          block
          rounded
        >
          <b-dropdown-item
            :active="selectedMenuItem === selectedMenuState.SELECTION"
            @click="selectedMenuItem = selectedMenuState.SELECTION"
          >
            <div class="pt-2 pb-2">{{ selectedMenuState.SELECTION }}</div>
          </b-dropdown-item>
          <div class="border-b border-solid border-inherit"></div>
          <b-dropdown-item
            :active="selectedMenuItem === selectedMenuState.PASTED_TAGS"
            @click="selectedMenuItem = selectedMenuState.PASTED_TAGS"
          >
            <div class="pt-2 pb-2">{{ selectedMenuState.PASTED_TAGS }}</div>
          </b-dropdown-item>
        </b-dropdown>

        <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
          <div
            style="width: 420px"
            class="toolkit-scroll flex flex-col items-center h-4/6 overflow-y-auto p-1"
          >
            <div class="w-full flex flex-col flex-grow items-center space-y-2">
              <div
                class="w-full hover-reveal-target flex flex-row items-center justify-between space-x-8 text-lg plantBatch-list-item"
                v-for="(plantBatch, index) in plantBatchesPage"
                :key="plantBatch.Label"
              >
                <div class="flex flex-col flex-grow space-y-2">
                  <template v-if="pageOffset + index > 0">
                    <b-button
                      variant="warning"
                      class="hover-reveal"
                      size="sm"
                      @click="removeBefore(pageOffset + index)"
                      >UNCHECK {{ pageOffset + index }} BEFORE</b-button
                    >
                  </template>

                  <b-form-checkbox
                    class="hover:bg-purple-50"
                    size="md"
                    v-model="selectedPlantBatchesMirror"
                    :value="plantBatch"
                  >
                    <picker-card
                      :title="plantBatch.UntrackedCount + ' ' + plantBatch.StrainName"
                      :label="plantBatch.Name"
                    />
                  </b-form-checkbox>

                  <template v-if="sourcePlantBatches.length - (pageOffset + index) - 1 > 0">
                    <b-button
                      variant="warning"
                      class="hover-reveal"
                      size="sm"
                      @click="removeAfter(pageOffset + index)"
                    >
                      UNCHECK
                      {{ sourcePlantBatches.length - (pageOffset + index) - 1 }}
                      AFTER</b-button
                    >
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <paste-tags
          v-if="selectedMenuItem === selectedMenuState.PASTED_TAGS"
          :tags.sync="pastedTags"
          ref="pasteTags"
        >
        </paste-tags>
      </template>

      <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
        <template v-if="sourcePlantBatches.length > plantBatchesPageSize">
          <div class="flex flex-row justify-between items-center" style="width: 420px">
            <b-button
              :disabled="!hasPrevPage"
              variant="outline-info"
              @click="plantBatchesPageIndex -= 1"
              >&lt;</b-button
            >

            <span>{{ plantBatchesPageIndex + 1 }} of {{ pages }}</span>

            <b-button
              :disabled="!hasNextPage"
              variant="outline-info"
              @click="plantBatchesPageIndex += 1"
              >&gt;</b-button
            >
          </div>
        </template>
      </template>

      <div class="flex flex-row items-center justify-center space-x-6">
        <span class="text-center text-xl font-bold"
          ><animated-number :number="selectedPlantBatches.length" /> plant batches selected</span
        >

        <template v-if="selectedPlantBatches.length > 0">
          <span class="text-purple-500 underline cursor-pointer" @click="clear()">CLEAR</span>
        </template>
      </div>

      <!-- <template v-if="isPlantBatchesExcluded">
        <span class="text-red-500">{{ plantBatchesExcluded }} plant batches excluded</span>
      </template> -->
    </div>
  </div>
</template>

<script lang="ts">
import AnimatedNumber from "@/components/overlay-widget/shared/AnimatedNumber.vue";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import { DATA_LOAD_MAX_COUNT } from "@/consts";
import { ILocationData, IPlantBatchData, IPlantBatchFilter, IStrainData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import { combineLatest, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith, tap } from "rxjs/operators";
import { v4 } from "uuid";
import Vue from "vue";
import PasteTags from "./PasteTags.vue";

const PAGE_SIZE = 100;

export enum SelectedMenuState {
  SELECTION = "Select Plant Batches",
  PASTED_TAGS = "Paste Plant Batch Tags",
}

export default Vue.extend({
  name: "PlantBatchPicker",
  store,
  components: {
    LocationPicker,
    StrainPicker,
    ErrorReadout,
    PickerCard,
    AnimatedNumber,
    PasteTags,
  },
  props: {
    builderType: String,
    selectedPlantBatches: Array as () => IPlantBatchData[],
  },
  methods: {
    clear() {
      this.$data.location = null;
      this.$data.strain = null;

      this.$data.sourcePlantBatches = [];
      this.$data.selectedPlantBatchesMirror = [];
      this.$data.selectedMenuItem = SelectedMenuState.SELECTION;

      // @ts-ignore
      this.$refs.pasteTags.clearForm();
    },
    removeBefore(index: number) {
      this.$data.selectedPlantBatchesMirror = this.$data.sourcePlantBatches
        .slice(index)
        .filter((x: IPlantBatchData) => this.$props.selectedPlantBatches.includes(x));
    },
    removeAfter(index: number) {
      this.$data.selectedPlantBatchesMirror = this.$data.sourcePlantBatches
        .slice(0, index + 1, this.$data.sourcePlantBatches.length)
        .filter((x: IPlantBatchData) => this.$props.selectedPlantBatches.includes(x));
    },
    filterSelected() {
      if (this.isPastedTags) {
        this.filterSelectedByPastedTags();
      } else {
        this.selectAll();
      }
    },
    filterSelectedByPastedTags() {
      this.$data.selectedPlantBatchesMirror = this.$data.sourcePlantBatches.filter(
        (x: IPlantBatchData) => this.$data.pastedTags.includes(x.Name)
      );
    },
    selectAll() {
      this.$data.selectedPlantBatchesMirror = this.$data.sourcePlantBatches;
    },
    async loadPlantBatches() {
      const filter: IPlantBatchFilter = {};

      if (this.$data.location) {
        filter.locationName = this.$data.location.Name;
      }

      if (this.$data.strain) {
        filter.strainName = this.$data.strain.Name;
      }

      this.$data.error = null;
      this.$data.inflight = true;

      try {
        const lock = v4();
        this.$data.lockUuid = lock;

        const plantBatches = await primaryDataLoader.plantBatches({
          filter,
          maxCount: DATA_LOAD_MAX_COUNT,
        });

        // If there was a subsequent load, don't overwrite
        if (this.$data.lockUuid === lock) {
          this.$data.sourcePlantBatches = plantBatches.sort(
            (a: IPlantBatchData, b: IPlantBatchData) => (a.Name > b.Name ? 1 : -1)
          );

          // This must perform a shallow clone
          this.$data.selectedPlantBatchesMirror = [...this.$data.sourcePlantBatches];
        } else {
          console.log("Lock not owned, exiting");
          return;
        }
      } catch (e) {
        console.error(e);
        this.$data.error = e;
      }

      this.$data.inflight = false;
    },
  },
  computed: {
    plantBatchesPage() {
      const startIdx = PAGE_SIZE * this.$data.plantBatchesPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantBatchesPageIndex + 1);
      return this.$data.sourcePlantBatches.slice(startIdx, endIdx);
    },
    hasNextPage() {
      return (
        (this.$data.plantBatchesPageIndex + 1) * PAGE_SIZE < this.$data.sourcePlantBatches.length
      );
    },
    hasPrevPage() {
      return this.$data.plantBatchesPageIndex > 0;
    },
    pages() {
      return Math.ceil(this.$data.sourcePlantBatches.length / PAGE_SIZE);
    },
    pageOffset() {
      return this.$data.plantBatchesPageIndex * PAGE_SIZE;
    },
    plantBatchesExcluded() {
      return this.$data.sourcePlantBatches.length - this.$props.selectedPlantBatches.length;
    },
    isPlantBatchesExcluded() {
      return this.$props.selectedPlantBatches.length < this.$data.sourcePlantBatches.length;
    },
    isPastedTags() {
      return this.$data.pastedTags.length > 0;
    },
  },
  data() {
    return {
      location: null,
      location$: new Subject<ILocationData>(),
      strain: null,
      strain$: new Subject<IStrainData>(),
      sourcePlantBatches: [],
      selectedPlantBatchesMirror: [],
      plantBatchesPageIndex: 0,
      plantBatchesPageSize: PAGE_SIZE,
      inflight: false,
      error: null,
      maxPlantBatchCount: DATA_LOAD_MAX_COUNT,
      lockUuid: null,
      pastedTags: [],
      selectedMenuState: SelectedMenuState,
      selectedMenuItem: SelectedMenuState.SELECTION,
    };
  },
  watch: {
    location: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.location$.next(newValue);
      },
    },
    strain: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.strain$.next(newValue);
      },
    },
    selectedPlantBatchesMirror: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:selectedPlantBatches", newValue);
      },
    },
    pastedTags: {
      immediate: true,
      handler(newValue, oldValue) {
        this.filterSelected();
      },
    },
  },
  async mounted() {},
  async created() {
    await authManager.authStateOrError();

    combineLatest([
      this.$data.location$.pipe(debounceTime(500), distinctUntilChanged(), startWith(null)),
      this.$data.strain$.pipe(debounceTime(500), distinctUntilChanged(), startWith(null)),
    ])
      .pipe(
        tap((_: any) => {
          this.$data.plantBatchesPageIndex = 0;
        }),
        filter(([location, strain]) => {
          return !!location;
        })
      )
      .subscribe(async ([location, strain]: [ILocationData, IStrainData]) => {
        this.$data.location = location;
        this.$data.strain = strain;

        // Allow parent component to use selected location
        this.$emit("selectLocation", location);

        // Allow parent component to use selected strain
        this.$emit("selectStrain", strain);

        this.loadPlantBatches();
      });
  },
});
</script>

<style type="text/scss" lang="scss">
.hover-reveal-target .hover-reveal {
  display: none !important;
}

.hover-reveal-target:hover .hover-reveal {
  display: block !important;
}
</style>
