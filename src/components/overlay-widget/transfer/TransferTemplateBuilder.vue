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
        <div>TODO PACKAGE PICKER</div>

        <template v-if="selectedPackages.length > 0">
          <div class="w-full flex flex-row justify-end">
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
          <div>TODO TRANSPORT DETAILS</div>

          <!-- TODO -->
          <template v-if="true">
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
              <div>TODO DETAILS</div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >CREATE/EDIT TRANSFER</b-button
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

            <!-- TODO -->

            <!-- <span v-if="selectedPackages.length === 0">No plants selected</span>
            <span v-if="!newLocation">Location not provided</span>
            <span v-if="!moveIsodate">Move date not provided</span> -->
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
import { isValidTag, generateTagRangeOrError } from "@/utils/tags";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { combineLatest, from, Subject } from "rxjs";
import {
  debounceTime, distinctUntilChanged, filter, startWith, tap
} from "rxjs/operators";
import {
  IPlantData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcMovePlantsPayload
} from "@/interfaces";
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import { todayIsodate, submitDateFromIsodate } from "@/utils/date";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { BuilderType, MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import PlantPicker from "@/components/overlay-widget/shared/PlantPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";

export default Vue.extend({
  name: "TransferTemplateBuilder",
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`
      });
    },
    submit() {
      const rows: IMetrcMovePlantsPayload[] = [];

      for (const plant of this.$data.selectedPackages) {
        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.moveIsodate),
          LocationId: this.$data.newLocation.Id.toString(),
          Id: plant.Id.toString()
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPackages.length
        },
        this.buildCsvFiles(),
        5
      );
    },
    async downloadAll() {
      for (const csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPackages.length,
          newLocationName: this.$data.newLocation.Name,
          moveIsodate: this.$data.moveIsodate
        }
      });
    },
    buildCsvFiles(): ICsvFile[] {
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPackages.map((plantData: IPlantData) => plantData.Label)
          },
          { isVector: false, data: this.$data.newLocation.Name },
          { isVector: false, data: this.$data.moveIsodate }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Move ${this.$data.selectedPackages.length} plants to ${this.$data.newLocation.Name}`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    }
  },
  computed: {
    allDetailsProvided() {
      return (
        this.$data.selectedPackages.length > 0 &&
        !!this.$data.newLocation &&
        !!this.$data.moveIsodate
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    }
  },
  data() {
    return {
      builderType: BuilderType.CREATE_TRANSFER,
      activeStepIndex: 0,
      selectedPackages: [],
      newLocation: null,
      moveIsodate: todayIsodate(),
      steps: [
        {
          stepText: "Select packages to transfer"
        },
        {
          stepText: "Transport details"
        },
        {
          stepText: "Submit"
        }
      ]
    };
  },
  async mounted() {},
  async created() {},
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
