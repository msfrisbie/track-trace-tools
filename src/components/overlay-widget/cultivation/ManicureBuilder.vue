<template>
  <div class="w-full flex flex-col flex-grow space-y-4">
    <div class="w-full grid grid-cols-3 gap-4 auto-cols-fr">
      <builder-step-header v-for="(step, index) of steps" :key="index" :stepNumber="index + 1" :stepText="step.stepText"
        :active="index === activeStepIndex" @click.stop.prevent.native="setActiveStepIndex(index)" />
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
              <template v-if="showFillPreviousManicure">
                <b-button class="w-full" variant="outline-info" size="md" @click="fillPreviousManicureData()">FILL FROM
                  LAST MANICURE</b-button>
              </template>

              <b-form-group class="w-full" label="Manicure Name:" label-size="sm">
                <harvest-picker :harvestName.sync="manicureName" :filterWholePlant="false"
                  v-on:selectHarvestName="manicureName = $event" />
              </b-form-group>

              <b-form-group class="w-full" label="Drying Location:" label-size="sm">
                <location-picker :location.sync="dryingLocation" />
              </b-form-group>

              <b-form-group class="w-full" label="Manicure Date:" label-size="sm">
                <b-form-datepicker initial-date v-model="manicureIsodate" :value="manicureIsodate" size="md" />
              </b-form-group>

              <template v-if="showHiddenDetailFields">
                <b-form-group class="w-full" label="Patient License Number:"
                  description="Leave this alone unless you are sure you ned to change it" label-size="sm">
                  <b-form-input size="md" v-model="patientLicenseNumber"></b-form-input>
                </b-form-group>
              </template>

              <template v-else>
                <b-button class="opacity-40" variant="light" @click="showHiddenDetailFields = true">ADVANCED</b-button>
              </template>
            </div>
          </div>
        </div>

        <template v-if="showWeightEntry">
          <div class="flex flex-col items-center p-4 space-y-4">
            <plant-weight-picker :selectedPlants="selectedPlants" :unitOfWeight.sync="unitOfWeight"
              :plantWeights.sync="manicuredWeights" />

            <template v-if="!allPlantsHaveValidWeight">
              <p class="text-red-500">One or more plants is missing a weight value.</p>
            </template>

            <template v-if="allDetailsProvided">
              <div class="w-full">
                <b-button class="w-full" variant="success" size="md" @click="saveManicureAndAdvance()">
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
                Manicuring
                <span class="font-bold ttt-purple">{{ totalManicuredWeight }} {{ unitOfWeight.Name }}</span>
                from
                <span class="font-bold ttt-purple">{{ selectedPlants.length }}</span>
                plants.
              </div>

              <div>
                Average per plant yield:
                <span class="font-bold ttt-purple">{{ averagePerPlantYield }} {{ unitOfWeight.Name }}</span>
              </div>

              <div>
                Manicure name:
                <span class="font-bold ttt-purple">{{ manicureName }}</span>
              </div>

              <div>
                Drying location:
                <span class="font-bold ttt-purple">{{ dryingLocation.Name }}</span>
              </div>

              <div>
                Manicure date:
                <span class="font-bold ttt-purple">{{ manicureIsodate }}</span>
              </div>

              <harvest-yield-checker :unitOfMeasureName="unitOfWeight.Name"
                :totalQuantity="parseFloat(totalManicuredWeight)" :plantCount="selectedPlants.length" />

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()">MANICURE {{ selectedPlants.length
                }} PLANTS</b-button>
            </div>

            <div style="height: 6rem"></div>

            <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()">DOWNLOAD CSVs</b-button>

            <csv-breakout class="opacity-40 mt-4" :csvFiles="csvFiles" />
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="selectedPlants.length === 0">No plants selected</span>
            <span v-if="!dryingLocation.Name">Drying location not provided</span>
            <span v-if="!manicureIsodate">Manicure date not provided</span>
            <span v-if="!totalManicuredWeight">Total manicure weight not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from '@/components/overlay-widget/shared/BuilderStepHeader.vue';
import HarvestYieldChecker from '@/components/overlay-widget/shared/HarvestYieldChecker.vue';
import {
  ICsvFile,
  IMetrcManicurePlantsPayload,
  IPlantData
} from '@/interfaces';
import store from '@/store/page-overlay/index';
import { arrayIsValid } from '@/utils/array';
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from '@/utils/csv';
import Vue from 'vue';

import CsvBreakout from '@/components/overlay-widget/shared/CsvBreakout.vue';
import HarvestPicker from '@/components/overlay-widget/shared/HarvestPicker.vue';
import LocationPicker from '@/components/overlay-widget/shared/LocationPicker.vue';
import PlantPicker from '@/components/overlay-widget/shared/PlantPicker.vue';
import PlantWeightPicker from '@/components/overlay-widget/shared/PlantWeightPicker.vue';
import { AnalyticsEvent, BuilderType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { authManager } from '@/modules/auth-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import { dynamicConstsManager } from '@/modules/dynamic-consts-manager.module';
import { submitDateFromIsodate, todayIsodate } from '@/utils/date';
import { sum } from 'lodash-es';

const PREVIOUS_MANICURE_DATA_KEY = 'previous_manicure_data';

export default Vue.extend({
  name: 'ManicureBuilder',
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout,
    HarvestPicker,
    HarvestYieldChecker,
    LocationPicker,
    PlantPicker,
    PlantWeightPicker,
  },
  methods: {
    updateManicuredWeights(plantWeights: number[]) {
      this.$data.manicuredWeights = plantWeights;
    },
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    submit() {
      const rows: IMetrcManicurePlantsPayload[] = [];

      for (let i = 0; i < this.$data.selectedPlants.length; ++i) {
        const plant: IPlantData = this.$data.selectedPlants[i];
        const weight: number = this.$data.manicuredWeights[i];

        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.manicureIsodate),
          DryingLocation: this.$data.dryingLocation.Id.toString(),
          HarvestName: this.$data.manicureName,
          Id: plant.Id.toString(),
          ProductWeight: weight.toString(),
          UnitOfWeightId: this.$data.unitOfWeight.Id.toString(),
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPlants.length,
          totalManicuredWeight: sum(this.$data.manicuredWeights),
          unitOfWeight: this.$data.unitOfWeight.Name,
        },
        this.buildCsvFiles(),
        25,
      );
    },
    fillPreviousManicureData() {
      const previousManicureData = localStorage.getItem(this.$data.previousManicureDataKey);

      if (!previousManicureData) {
        throw new Error('Missing previous manicure data');
      }

      const parsedManicureData: any = JSON.parse(previousManicureData) as Object;

      this.$data.dryingLocation = parsedManicureData.dryingLocation;
      this.$data.unitOfWeight = parsedManicureData.unitOfWeight;
      this.$data.manicureName = parsedManicureData.manicureName;
      this.$data.manicureIsodate = parsedManicureData.manicureIsodate;

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: 'Fill previous manicure data',
      });
    },
    saveManicureAndAdvance() {
      this.$data.activeStepIndex = 2;

      try {
        // If localStorage is full, this will error
        localStorage.setItem(
          this.$data.previousManicureDataKey,
          JSON.stringify({
            dryingLocation: this.$data.dryingLocation,
            unitOfWeight: this.$data.unitOfWeight,
            manicureName: this.$data.manicureName,
            manicureIsodate: this.$data.manicureIsodate,
          }),
        );
      } catch (e) {
        console.error(e);
      }
    },
    async downloadAll() {
      for (const csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(AnalyticsEvent.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPlants.length,
          totalManicuredWeight: sum(this.$data.manicuredWeights),
          unitOfWeight: this.$data.unitOfWeight.Name,
          dryingLocationName: this.$data.dryingLocation.Name,
          manicureName: this.$data.manicureName,
          manicureIsodate: this.$data.manicureIsodate,
        },
      });
    },
    buildCsvFiles(): ICsvFile[] {
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPlants.map((plantData: IPlantData) => plantData.Label),
          },
          { isVector: true, data: this.$data.manicuredWeights },
          { isVector: false, data: this.$data.unitOfWeight.Name },
          { isVector: false, data: this.$data.dryingLocation.Name },
          { isVector: false, data: this.$data.manicureName },
          { isVector: false, data: this.$data.patientLicenseNumber },
          { isVector: false, data: this.$data.manicureIsodate },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `${this.$data.manicureName} manicure ${sum(this.$data.manicuredWeights)} ${this.$data.unitOfWeight.Name
          } from ${this.$data.selectedPlants.length} plants`,
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    allPlantsHaveValidWeightImpl() {
      return arrayIsValid(this.$data.manicuredWeights, {
        rowValidators: [
          {
            fn: (row: any): boolean => typeof row === 'number' && row > 0,
            message: 'All values must be a number greater than 0',
          },
        ],
        collectionValidators: [
          {
            fn: (rows: any[]): boolean => rows.length === this.$data.selectedPlants.length,
            message: 'Collection must be same size as plants',
          },
          {
            fn: (rows: any[]): boolean => {
              try {
                return rows.reduce((a: number, b: number) => a + b, 0) > 0;
              } catch (e) {
                return false;
              }
            },
            message: 'Collection must sum to a positive number',
          },
        ],
      }).valid;
    },
  },
  computed: {
    totalManicuredWeight() {
      return sum(this.$data.manicuredWeights).toFixed(3);
    },
    averagePerPlantYield() {
      return parseFloat(
        (sum(this.$data.manicuredWeights) / this.$data.selectedPlants.length).toFixed(3),
      );
    },
    showWeightEntry(): boolean {
      return (
        !!this.$data.dryingLocation && !!this.$data.manicureName && !!this.$data.manicureIsodate
      );
    },
    allPlantsHaveValidWeight(): boolean {
      return this.allPlantsHaveValidWeightImpl();
    },
    allDetailsProvided(): boolean {
      return (
        !!this.$data.dryingLocation
        && !!this.$data.unitOfWeight
        && !!this.$data.manicureIsodate
        && this.allPlantsHaveValidWeightImpl()
        && !!this.$data.manicureName
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    showFillPreviousManicure() {
      return (
        !!this.$data.previousManicureDataKey
        && !!localStorage.getItem(this.$data.previousManicureDataKey)
      );
    },
  },
  data() {
    return {
      builderType: BuilderType.MANICURE_PLANTS,
      activeStepIndex: 0,
      selectedPlants: [],
      // Builder state
      showHiddenDetailFields: false,
      previousManicureDataKey: null,
      // Submission data
      dryingLocation: null,
      manicureIsodate: todayIsodate(),
      manicuredWeights: [],
      unitOfWeight: null,
      manicureName: '',
      patientLicenseNumber: '',
      steps: [
        {
          stepText: 'Select plants to manicure',
        },
        {
          stepText: 'Manicure details',
        },
        {
          stepText: 'Submit',
        },
      ],
    };
  },
  watch: {
    selectedPlants: {
      immediate: true,
      handler(newValue, oldValue) {
        if (this.$data.manicuredWeights.length !== newValue.length) {
          this.$data.manicuredWeights = Array(newValue.length).fill(0);
        }
      },
    },
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.previousManicureDataKey = `${PREVIOUS_MANICURE_DATA_KEY}_${authState.license}`;

    this.$data.unitOfWeight = (await dynamicConstsManager.unitsOfWeight())[0];
  },
  async created() { },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
