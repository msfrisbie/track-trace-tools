<template>
  <div class="w-full flex-grow grid grid-cols-2 auto-rows-fr gap-4" style="max-height: 50vh">
    <!-- Plant filter -->
    <div class="flex flex-col items-center p-4">
      <div class="w-full flex flex-col space-y-4" style="width: 420px">
        <div class="flex flex-row items-center justify-center">
          <span class="text-lg font-bold">Select one or more plant filters:</span>
        </div>

        <template v-if="enableVegetative">
          <b-form-group label="Growth phase:" label-class="text-gray-400" label-size="sm">
            <b-form-select v-model="growthPhase" :options="growthPhaseOptions"></b-form-select>
          </b-form-group>
        </template>

        <b-form-group label="Filter location:" label-class="text-gray-400" label-size="sm">
          <location-picker :location.sync="location" />
        </b-form-group>

        <b-form-group label="Filter strain:" label-class="text-gray-400" label-size="sm">
          <strain-picker :strain.sync="strain" />
        </b-form-group>

        <b-form-group label="Filter date:" label-class="text-gray-400" label-size="sm">
          <b-input-group>
            <b-form-select size="md" v-model="filterDateField" :options="filterDateFieldOptions" />
            <b-form-select size="md" v-model="filterDateMatch" :options="filterDateMatchOptions" />
            <b-form-datepicker
              button-only
              label-no-date-selected=""
              size="md"
              v-model="filterDate"
            />
          </b-input-group>
        </b-form-group>

        <span class="text-center text-purple-500 underline cursor-pointer" @click="clear()"
          >RESET</span
        >

        <template v-if="selectedPlants.length >= maxPlantCount">
          <div class="font-bold text-red-700 text-center">Plant Maximum Reached</div>
          <div class="text-red-700 text-center">
            Can't load any more plants. Submit this chunk before loading the next chunk.
          </div>
        </template>

        <div class="flex flex-col items-center text-center space-y-4">
          <error-readout
            v-if="error || inflight"
            :inflight="inflight"
            :error="error"
            loadingMessage="Loading plants..."
            errorMessage="Unable to load plants."
            permissionsErrorMessage="Check that your employee account has full 'Veg/Flower Plants' permissions."
            v-on:retry="loadPlants()"
          />

          <template
            v-if="!inflight && !sourcePlants.length && (!location || !strain || filterDate)"
          >
            <span>0 matching plants.</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Selected tags -->
    <div class="flex flex-col items-center space-y-4 p-4">
      <template v-if="sourcePlants.length > 0">
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
                class="w-full hover-reveal-target flex flex-row items-center justify-between space-x-8 text-lg plant-list-item"
                v-for="(plant, index) in plantsPage"
                :key="plant.Label"
              >
                <div class="flex flex-col flex-grow space-y-2">
                  <template v-if="pageOffset + index > 0">
                    <div class="grid grid-cols-2 gap-2 mb-2">
                      <b-button
                        variant="outline-success"
                        class="hover-reveal"
                        size="sm"
                        @click="addBefore(pageOffset + index)"
                        >CHECK {{ pageOffset + index }} BEFORE</b-button
                      >

                      <b-button
                        variant="outline-danger"
                        class="hover-reveal"
                        size="sm"
                        @click="removeBefore(pageOffset + index)"
                        >UNCHECK {{ pageOffset + index }} BEFORE</b-button
                      >
                    </div>
                  </template>

                  <b-form-checkbox
                    class="hover:bg-purple-50"
                    size="md"
                    v-model="selectedPlantsMirror"
                    :value="plant"
                  >
                    <picker-card :title="plant.StrainName" :label="plant.Label" />
                  </b-form-checkbox>

                  <template v-if="sourcePlants.length - (pageOffset + index) - 1 > 0">
                    <div class="grid grid-cols-2 gap-2 mt-2">
                      <b-button
                        variant="outline-success"
                        class="hover-reveal"
                        size="sm"
                        @click="addAfter(pageOffset + index)"
                      >
                        CHECK
                        {{ sourcePlants.length - (pageOffset + index) - 1 }}
                        AFTER</b-button
                      >

                      <b-button
                        variant="outline-danger"
                        class="hover-reveal"
                        size="sm"
                        @click="removeAfter(pageOffset + index)"
                      >
                        UNCHECK
                        {{ sourcePlants.length - (pageOffset + index) - 1 }}
                        AFTER</b-button
                      >
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <paste-tags
          v-if="selectedMenuItem === selectedMenuState.PASTED_TAGS"
          :sourceLabels="sourcePlants.map((x) => x.Label)"
          :tags.sync="pastedTags"
          ref="pasteTags"
        >
        </paste-tags>
      </template>

      <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
        <template v-if="sourcePlants.length > plantsPageSize">
          <div class="flex flex-row justify-between items-center" style="width: 420px">
            <b-button :disabled="!hasPrevPage" variant="outline-info" @click="plantsPageIndex -= 1"
              >&lt;</b-button
            >

            <span>{{ plantsPageIndex + 1 }} of {{ pages }}</span>

            <b-button :disabled="!hasNextPage" variant="outline-info" @click="plantsPageIndex += 1"
              >&gt;</b-button
            >
          </div>
        </template>
      </template>

      <div class="flex flex-row items-center justify-center space-x-6">
        <span class="text-center text-xl font-bold"
          ><animated-number :number="selectedPlants.length" /> plants selected</span
        >

        <template v-if="selectedPlants.length > 0">
          <span class="text-purple-500 underline cursor-pointer" @click="clear()">CLEAR</span>
        </template>
      </div>

      <!-- <template v-if="isPlantsExcluded">
        <span class="text-red-500">{{ plantsExcluded }} plants excluded</span>
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
import { ILocationData, IPlantData, IPlantFilter, IStrainData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import { Subject, combineLatest } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith, tap } from "rxjs/operators";
import { v4 } from "uuid";
import Vue from "vue";
import PasteTags from "./PasteTags.vue";

const PAGE_SIZE = 100;

export enum SelectedMenuState {
  SELECTION = "Select Plants",
  PASTED_TAGS = "Paste Plant Tags",
}

export default Vue.extend({
  name: "PlantPicker",
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
    selectedPlants: Array as () => IPlantData[],
    enableVegetative: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  methods: {
    clear() {
      this.$data.location = null;
      this.$data.strain = null;
      this.$data.filterDateField = null;
      this.$data.filterDateMatch = null;
      this.$data.filterDate = null;

      this.$data.sourcePlants = [];
      this.$data.selectedPlantsMirror = [];
      this.$data.selectedMenuItem = SelectedMenuState.SELECTION;

      // @ts-ignore
      this.$refs.pasteTags.clearForm();
    },
    addBefore(index: number) {
      this.removeBefore(index);
      this.$data.selectedPlantsMirror = [
        ...this.$data.sourcePlants.slice(0, index),
        ...this.$data.selectedPlantsMirror,
      ];
    },
    removeBefore(index: number) {
      this.$data.selectedPlantsMirror = this.$data.sourcePlants
        .slice(index)
        .filter((x: IPlantData) => this.$props.selectedPlants.includes(x));
    },
    addAfter(index: number) {
      this.removeAfter(index);
      this.$data.selectedPlantsMirror = [
        ...this.$data.selectedPlantsMirror,
        ...this.$data.sourcePlants.slice(index + 1),
      ];
    },
    removeAfter(index: number) {
      this.$data.selectedPlantsMirror = this.$data.sourcePlants
        .slice(0, index + 1, this.$data.sourcePlants.length)
        .filter((x: IPlantData) => this.$props.selectedPlants.includes(x));
    },
    filterSelected() {
      if (this.isPastedTags) {
        this.filterSelectedByPastedTags();
      } else {
        this.selectAll();
      }
    },
    filterSelectedByPastedTags() {
      this.$data.selectedPlantsMirror = this.$data.sourcePlants.filter((x: IPlantData) =>
        this.$data.pastedTags.includes(x.Label)
      );
    },
    selectAll() {
      this.$data.selectedPlantsMirror = this.$data.sourcePlants;
    },
    async loadPlants() {
      const filter: IPlantFilter = {};

      if (this.$data.location) {
        filter.locationName = this.$data.location.Name;
      }

      if (this.$data.strain) {
        filter.strainName = this.$data.strain.Name;
      }

      if (this.$data.filterDateField && this.$data.filterDateMatch && this.$data.filterDate) {
        // I'm guessing Metrc strips out the time, just match what they're sending
        const isoDatetime = `${this.$data.filterDate}T08:00:00.000Z`;

        if (this.$data.filterDateField === "PlantedDate") {
          switch (this.$data.filterDateMatch) {
            case "lt":
              filter.plantedDateLt = isoDatetime;
              break;
            case "eq":
              filter.plantedDateEq = isoDatetime;
              break;
            case "gt":
              filter.plantedDateGt = isoDatetime;
              break;
          }
        }

        if (this.$data.filterDateField === "VegetativeDate") {
          switch (this.$data.filterDateMatch) {
            case "lt":
              filter.vegetativeDateLt = isoDatetime;
              break;
            case "eq":
              filter.vegetativeDateEq = isoDatetime;
              break;
            case "gt":
              filter.vegetativeDateGt = isoDatetime;
              break;
          }
        }

        if (this.$data.filterDateField === "FloweringDate") {
          switch (this.$data.filterDateMatch) {
            case "lt":
              filter.floweringDateLt = isoDatetime;
              break;
            case "eq":
              filter.floweringDateEq = isoDatetime;
              break;
            case "gt":
              filter.floweringDateGt = isoDatetime;
              break;
          }
        }
      }

      this.$data.error = null;
      this.$data.inflight = true;

      try {
        // This is a fucking hack, do better
        const lock = v4();
        this.$data.lockUuid = lock;

        const plants =
          this.$data.growthPhase === "Vegetative"
            ? await primaryDataLoader.vegetativePlants({
                filter,
                maxCount: DATA_LOAD_MAX_COUNT,
              })
            : await primaryDataLoader.floweringPlants({
                filter,
                maxCount: DATA_LOAD_MAX_COUNT,
              });

        // If there was a subsequent load, don't overwrite
        if (this.$data.lockUuid === lock) {
          this.$data.sourcePlants = plants.sort((a: IPlantData, b: IPlantData) =>
            a.Label.localeCompare(b.Label)
          );

          // This must perform a shallow clone
          this.$data.selectedPlantsMirror = [...this.$data.sourcePlants];
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
    plantsPage() {
      const startIdx = PAGE_SIZE * this.$data.plantsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantsPageIndex + 1);
      return this.$data.sourcePlants.slice(startIdx, endIdx);
    },
    hasNextPage() {
      return (this.$data.plantsPageIndex + 1) * PAGE_SIZE < this.$data.sourcePlants.length;
    },
    hasPrevPage() {
      return this.$data.plantsPageIndex > 0;
    },
    pages() {
      return Math.ceil(this.$data.sourcePlants.length / PAGE_SIZE);
    },
    pageOffset() {
      return this.$data.plantsPageIndex * PAGE_SIZE;
    },
    plantsExcluded() {
      return this.$data.sourcePlants.length - this.$props.selectedPlants.length;
    },
    isPlantsExcluded() {
      return this.$props.selectedPlants.length < this.$data.sourcePlants.length;
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
      growthPhase$: new Subject<IStrainData>(),
      dateFilterData$: new Subject<[string, string, string]>(),
      sourcePlants: [],
      selectedPlantsMirror: [],
      plantsPageIndex: 0,
      plantsPageSize: PAGE_SIZE,
      inflight: false,
      error: null,
      maxPlantCount: DATA_LOAD_MAX_COUNT,
      lockUuid: null,
      filterDate: null,
      filterDateField: null,
      filterDateMatch: null,
      filterDateMatchOptions: [
        { value: "lt", text: "is before" },
        { value: "eq", text: "is on" },
        { value: "gt", text: "is after" },
      ],
      filterDateFieldOptions: [
        { value: null, text: "" },
        { value: "PlantedDate", text: "Planted date" },
        { value: "VegetativeDate", text: "Vegetative date" },
        { value: "FloweringDate", text: "Flowering date" },
      ],
      growthPhase: "Flowering",
      growthPhaseOptions: ["Vegetative", "Flowering"],
      copyPasteTags: false,
      pastedTags: [],
      selectedMenuState: SelectedMenuState,
      selectedMenuItem: SelectedMenuState.SELECTION,
    };
  },
  watch: {
    growthPhase: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.growthPhase$.next(newValue);
      },
    },
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
    filterDateField: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.dateFilterData$.next([
          this.$data.filterDateField,
          this.$data.filterDateMatch,
          this.$data.filterDate,
        ]);
      },
    },
    filterDateMatch: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.dateFilterData$.next([
          this.$data.filterDateField,
          this.$data.filterDateMatch,
          this.$data.filterDate,
        ]);
      },
    },
    filterDate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.dateFilterData$.next([
          this.$data.filterDateField,
          this.$data.filterDateMatch,
          this.$data.filterDate,
        ]);
      },
    },
    selectedPlantsMirror: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:selectedPlants", newValue);
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
      this.$data.dateFilterData$.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith([null, null, null])
      ),
      this.$data.growthPhase$.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith(this.$data.growthPhase)
      ),
    ])
      .pipe(
        tap((_: any) => {
          this.$data.plantsPageIndex = 0;
        }),
        filter(
          ([location, strain, [filterDateField, filterDateMatch, filterDate], growthPhase]) =>
            !!location || !!strain || !!filterDate
        )
      )
      .subscribe(
        async ([location, strain, [filterDateField, filterDateMatch, filterDate], growthPhase]: [
          ILocationData,
          IStrainData,
          [string, string, string],
          string
        ]) => {
          this.$data.location = location;
          this.$data.strain = strain;
          this.$data.filterDateField = filterDateField;
          this.$data.filterDateMatch = filterDateMatch;
          this.$data.filterDate = filterDate;
          this.$data.growthPhase = growthPhase;

          // Allow parent component to use selected location
          this.$emit("selectLocation", location);

          // Allow parent component to use selected strain
          this.$emit("selectStrain", strain);

          this.loadPlants();
        }
      );
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
