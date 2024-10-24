<template>
  <div class="w-full flex flex-col flex-grow space-y-4">
    <div class="w-full grid grid-cols-3 gap-4 auto-cols-fr">
      <builder-step-header v-for="(step, index) of steps" :key="index" :stepNumber="index + 1" :stepText="step.stepText"
        :active="index === activeStepIndex" @click.stop.prevent.native="setActiveStepIndex(index)" />
    </div>

    <template v-if="activeStepIndex === 0">
      <div class="w-full flex flex-col space-y-4">
        <plant-picker :enableVegetative="true" :builderType="builderType" :selectedPlants.sync="selectedPlants" />

        <template v-if="selectedPlants.length > 0">
          <div class="flex flex-row justify-end">
            <b-button class="w-1/2" variant="success" size="md" @click="activeStepIndex = 1">
              NEXT
            </b-button>
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeStepIndex === 1">
      <div class="flex flex-col items-center">
        <div class="flex flex-col items-center" style="width: 600px">
          <b-form-group class="w-full" label="New Location:" label-size="sm">
            <location-picker :location.sync="newLocation" />
          </b-form-group>

          <b-form-group class="w-full" label="Move Date:" label-size="sm">
            <b-form-datepicker initial-date size="md" v-model="moveIsodate" :value="moveIsodate" />
          </b-form-group>

          <template v-if="!!newLocation && !!moveIsodate">
            <b-button class="w-full" variant="success" size="md" @click="activeStepIndex = 2">
              NEXT
            </b-button>
          </template>
        </div>
      </div>
    </template>

    <template v-if="activeStepIndex === 2">
      <div class="flex-grow" style="height: 35vh">
        <template v-if="allDetailsProvided">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-2 text-xl pt-6" style="width: 600px">
              <div>
                Moving
                <span class="font-bold ttt-purple">{{ selectedPlants.length }}</span>
                plants to
                <span class="font-bold ttt-purple">{{ newLocation.Name }}</span>.
              </div>

              <div>
                Move date:
                <span class="font-bold ttt-purple">{{ moveIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()">MOVE {{ selectedPlants.length }}
                PLANTS</b-button>
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
            <span v-if="!newLocation">Location not provided</span>
            <span v-if="!moveIsodate">Move date not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from '@/components/overlay-widget/shared/BuilderStepHeader.vue';
import CsvBreakout from '@/components/overlay-widget/shared/CsvBreakout.vue';
import LocationPicker from '@/components/overlay-widget/shared/LocationPicker.vue';
import PlantPicker from '@/components/overlay-widget/shared/PlantPicker.vue';
import { AnalyticsEvent, BuilderType } from '@/consts';
import {
  ICsvFile,
  IMetrcMovePlantsPayload,
  IPlantData
} from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import store from '@/store/page-overlay/index';
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from '@/utils/csv';
import { submitDateFromIsodate, todayIsodate } from '@/utils/date';
import Vue from 'vue';

export default Vue.extend({
  name: 'MovePlantsBuilder',
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout,
    LocationPicker,
    PlantPicker,
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    submit() {
      const rows: IMetrcMovePlantsPayload[] = [];

      for (const plant of this.$data.selectedPlants) {
        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.moveIsodate),
          LocationId: this.$data.newLocation.Id.toString(),
          Id: plant.Id.toString(),
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPlants.length,
        },
        this.buildCsvFiles(),
        25,
      );
    },
    async downloadAll() {
      for (const csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(AnalyticsEvent.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPlants.length,
          newLocationName: this.$data.newLocation.Name,
          moveIsodate: this.$data.moveIsodate,
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
          { isVector: false, data: this.$data.newLocation.Name },
          { isVector: false, data: this.$data.moveIsodate },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Move ${this.$data.selectedPlants.length} plants to ${this.$data.newLocation.Name}`,
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  computed: {
    allDetailsProvided() {
      return (
        this.$data.selectedPlants.length > 0 && !!this.$data.newLocation && !!this.$data.moveIsodate
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
  },
  data() {
    return {
      builderType: BuilderType.MOVE_PLANTS,
      activeStepIndex: 0,
      selectedPlants: [],
      newLocation: null,
      moveIsodate: todayIsodate(),
      steps: [
        {
          stepText: 'Select plants to move',
        },
        {
          stepText: 'Move details',
        },
        {
          stepText: 'Submit',
        },
      ],
    };
  },
  async mounted() { },
  async created() { },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
