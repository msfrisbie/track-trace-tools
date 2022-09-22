<template>
  <div class="w-full flex flex-col flex-grow space-y-4">
    <div class="w-full grid grid-cols-3 gap-4 auto-cols-fr">
      <builder-step-header
        v-for="(step, index) of steps"
        :key="index"
        :stepNumber="index + 1"
        :stepText="step.stepText"
        :active="index === activeStepIndex"
        @click.stop.prevent.native="setActiveStepIndex(index)"
      />
    </div>

    <template v-if="activeStepIndex === 0">
      <div class="w-full flex flex-col space-y-4">
        <plant-picker :builderType="builderType" :selectedPlants.sync="selectedPlants" />

        <template v-if="selectedPlants.length > 0">
          <div class="w-full flex flex-row justify-end">
            <b-button class="w-1/2" variant="success" size="md" @click="activeStepIndex = 1">
              NEXT
            </b-button>
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeStepIndex === 1">
      <div class="w-full flex-grow grid grid-cols-2 gap-4">
        <div class="flex flex-col items-center p-4">
          <div class="w-full flex flex-col items-center">
            <div class="w-full flex flex-col items-center space-y-4">
              <template v-if="showFillPreviousHarvest">
                <b-button
                  class="w-full"
                  variant="outline-info"
                  size="md"
                  @click="fillPreviousHarvestData()"
                  >FILL FROM LAST HARVEST</b-button
                >
              </template>

              <b-form-group class="w-full" label="Harvest Name:" label-size="sm">
                <harvest-picker
                  :harvestName.sync="harvestName"
                  :filterWholePlant="true"
                  v-on:selectHarvestName="harvestName = $event"
                />
              </b-form-group>

              <b-form-group class="w-full" label="Drying Location:" label-size="sm">
                <location-picker :location.sync="dryingLocation" />
              </b-form-group>

              <b-form-group class="w-full" label="Harvest Date:" label-size="sm">
                <b-form-datepicker
                  initial-date
                  v-model="harvestIsodate"
                  :value="harvestIsodate"
                  size="md"
                />
              </b-form-group>

              <template v-if="showHiddenDetailFields">
                <b-form-group
                  class="w-full"
                  label="Patient License Number:"
                  description="Leave this alone unless you are sure you need to change it"
                  label-size="sm"
                >
                  <b-form-input size="md" v-model="patientLicenseNumber"></b-form-input>
                </b-form-group>
              </template>

              <template v-else>
                <b-button class="opacity-40" variant="light" @click="showHiddenDetailFields = true"
                  >ADVANCED</b-button
                >
              </template>
            </div>
          </div>
        </div>

        <template v-if="showWeightEntry">
          <div class="flex flex-col items-center p-4 space-y-4">
            <plant-weight-picker
              :selectedPlants="selectedPlants"
              :unitOfWeight.sync="unitOfWeight"
              :plantWeights.sync="harvestedWeights"
            />

            <template v-if="!allPlantsHaveValidWeight">
              <p class="text-red-500">
                One or more plants is missing a weight value.
              </p>
            </template>

            <template v-if="allDetailsProvided">
              <div class="w-full">
                <b-button
                  class="w-full"
                  variant="success"
                  size="md"
                  @click="saveHarvestAndAdvance()"
                >
                  NEXT
                </b-button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeStepIndex === 2">
      <div class="flex-grow">
        <template v-if="selectedPlants.length > 0 && allDetailsProvided">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-2 text-xl pt-6" style="width: 600px">
              <div>
                Harvesting
                <span class="font-bold ttt-purple"
                  >{{ totalHarvestedWeight }} {{ unitOfWeight.Name }}</span
                >
                from
                <span class="font-bold ttt-purple">{{ selectedPlants.length }}</span>
                plants.
              </div>

              <div>
                Average per plant yield:
                <span class="font-bold ttt-purple"
                  >{{ averagePerPlantYield }} {{ unitOfWeight.Name }}</span
                >
              </div>

              <div>
                Harvest name:
                <span class="font-bold ttt-purple">{{ harvestName }}</span>
              </div>

              <div>
                Drying location:
                <span class="font-bold ttt-purple">{{ dryingLocation.Name }}</span>
              </div>

              <div>
                Harvest date:
                <span class="font-bold ttt-purple">{{ harvestIsodate }}</span>
              </div>

              <harvest-yield-checker
                :unitOfMeasureName="unitOfWeight.Name"
                :totalQuantity="parseFloat(totalHarvestedWeight)"
                :plantCount="selectedPlants.length"
              />

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >HARVEST {{ selectedPlants.length }} PLANTS</b-button
              >
            </div>

            <div style="height: 6rem"></div>

            <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()"
              >DOWNLOAD CSVs</b-button
            >

            <csv-breakout class="opacity-40 mt-4" :csvFiles="csvFiles" />
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="selectedPlants.length === 0">No plants selected</span>
            <span v-if="!dryingLocation.Name">Drying location not provided</span>
            <span v-if="!harvestIsodate">Harvest date not provided</span>
            <span v-if="!totalHarvestedWeight">Total harvest weight not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { mapState } from "vuex";
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import HarvestYieldChecker from "@/components/overlay-widget/shared/HarvestYieldChecker.vue";
import { isValidTag, generateTagRangeOrError } from "@/utils/tags";
import { arrayIsValid } from "@/utils/array";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { combineLatest, from, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith, tap } from "rxjs/operators";
import {
  IPlantData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcHarvestPlantsPayload
} from "@/interfaces";
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";

import { todayIsodate, submitDateFromIsodate } from "@/utils/date";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { BuilderType, MessageType } from "@/consts";
import { builderManager } from "@/modules/builder-manager.module";
import PlantPicker from "@/components/overlay-widget/shared/PlantPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import HarvestPicker from "@/components/overlay-widget/shared/HarvestPicker.vue";
import PlantWeightPicker from "@/components/overlay-widget/shared/PlantWeightPicker.vue";
import { sum } from "lodash";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";

const PREVIOUS_HARVEST_DATA_KEY = "previous_harvest_data";

export default Vue.extend({
  name: "HarvestBuilder",
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout,
    HarvestPicker,
    HarvestYieldChecker,
    LocationPicker,
    PlantPicker,
    PlantWeightPicker
  },
  methods: {
    updateHarvestedWeights(plantWeights: number[]) {
      this.$data.harvestedWeights = plantWeights;
    },
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`
      });
    },
    submit() {
      const rows: IMetrcHarvestPlantsPayload[] = [];

      for (let i = 0; i < this.$data.selectedPlants.length; ++i) {
        const plant: IPlantData = this.$data.selectedPlants[i];
        const weight: number = this.$data.harvestedWeights[i];

        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.harvestIsodate),
          DryingLocation: this.$data.dryingLocation.Id.toString(),
          HarvestName: this.$data.harvestName,
          Id: plant.Id.toString(),
          PlantWeight: weight.toString(),
          UnitOfWeightId: this.$data.unitOfWeight.Id.toString()
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPlants.length,
          totalHarvestedWeight: sum(this.$data.harvestedWeights),
          unitOfWeight: this.$data.unitOfWeight.Name
        },
        this.buildCsvFiles(),
        25
      );
    },
    fillPreviousHarvestData() {
      const previousHarvestData = localStorage.getItem(this.$data.previousHarvestDataKey);

      if (!previousHarvestData) {
        throw new Error("Missing previous harvest data");
      }

      const parsedHarvestData: any = JSON.parse(previousHarvestData) as Object;

      this.$data.dryingLocation = parsedHarvestData.dryingLocation;
      this.$data.unitOfWeight = parsedHarvestData.unitOfWeight;
      this.$data.harvestName = parsedHarvestData.harvestName;
      this.$data.harvestIsodate = parsedHarvestData.harvestIsodate;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: "Fill previous harvest data"
      });
    },
    saveHarvestAndAdvance() {
      this.$data.activeStepIndex = 2;

      try {
        // If localStorage is full, this will error
        localStorage.setItem(
          this.$data.previousHarvestDataKey,
          JSON.stringify({
            dryingLocation: this.$data.dryingLocation,
            unitOfWeight: this.$data.unitOfWeight,
            harvestName: this.$data.harvestName,
            harvestIsodate: this.$data.harvestIsodate
          })
        );
      } catch (e) {
        console.error(e);
      }
    },
    async downloadAll() {
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPlants.length,
          totalHarvestedWeight: sum(this.$data.harvestedWeights),
          unitOfWeight: this.$data.unitOfWeight.Name,
          dryingLocationName: this.$data.dryingLocation.Name,
          harvestName: this.$data.harvestName,
          harvestIsodate: this.$data.harvestIsodate
        }
      });
    },
    buildCsvFiles(): ICsvFile[] {
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPlants.map((plantData: IPlantData) => plantData.Label)
          },
          { isVector: true, data: this.$data.harvestedWeights },
          { isVector: false, data: this.$data.unitOfWeight.Name },
          { isVector: false, data: this.$data.dryingLocation.Name },
          { isVector: false, data: this.$data.harvestName },
          { isVector: false, data: this.$data.patientLicenseNumber },
          { isVector: false, data: this.$data.harvestIsodate }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `${this.$data.harvestName} harvest ${sum(this.$data.harvestedWeights)} ${
            this.$data.unitOfWeight.Name
          } from ${this.$data.selectedPlants.length} plants`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    allPlantsHaveValidWeightImpl() {
      return arrayIsValid(this.$data.harvestedWeights, {
        rowValidators: [
          {
            fn: (row: any): boolean => {
              return typeof row === "number" && row > 0;
            },
            message: "All values must be a number greater than 0"
          }
        ],
        collectionValidators: [
          {
            fn: (rows: any[]): boolean => {
              return rows.length === this.$data.selectedPlants.length;
            },
            message: "Collection must be same size as plants"
          },
          {
            fn: (rows: any[]): boolean => {
              try {
                return rows.reduce((a: number, b: number) => a + b, 0) > 0;
              } catch (e) {
                return false;
              }
            },
            message: "Collection must sum to a positive number"
          }
        ]
      }).valid;
    }
  },
  computed: {
    totalHarvestedWeight() {
      return sum(this.$data.harvestedWeights).toFixed(3);
    },
    averagePerPlantYield() {
      return parseFloat(
        (sum(this.$data.harvestedWeights) / this.$data.selectedPlants.length).toFixed(3)
      );
    },
    showWeightEntry(): boolean {
      return !!this.$data.dryingLocation && !!this.$data.harvestName && !!this.$data.harvestIsodate;
    },
    allPlantsHaveValidWeight(): boolean {
      return this.allPlantsHaveValidWeightImpl();
    },
    allDetailsProvided(): boolean {
      return (
        !!this.$data.dryingLocation &&
        !!this.$data.unitOfWeight &&
        !!this.$data.harvestIsodate &&
        this.allPlantsHaveValidWeightImpl() &&
        !!this.$data.harvestName
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    showFillPreviousHarvest() {
      return (
        !!this.$data.previousHarvestDataKey &&
        !!localStorage.getItem(this.$data.previousHarvestDataKey)
      );
    }
  },
  data() {
    return {
      builderType: BuilderType.HARVEST_PLANTS,
      activeStepIndex: 0,
      selectedPlants: [],
      // Builder state
      showHiddenDetailFields: false,
      previousHarvestDataKey: null,
      // Submission data
      dryingLocation: null,
      harvestIsodate: todayIsodate(),
      harvestedWeights: [],
      unitOfWeight: null,
      harvestName: "",
      patientLicenseNumber: "",
      steps: [
        {
          stepText: "Select plants to harvest"
        },
        {
          stepText: "Harvest details"
        },
        {
          stepText: "Submit"
        }
      ]
    };
  },
  watch: {
    selectedPlants: {
      immediate: true,
      handler(newValue, oldValue) {
        if (this.$data.harvestedWeights.length !== newValue.length) {
          this.$data.harvestedWeights = Array(newValue.length).fill(0);
        }
      }
    }
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.previousHarvestDataKey = `${PREVIOUS_HARVEST_DATA_KEY}_${authState.license}`;

    this.$data.unitOfWeight = (await dynamicConstsManager.unitsOfWeight())[0];
  },
  async created() {},
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
