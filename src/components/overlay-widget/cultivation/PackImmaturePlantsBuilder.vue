<template>
  <div class="grid grid-cols-3 gap-8 h-full" style="grid-template-rows: auto 1fr">
    <builder-step-header
      v-for="(step, index) of steps"
      :key="index"
      :stepNumber="index + 1"
      :stepText="step.stepText"
      :active="index === activeStepIndex"
      @click.stop.prevent.native="setActiveStepIndex(index)"
    />

    <div class="col-span-3 h-full">
      <template v-if="activeStepIndex === 0">
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <plant-batch-picker
            class="col-span-2"
            :builderType="builderType"
            :selectedPlantBatches.sync="selectedPlantBatches"
          />

          <div class="col-start-2 flex flex-col items-stretch">
            <template v-if="!pageOneErrorMessage">
              <b-button variant="success" size="md" @click="activeStepIndex = 1"> NEXT </b-button>
            </template>

            <template v-else>
              <span class="text-center text-red-700"> {{ pageOneErrorMessage }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 1">
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <div class="w-full items-stretch flex flex-col space-y-4 p-4">
            <item-picker
              :item.sync="item"
              :itemFilters="itemFilters"
              :selectOwnedItems="true"
              label="New packages contain:"
            />

            <template v-if="item">
              <b-form-group label="Package Date:" label-size="sm">
                <b-form-datepicker
                  initial-date
                  size="md"
                  v-model="packageDate"
                  :value="packageDate"
                />
              </b-form-group>

              <template v-if="facilityUsesLocationForPackages">
                <b-form-group class="w-full" label="Location:" label-size="sm">
                  <location-picker :location.sync="location" />
                </b-form-group>
              </template>

              <template v-if="showHiddenDetailFields">
                <b-form-group label="Note: (optional)" label-size="sm">
                  <b-form-input size="md" v-model="note"></b-form-input>
                </b-form-group>

                <!-- Defaulting to false, will fix in future -->
                <!-- <b-form-checkbox
                  size="md"
                  class="text-lg"
                  v-model="isDonation"
                  value="True"
                  unchecked-value="False"
                >
                  Donation
                </b-form-checkbox>

                <b-form-checkbox
                  size="md"
                  class="text-lg"
                  v-model="isTradeSample"
                  value="True"
                  unchecked-value="False"
                >
                  Trade Sample
                </b-form-checkbox> -->

                <b-form-group
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
            </template>
          </div>

          <div class="w-full items-stretch flex flex-col space-y-4 p-4">
            <template v-if="!pageTwoPreTagErrorMessage">
              <template v-if="showTagPicker">
                <div class="flex flex-col space-y-8 items-center">
                  <div class="text-lg font-bold">
                    {{ selectedPlantBatchesCount }} tags required.
                  </div>
                </div>

                <tag-picker
                  :tagTypeNames="['CannabisPackage', 'MedicalPackage']"
                  :tagCount="selectedPlantBatchesCount"
                  :selectedTags.sync="packageTags"
                />

                <div class="col-start-2 flex flex-col items-stretch">
                  <template v-if="!pageTwoErrorMessage">
                    <b-button variant="success" size="md" @click="activeStepIndex = 2">
                      NEXT
                    </b-button>
                  </template>

                  <template v-else>
                    <span class="text-center text-red-700"> {{ pageTwoErrorMessage }}</span>
                  </template>
                </div>
              </template>
            </template>
            <template v-else>
              <span class="text-center text-red-700"> {{ pageTwoPreTagErrorMessage }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 2">
        <div class="w-full items-stretch flex flex-col p-4">
          <template v-if="!errorMessage">
            <div class="flex flex-col items-center">
              <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
                <div>
                  Creates
                  <span class="font-bold ttt-purple"
                    >{{ selectedPlantBatchesCount }} packages.</span
                  >
                </div>

                <div>
                  Uses
                  <span class="font-bold ttt-purple">{{ packageTags.length }} package tags.</span>
                </div>

                <div>
                  Package Date:
                  <span class="font-bold ttt-purple">{{ packageDate }}</span>
                </div>

                <div style="height: 3rem"></div>

                <b-button class="w-full" variant="success" size="md" @click="submit()"
                  >PACKAGE {{ selectedPlantBatchesCount }} {{ "PLANT BATCHES" }}</b-button
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
            <span class="text-center text-red-700">{{
              pageThreeErrorMessage || errorMessage
            }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";
import ItemPicker from "@/components/overlay-widget/shared/ItemPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import PlantBatchPicker from "@/components/overlay-widget/shared/PlantBatchPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import { BuilderType, MessageType, PLANTABLE_ITEM_CATEGORY_NAMES } from "@/consts";
import {
  IBuilderComponentError,
  ICsvFile,
  IMetrcCreatePlantBatchPackagesFromImmaturePlantBatchPayload,
  IPlantBatchData,
  ITagData,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from "@/utils/csv";
import { submitDateFromIsodate, todayIsodate } from "@/utils/date";
import { timer } from "rxjs";
import Vue from "vue";

export default Vue.extend({
  name: "PackImmaturePlantsPackageBuilder",
  store,
  components: {
    BuilderStepHeader,
    PlantBatchPicker,
    ItemPicker,
    TagPicker,
    LocationPicker,
    CsvBreakout,
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
      const rows: IMetrcCreatePlantBatchPackagesFromImmaturePlantBatchPayload[] = [];

      this.$data.packageTags.map((tag: ITagData, i: number) => {
        const plantBatch: IPlantBatchData = this.$data.selectedPlantBatches[i];
        const row: IMetrcCreatePlantBatchPackagesFromImmaturePlantBatchPayload = {
          ActualDate: submitDateFromIsodate(this.$data.packageDate),
          Count: plantBatch.UntrackedCount.toString(),
          ItemId: this.$data.item.Id.toString(),
          Note: this.$data.note,
          PlantBatchId: plantBatch.Id.toString(),
          TagId: tag.Id.toString(),
          ...(this.$data.facilityUsesLocationForPackages
            ? {
              LocationId: this.$data.location.Id.toString(),
            }
            : {}),
        };
        rows.push(row);
      });

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantBatchName: this.$data.selectedPlantBatches.map(
            (batch: IPlantBatchData) => batch.Name
          ),
          itemName: this.$data.item.Name,
          tag: this.$data.packageTags.map((tag: ITagData) => tag.Label),
          patientLicenseNumber: this.$data.patientLicenseNumber,
          note: this.$data.note,
          tradeSample: this.$data.isTradeSample,
          donation: this.$data.isDonation,
          plantCount: this.$data.selectedPlantBatches.map(
            (batch: IPlantBatchData) => batch.UntrackedCount
          ),
          location: this.$data.facilityUsesLocationForPackages ? this.$data.location.Name : "",
          actualDate: this.$data.packageDate,
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
          plantBatchName: this.$data.selectedPlantBatches.map(
            (batch: IPlantBatchData) => batch.Name
          ),
          itemName: this.$data.item.Name,
          tag: this.$data.packageTags.map((tag: ITagData) => tag.Label),
          patientLicenseNumber: this.$data.patientLicenseNumber,
          note: this.$data.note,
          tradeSample: this.$data.isTradeSample,
          donation: this.$data.isDonation,
          plantCount: this.$data.selectedPlantBatches.map(
            (batch: IPlantBatchData) => batch.UntrackedCount
          ),
          location: this.$data.facilityUsesLocationForPackages ? this.$data.location.Name : "",
          actualDate: this.$data.packageDate,
        },
      });
    },
    buildCsvFiles(): ICsvFile[] {
      // Immature Plants Packages
      //
      // Plant Batch Name
      // Item Name
      // Tag
      // Patient License Number
      // Note
      // Trade Sample
      // Donation
      // Plant Count
      // Location
      // Actual Date
      //
      // Demo Plant Batch 1,Immature Plants,ABCDEF012345670000020201,P00001,This is a note.,False,False,10,,2015-12-15

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPlantBatches.map((batch: IPlantBatchData) => batch.Name),
          },
          {
            isVector: false,
            data: this.$data.item.Name,
          },
          {
            isVector: true,
            data: this.$data.packageTags.map((tag: ITagData) => tag.Label),
          },
          {
            isVector: false,
            data: this.$data.patientLicenseNumber,
          },
          {
            isVector: false,
            data: this.$data.note,
          },
          {
            isVector: false,
            data: this.$data.isTradeSample,
          },
          {
            isVector: false,
            data: this.$data.isDonation,
          },
          {
            isVector: true,
            data: this.$data.selectedPlantBatches.map(
              (batch: IPlantBatchData) => batch.UntrackedCount
            ),
          },
          {
            isVector: false,
            data: this.$data.facilityUsesLocationForPackages ? this.$data.location.Name : "",
          },
          {
            isVector: false,
            data: this.$data.packageDate,
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Packaging ${this.selectedPlantBatchesCount} immature plant batches`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  computed: {
    selectedPlantBatchesCount(): number {
      return this.$data.selectedPlantBatches ? this.$data.selectedPlantBatches.length : null;
    },
    pageOneErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page1"))?.message || null
      );
    },
    pageTwoPreTagErrorMessage(): string | null {
      return (
        this.errors.find(
          (x: IBuilderComponentError) => x.tags.includes("page2") && !x.tags.includes("tagging")
        )?.message || null
      );
    },
    pageTwoErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page2"))?.message || null
      );
    },
    pageThreeErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page3"))?.message || null
      );
    },
    errorMessage(): string | null {
      return this.errors.find((x: IBuilderComponentError) => true)?.message || null;
    },
    errors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];

      if (this.selectedPlantBatches.length === 0) {
        errors.push({
          tags: ["page1"],
          message: "Select one or more immature plant batches",
        });
      }

      if (!this.item) {
        errors.push({
          tags: ["page2"],
          message: "Select the new package item",
        });
      }

      if (!this.location && this.$data.facilityUsesLocationForPackages) {
        errors.push({
          tags: ["page2"],
          message: "Select the new package location",
        });
      }

      if (this.selectedPlantBatches.length === 0) {
        errors.push({
          tags: ["page2"],
          message: "Select immature plants for your new packages",
        });
      }

      if (this.$data.packageTags.length === 0) {
        errors.push({
          tags: ["page2", "tagging"],
          message: "Select package tags for your new packages",
        });
      }

      if (this.$data.packageTags.length !== this.selectedPlantBatches.length) {
        errors.push({
          tags: ["page2", "tagging"],
          message: "You must select one package tag for each new package",
        });
      }

      if (!this.item) {
        errors.push({
          tags: ["page2"],
          message: "Specify an item for new packages",
        });
      }

      if (!this.packageDate) {
        errors.push({ tags: ["page2"], message: "Specify a package date" });
      }

      return errors;
    },
    tagsSelected(): boolean {
      return (
        this.$data.packageTags.length > 0 &&
        this.$data.packageTags.length === this.selectedPlantBatchesCount
      );
    },
    csvFiles(): ICsvFile[] {
      return this.buildCsvFiles();
    },
  },
  watch: {},
  data() {
    return {
      builderType: BuilderType.PACK_IMMATURE_PLANTS,
      activeStepIndex: 0,
      selectedPlantBatches: [],
      packageDate: todayIsodate(),
      packageTags: [],
      item: null,
      location: null,
      facilityUsesLocationForPackages: false,
      showHiddenDetailFields: false,
      patientLicenseNumber: "",
      note: "",
      isTradeSample: "False",
      isDonation: "False",
      showTagPicker: true,
      steps: [
        {
          stepText: "Select immature plants",
        },
        {
          stepText: "Package details",
        },
        {
          stepText: "Submit",
        },
      ],
      itemFilters: {
        // 'Seeds' is weight based, which we can't handle here
        itemCategory: PLANTABLE_ITEM_CATEGORY_NAMES.filter((x) => x !== "Seeds"),
      },
    };
  },
  async created() {
    // Eagerly load the tags
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));

    this.$data.facilityUsesLocationForPackages =
      await dynamicConstsManager.facilityUsesLocationForPackages();
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
