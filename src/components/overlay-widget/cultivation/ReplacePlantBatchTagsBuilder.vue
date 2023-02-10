<template>
  <div class="w-full flex flex-col items-stretch flex-grow space-y-4">
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
      <plant-batch-picker
        class="col-span-2"
        :builderType="builderType"
        :selectedPlantBatches.sync="selectedPlantBatches"
      />

      <template v-if="selectedPlantBatches.length > 0">
        <div class="w-full flex flex-row justify-end">
          <b-button class="w-1/2" variant="success" size="md" @click="activeStepIndex = 1">
            NEXT
          </b-button>
        </div>
      </template>
    </template>

    <template v-if="activeStepIndex === 1">
      <div class="w-full grid grid-cols-2">
        <div class="flex flex-col items-center space-y-4">
          <b-form-group class="w-full" label="Retagging Date:" label-size="sm">
            <b-form-datepicker
              initial-date
              size="md"
              v-model="actualIsodate"
              :value="actualIsodate"
            />
          </b-form-group>
        </div>

        <div class="flex flex-col items-center space-y-4">
          <template v-if="allDetailsProvided">
            <template v-if="!tagsSelected">
              <div class="text-lg font-bold">
                {{ selectedPlantBatches.length }} plant tags required.
              </div>
            </template>

            <b-form-group class="w-full">
              <tag-picker
                :tagTypeNames="['CannabisPlant', 'MedicalPlant']"
                :tagCount="selectedPlantBatches.length"
                :selectedTags.sync="plantBatchTags"
              />
            </b-form-group>

            <template v-if="allDetailsProvided && tagsSelected">
              <b-button class="w-full" variant="success" size="md" @click="activeStepIndex = 2">
                NEXT
              </b-button>
            </template>
          </template>
          <!-- </template> -->
        </div>
      </div>
    </template>

    <template v-if="activeStepIndex === 2">
      <div class="flex-grow" style="height: 35vh">
        <template v-if="allDetailsProvided && tagsSelected">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Retagging
                <span class="font-bold ttt-purple">{{ selectedPlantBatches.length }}</span>
                plants.
              </div>

              <div>
                Retag date:
                <span class="font-bold ttt-purple">{{ actualIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >RETAG {{ selectedPlantBatches.length }} PLANT BATCHES</b-button
              >

              <!-- <div style="height: 6rem"></div>

              <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()"
                >DOWNLOAD CSVs</b-button
              >

              <csv-breakout class="opacity-40 mt-4" :csvFiles="csvFiles" /> -->
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="selectedPlantBatches.length === 0">Total plant count is 0</span>
            <span v-if="plantBatchTags.length === 0">No tags provided</span>
            <span
              v-if="
                selectedPlantBatches.length > 0 &&
                selectedPlantBatches.length !== plantBatchTags.length
              "
              >Incorrect number of tags provided</span
            >
            <span v-if="!actualIsodate">Retag date not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import PlantBatchPicker from "@/components/overlay-widget/shared/PlantBatchPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import { BuilderType, MessageType } from "@/consts";
import {
  ICsvFile,
  IMetrcReplacePlantBatchTagsPayload,
  IPlantBatchData,
  ITagData,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import { safeZip } from "@/utils/array";
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from "@/utils/csv";
import { submitDateFromIsodate, todayIsodate } from "@/utils/date";
import { timer } from "rxjs";
import Vue from "vue";

export default Vue.extend({
  name: "ReplacePlantBatchTagsBuilder",
  store,
  components: {
    BuilderStepHeader,
    PlantBatchPicker,
    TagPicker,
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    submit() {
      const rows: IMetrcReplacePlantBatchTagsPayload[] = [];

      // @ts-ignore
      const zipped: [ITagData, IPlantBatchData][] = safeZip(
        this.$data.plantBatchTags,
        this.$data.selectedPlantBatches
      );

      for (let el of zipped) {
        const tag = el[0];
        const plantBatch = el[1];

        const row = {
          ActualDate: submitDateFromIsodate(this.$data.actualIsodate),
          Id: plantBatch.Id.toString(),
          TagId: tag.Id.toString(),
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPlantBatches.length,
        },
        this.buildCsvFiles(),
        5
      );
    },
    async downloadAll() {
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          plantCount: this.$data.selectedPlantBatches.length,
        },
      });
    },
    buildCsvFiles(): ICsvFile[] {
      // Package Label
      // Package Adjustment Amount
      // Package Adjustment Unit of Measure
      // Plant Batch Name
      // Plant Batch Type
      // Plant Count
      // Strain Name
      // Location Name
      // Patient License Number
      // Planted Date
      // Unpackaged Date
      //
      // ABCDEF012345670000010011,Demo Plant Batch 1,Clone,3,Spring Hill Kush,,X00001,2016-10-18
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPlantBatches.map(
              (plantBatch: IPlantBatchData) => plantBatch.Name
            ),
          },
          {
            isVector: true,
            data: this.$data.plantBatchTags.map((tag: ITagData) => tag.Label),
          },
          { isVector: false, data: this.$data.actualIsodate },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Retagging ${this.$data.selectedPlantBatches} plant batches`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  computed: {
    allDetailsProvided() {
      return this.$data.selectedPlantBatches.length > 0 && !!this.$data.actualIsodate;
    },
    tagsSelected() {
      return (
        this.$data.plantBatchTags.length > 0 &&
        this.$data.plantBatchTags.length === this.$data.selectedPlantBatches.length
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
  },
  watch: {},
  data() {
    return {
      builderType: BuilderType.REPLACE_PLANT_TAGS,
      activeStepIndex: 0,
      selectedPlantBatches: [],
      actualIsodate: todayIsodate(),
      plantBatchTags: [],
      steps: [
        {
          stepText: "Select plant batches to retag",
        },
        {
          stepText: "Tagging details",
        },
        {
          stepText: "Submit",
        },
      ],
    };
  },
  async created() {
    // Eagerly load the tags
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
