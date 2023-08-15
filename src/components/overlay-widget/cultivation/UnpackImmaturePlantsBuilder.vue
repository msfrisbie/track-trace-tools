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
      <package-picker
        :builderType="builderType"
        :selectedPackages.sync="selectedPackages"
        :itemFilters="itemFilters"
        :packageFilters="{
          isEmpty: false,
        }"
        itemFilterZeroResultsErrorSuggestionMessage="Only packages of clones or
      seeds can be used here."
      />

      <template v-if="selectedPackages.length > 0">
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
          <!-- <template v-if="!showTagPicker"> -->
          <b-form-group class="w-full" label="Configure plants:" label-size="sm">
            <b-input-group>
              <b-form-input
                v-model.number="totalPlantCount"
                type="number"
                size="md"
                step="1"
                min="1"
                :max="maximumTotalPlantCount"
                required
                class="text-center"
              ></b-form-input>

              <b-input-group-append>
                <b-form-select size="md" :options="plantBatchTypeOptions" v-model="plantBatchType">
                  <template #first>
                    <b-form-select-option :value="null" disabled>--</b-form-select-option>
                  </template>
                </b-form-select>
              </b-input-group-append>
            </b-input-group>

            <template v-if="maximumTotalPlantCount && maximumTotalPlantCount < totalPlantCount">
              <b-form-invalid-feedback>
                Warning: planting total exceeds total quantity available
              </b-form-invalid-feedback>
            </template>

            <template v-if="maximumTotalPlantCount">
              <b-form-text
                ><div class="flex flex-row items-center space-x-2">
                  <span>Total # available: {{ maximumTotalPlantCount }}</span>

                  <b-button variant="link" size="sm" @click="plantMax()">PLANT ALL</b-button>
                </div>
              </b-form-text>
            </template>
          </b-form-group>

          <b-form-group class="w-full" label-size="sm">
            <strain-picker
              :strain.sync="strain"
              :enableHotStrainCreate="true"
              :suggestedStrainName="suggestedStrainName"
            />
          </b-form-group>

          <b-form-group class="w-full" label="Planting Location:" label-size="sm">
            <location-picker
              :location.sync="plantingLocation"
              :suggestedLocationName="suggestedLocationName"
            />
          </b-form-group>

          <b-form-group class="w-full" label="Planting Date:" label-size="sm">
            <b-form-datepicker
              initial-date
              size="md"
              v-model="plantingIsodate"
              :value="plantingIsodate"
            />
          </b-form-group>

          <template v-if="showHiddenDetailFields">
            <b-form-group
              class="w-full"
              label="Unpackaging Date:"
              description="Leave this alone unless you are sure you need to change it"
              label-size="sm"
            >
              <b-form-datepicker
                initial-date
                size="md"
                v-model="actualIsodate"
                :value="actualIsodate"
              />
            </b-form-group>

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

          <!-- <template v-if="allDetailsProvided">
              <b-button class="w-full" variant="success" size="md" @click="showTagPicker = true">
                NEXT
              </b-button>
            </template>
          </template> -->
        </div>
        <div class="flex flex-col items-center space-y-4">
          <!-- <template v-if="showTagPicker"> -->
          <!-- <b-button variant="light" size="md" @click="showTagPicker = false">
              BACK
            </b-button> -->

          <template v-if="allDetailsProvided">
            <template v-if="!tagsSelected">
              <div class="text-lg font-bold">{{ plantingData.length }} plant tags required.</div>
            </template>

            <b-form-group class="w-full">
              <tag-picker
                :tagTypeNames="['CannabisPlant', 'MedicalPlant']"
                :tagCount="plantingData.length"
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
        <template v-if="allDetailsProvided">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Planting
                <span class="font-bold ttt-purple">{{ totalPlantCount }}</span>
                plants from
                <span class="font-bold ttt-purple">{{ selectedPackages.length }}</span>
                packages.
              </div>

              <div>
                Uses
                <span class="font-bold ttt-purple">{{ plantBatchTags.length }} plant tags.</span>
              </div>

              <div>
                Strain:
                <span class="font-bold ttt-purple">{{ strain.Name }}</span>
              </div>

              <div>
                Location:
                <span class="font-bold ttt-purple">{{ plantingLocation.Name }}</span>
              </div>

              <div>
                Planting date:
                <span class="font-bold ttt-purple">{{ plantingIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >UNPACK {{ totalPlantCount }} PLANTS</b-button
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

            <span v-if="totalPlantCount === 0">Total plant count is 0</span>
            <span v-if="selectedPackages.length === 0">No packages selected</span>
            <span v-if="plantingData.length === 0">No planting data provided</span>
            <span v-if="plantBatchTags.length === 0">No tags provided</span>
            <span v-if="plantingData.length > 0 && plantBatchTags.length !== plantingData.length"
              >Incorrect number of tags provided</span
            >
            <span v-if="!plantingLocation">Planting location not provided</span>
            <span v-if="!strain">Strain not provided</span>
            <span v-if="!plantingIsodate">Planting date not provided</span>
            <span v-if="!actualIsodate">Unpackaging date not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import PackagePicker from "@/components/overlay-widget/shared/PackagePicker.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import { BuilderType, MessageType, PLANTABLE_ITEM_CATEGORY_NAMES } from "@/consts";
import {
  ICsvFile,
  IIntermediateCreatePlantBatchFromPackageData,
  IMetrcUnpackImmaturePlantsPayload,
  IPackageData,
  IPlantBatchType,
  ITagData,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { safeZip } from "@/utils/array";
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from "@/utils/csv";
import { submitDateFromIsodate, todayIsodate } from "@/utils/date";
import { allocateImmaturePlantCounts } from "@/utils/misc";
import { timer } from "rxjs";
import Vue from "vue";

function totalPlantsAvailableOrNull(packages: IPackageData[]): number | null {
  if (!packages.length) {
    return null;
  }

  if (packages[0].Item.UnitOfMeasureName !== "Each") {
    return null;
  }

  return packages
    .map((pkg: IPackageData) => pkg.Quantity)
    .reduce((a: number, b: number) => a + b, 0);
}

export default Vue.extend({
  name: "UnpackImmaturePlantsBuilder",
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout,
    LocationPicker,
    PackagePicker,
    StrainPicker,
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
      const rows: IMetrcUnpackImmaturePlantsPayload[] = [];

      // @ts-ignore
      const zipped: [ITagData, IIntermediateCreatePlantBatchFromPackageData][] = safeZip(
        this.$data.plantBatchTags,
        this.$data.plantingData
      );

      for (let el of zipped) {
        const tag = el[0];
        const plantingData = el[1];

        const row = {
          ActualDate: submitDateFromIsodate(this.$data.actualIsodate),
          PlantedDate: submitDateFromIsodate(this.$data.plantingIsodate),
          LocationId: this.$data.plantingLocation.Id.toString(),
          PackageId: plantingData.pkg.Id.toString(),
          PlantsCount: plantingData.count.toString(),
          Quantity: plantingData.quantity.toString(),
          // PlantBatchType: this.$data.plantBatchType,
          PlantBatchTypeId: this.$data.plantBatchType.Id.toString(),
          StrainId: this.$data.strain.Id.toString(),
          TagId: tag.Id.toString(),
          UnitOfMeasureId: plantingData.unitOfMeasureId.toString(),
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPackages.length,
        },
        this.buildCsvFiles(),
        5
      );
    },
    plantMax() {
      this.$data.totalPlantCount = totalPlantsAvailableOrNull(this.$data.selectedPackages);
    },
    async downloadAll() {
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          packageCount: this.$data.selectedPackages.length,
          plantCount: this.$data.totalPlantCount,
          plantingLocationName: this.$data.plantingLocation.Name,
          strainName: this.$data.strain.Name,
          plantingIsodate: this.$data.plantingIsodate,
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
            data: this.$data.plantingData.map(
              (plantingData: IIntermediateCreatePlantBatchFromPackageData) => plantingData.pkg.Label
            ),
          },
          {
            isVector: true,
            data: this.$data.plantingData.map(
              (plantingData: IIntermediateCreatePlantBatchFromPackageData) => plantingData.quantity
            ),
          },
          {
            isVector: true,
            data: this.$data.plantingData.map(
              (plantingData: IIntermediateCreatePlantBatchFromPackageData) =>
                plantingData.pkg.Item.UnitOfMeasureName
            ),
          },
          {
            isVector: true,
            data: this.$data.plantBatchTags.map((tagData: ITagData) => tagData.Label),
          },
          {
            isVector: false,
            data: this.$data.plantBatchType.Name,
          },
          {
            isVector: true,
            data: this.$data.plantingData.map(
              (plantingData: IIntermediateCreatePlantBatchFromPackageData) => plantingData.count
            ),
          },
          {
            isVector: false,
            data: this.$data.strain.Name,
          },
          {
            isVector: false,
            data: this.$data.plantingLocation.Name,
          },
          {
            isVector: false,
            data: this.$data.patientLicenseNumber,
          },
          { isVector: false, data: this.$data.plantingIsodate },
          { isVector: false, data: this.$data.actualIsodate },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Planting ${this.$data.totalPlantCount} ${this.$data.strain.Name} plants from ${this.$data.selectedPackages.length} packages`
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
        this.$data.selectedPackages.length > 0 &&
        this.$data.plantingData.length > 0 &&
        !!this.$data.totalPlantCount &&
        this.$data.totalPlantCount > 0 &&
        !!this.$data.plantingLocation &&
        !!this.$data.strain &&
        !!this.$data.plantingIsodate &&
        !!this.$data.actualIsodate
      );
    },
    tagsSelected() {
      return (
        this.$data.plantBatchTags.length > 0 &&
        this.$data.plantBatchTags.length === this.$data.plantingData.length
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    maximumTotalPlantCount() {
      return totalPlantsAvailableOrNull(this.$data.selectedPackages);
    },
    suggestedStrainName() {
      if (this.$data.selectedPackages.length > 0) {
        return this.$data.selectedPackages[0].Item.StrainName;
      }

      return null;
    },
    suggestedLocationName() {
      if (this.$data.selectedPackages.length > 0) {
        return this.$data.selectedPackages[0].LocationName;
      }

      return null;
    },
  },
  watch: {
    totalPlantCount: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue || !this.$data.selectedPackages.length) {
          this.$data.plantingData = [];
          return;
        }

        try {
          this.$data.plantingData = allocateImmaturePlantCounts(
            newValue,
            this.$data.selectedPackages
          );
        } catch (e) {
          toastManager.openToast(`Failed to allocate plants: ${(e as Error).toString()}`, {
            title: "Plant Allocation Error",
            autoHideDelay: 5000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          });
        }
      },
    },
  },
  data() {
    return {
      builderType: BuilderType.UNPACK_IMMATURE_PLANTS,
      activeStepIndex: 0,
      selectedPackages: [],
      plantingLocation: null,
      plantingIsodate: todayIsodate(),
      actualIsodate: todayIsodate(),
      totalPlantCount: 0,
      plantingData: [],
      plantBatchTags: [],
      strain: null,
      showHiddenDetailFields: false,
      patientLicenseNumber: "",
      showTagPicker: false,
      steps: [
        {
          stepText: "Select packages to plant",
        },
        {
          stepText: "Planting details",
        },
        {
          stepText: "Submit",
        },
      ],
      itemFilters: {
        itemCategory: PLANTABLE_ITEM_CATEGORY_NAMES,
      },
      plantBatchType: null,
      plantBatchTypeOptions: [],
    };
  },
  async created() {
    // Eagerly load the tags
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));

    this.$data.plantBatchTypeOptions = (await dynamicConstsManager.plantBatchTypes()).map(
      (x: IPlantBatchType) => ({ text: x.Name + "s", value: x })
    );
    this.$data.plantBatchType = this.$data.plantBatchTypeOptions[0].value;
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
