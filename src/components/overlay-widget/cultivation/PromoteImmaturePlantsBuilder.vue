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
            class="col-span-2 h-full"
            :builderType="builderType"
            :selectedPlantBatches="selectedPlantBatches"
            v-on:update:selectedPlantBatches="selectedPlantBatches = $event"
          />

          <div class="col-start-2 flex flex-col items-stretch">
            <template v-if="!pageOneErrorMessage">
              <b-button variant="success" size="md" @click="activeStepIndex = 1">
                NEXT
              </b-button>
            </template>

            <template v-else>
              <span class="text-center text-red-700"> {{ pageOneErrorMessage }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 1">
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <div class="flex flex-col items-stretch space-y-8">
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
                  <b-form-select size="md" :options="growthPhaseOptions" v-model="growthPhase" />
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

                    <b-button variant="link" size="sm" @click="promoteMax()">PROMOTE ALL</b-button>
                  </div>
                </b-form-text>
              </template>
            </b-form-group>

            <b-form-group class="w-full" label="Plant Location:" label-size="sm">
              <location-picker
                :location.sync="plantLocation"
                :suggestedLocationName="suggestedLocationName"
              />
            </b-form-group>

            <b-form-group class="w-full" label="Planting Date:" label-size="sm">
              <b-form-datepicker
                initial-date
                size="md"
                v-model="growthIsodate"
                :value="growthIsodate"
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
          <div class="flex flex-col items-stretch space-y-8">
            <template v-if="totalPlantCount && growthPhase && growthIsodate && plantLocation">
              <template v-if="totalPlantCount !== plantTags.length">
                <div class="text-lg font-bold text-center">
                  {{ totalPlantCount }} plant tags required.
                </div>
              </template>

              <b-form-group class="w-full">
                <tag-picker
                  tagTypeName="CannabisPlant"
                  :tagCount="totalPlantCount"
                  :selectedTags="plantTags"
                  v-on:update:selectedTags="plantTags = $event"
                />
              </b-form-group>

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
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 2">
        <div class="flex flex-col items-center">
          <template v-if="!errorMessage">
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Promoting
                <span class="font-bold ttt-purple">{{ totalPlantCount }}</span>
                plants to
                <span class="font-bold ttt-purple">{{ growthPhase.Display }}</span
                >.
              </div>

              <div>
                Uses
                <span class="font-bold ttt-purple">{{ plantTags.length }} plant tags.</span>
              </div>

              <div>
                Location:
                <span class="font-bold ttt-purple">{{ plantLocation.Name }}</span>
              </div>

              <div>
                Growth date:
                <span class="font-bold ttt-purple">{{ growthIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >PROMOTE {{ totalPlantCount }} PLANTS</b-button
              >
            </div>

            <div style="height: 6rem"></div>

            <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()"
              >DOWNLOAD CSVs</b-button
            >

            <csv-breakout class="opacity-40 mt-4" :csvFiles="csvFiles" />
          </template>

          <template v-else>
            <span class="text-center text-red-700">{{ errorMessage }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { mapState } from "vuex";
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import { isValidTag, generateTagRangeOrError, getTagFromOffset } from "@/utils/tags";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { combineLatest, from, Subject, timer } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith, tap } from "rxjs/operators";
import {
  IPackageData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcPromoteImmaturePlantsPayload,
  ITagData,
  IIntermediatePromotePlantBatchData,
  IPlantData,
  IPlantBatchData,
  IBuilderComponentError
} from "@/interfaces";
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import { todayIsodate, submitDateFromIsodate } from "@/utils/date";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import {
  BuilderType,
  GROWTH_PHASES,
  MessageType,
  PLANTABLE_ITEM_CATEGORY_NAMES,
  PLANT_BATCH_TYPES
} from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import PlantBatchPicker from "@/components/overlay-widget/shared/PlantBatchPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import {
  allocateImmaturePlantCounts,
  allocatePromotePlantCounts,
  divideTagsIntoRanges,
  flattenTagsAndPlantBatches
} from "@/utils/misc";
import { safeZip } from "@/utils/array";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";
import { PromoteImmaturePlantsBuilderActions } from "@/store/page-overlay/modules/promote-immature-plants-builder/consts";
import { IPromoteImmaturePlantsBuilderState } from "@/store/page-overlay/modules/promote-immature-plants-builder/interfaces";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";

function totalPlantsAvailableOrNull(plantBatches: IPlantBatchData[]): number | null {
  if (!plantBatches.length) {
    return null;
  }

  return plantBatches
    .map((plantBatch: IPlantBatchData) => plantBatch.UntrackedCount)
    .reduce((a: number, b: number) => a + b, 0);
}

// This component should mirror the vuex model, so casting the type is acceptable
// since Vue struggles to type 'this'
interface PromoteImmaturePlantsBuilderVuexCoupler extends IPromoteImmaturePlantsBuilderState {}

export default Vue.extend({
  name: "PromoteImmaturePlantsBuilder",
  store,
  components: {
    BuilderStepHeader,
    CsvBreakout,
    LocationPicker,
    PlantBatchPicker,
    TagPicker
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
      const rows: IMetrcPromoteImmaturePlantsPayload[] = [];

      const flattened: {
        tag: ITagData;
        plantBatch: IPlantBatchData;
      }[] = flattenTagsAndPlantBatches({
        tags: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags,
        promoteDataList: (this as PromoteImmaturePlantsBuilderVuexCoupler).promoteData
      });

      for (const { tag, plantBatch } of flattened) {
        const row: IMetrcPromoteImmaturePlantsPayload = {
          GrowthDate: submitDateFromIsodate(
            (this as PromoteImmaturePlantsBuilderVuexCoupler).growthIsodate
          ),
          NewLocationId: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantLocation?.Id.toString() as string,
          Id: plantBatch.Id.toString(),
          PlantsCount: "1",
          GrowthPhase: (this as PromoteImmaturePlantsBuilderVuexCoupler).growthPhase
            ?.Display as string,
          StartingTagId: tag.Id.toString(),
          EndingTagId: tag.Id.toString()
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantBatchTotal: (this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches
            .length,
          plantTotal: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags.length
        },
        // @ts-ignore
        this.buildCsvFiles(),
        25
      );
    },
    promoteMax() {
      this.totalPlantCount = totalPlantsAvailableOrNull(
        (this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches
      );
    },
    async downloadAll() {
      // @ts-ignore
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          plantBatchCount: (this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches
            .length,
          plantCount: this.totalPlantCount,
          plantLocationName: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantLocation
            ?.Name as string,
          growthPhase: (this as PromoteImmaturePlantsBuilderVuexCoupler).growthPhase
            ?.Display as string,
          growthIsodate: this.growthIsodate
        }
      });
    },
    buildCsvFiles(): ICsvFile[] {
      // Plant Batch Name
      // Plant Count
      // Starting Tag
      // Growth Phase
      // New Location Name
      // Growth Date
      // Patient License Number
      //
      // ABCDEF012345670000010011,Demo Plant Batch 1,Clone,3,Spring Hill Kush,,X00001,2016-10-18

      const flattened: {
        tag: ITagData;
        plantBatch: IPlantBatchData;
      }[] = flattenTagsAndPlantBatches({
        tags: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags,
        promoteDataList: (this as PromoteImmaturePlantsBuilderVuexCoupler).promoteData
      });

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: flattened.map(({ plantBatch }) => plantBatch.Name)
          },
          {
            isVector: false,
            data: "1"
          },
          {
            isVector: true,
            data: flattened.map(({ tag }) => tag.Label)
          },
          {
            isVector: false,
            data: (this as PromoteImmaturePlantsBuilderVuexCoupler).growthPhase?.Display as string
          },
          {
            isVector: false,
            data: (this as PromoteImmaturePlantsBuilderVuexCoupler).plantLocation?.Name as string
          },
          {
            isVector: false,
            data: (this as PromoteImmaturePlantsBuilderVuexCoupler).growthIsodate
          },
          {
            isVector: false,
            data: (this as PromoteImmaturePlantsBuilderVuexCoupler).patientLicenseNumber
          }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Promoting ${
            this.totalPlantCount
          } plants to ${(this as PromoteImmaturePlantsBuilderVuexCoupler).growthPhase
            ?.Display as string}`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    calculateErrors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];

      if ((this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches.length === 0) {
        errors.push({ tags: ["page1"], message: "Select at least one plant batch" });
      }

      if ((this as PromoteImmaturePlantsBuilderVuexCoupler).totalPlantCount === 0) {
        errors.push({ tags: ["page2"], message: "Promote at least one plant" });
      }

      if ((this as PromoteImmaturePlantsBuilderVuexCoupler).promoteData.length === 0) {
        errors.push({ tags: ["page2"], message: "Promote at least one plant" });
      }

      if (
        (this as PromoteImmaturePlantsBuilderVuexCoupler).totalPlantCount !==
        (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags.length
      ) {
        errors.push({ tags: ["page2"], message: "Select one plant tag for each promoted plant" });
      }

      if (!(this as PromoteImmaturePlantsBuilderVuexCoupler).plantLocation) {
        errors.push({ tags: ["page2"], message: "Select a plant location" });
      }

      if (!(this as PromoteImmaturePlantsBuilderVuexCoupler).growthIsodate) {
        errors.push({ tags: ["page2"], message: "Select a growth date" });
      }

      return errors;
    }
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState
    }),
    pageOneErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page1"))?.message || null
      );
    },
    pageTwoErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page2"))?.message || null
      );
    },
    pageThreeErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page3"))?.message || null
      );
    },
    errorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => true)?.message || null
      );
    },
    errors(): IBuilderComponentError[] {
      // @ts-ignore
      return this.calculateErrors();
    },
    suggestedLocationName() {
      if ((this.selectedPlantBatches as IPlantBatchData[]).length > 0) {
        return (this.selectedPlantBatches as IPlantBatchData[])[0].LocationName;
      }

      return null;
    },
    selectedPlantBatches: {
      get(): IPlantBatchData[] {
        return this.$store.state.promoteImmaturePlantsBuilder.selectedPlantBatches;
      },
      set(selectedPlantBatches: IPlantBatchData[]) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { selectedPlantBatches }
        );
      }
    },
    growthPhase: {
      get(): string | null {
        return this.$store.state.promoteImmaturePlantsBuilder.growthPhase;
      },
      set(growthPhase: string | null) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { growthPhase }
        );
      }
    },
    totalPlantCount: {
      get(): number | null {
        return this.$store.state.promoteImmaturePlantsBuilder.totalPlantCount;
      },
      set(totalPlantCount: number | null) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { totalPlantCount }
        );
      }
    },
    promoteData: {
      get(): IIntermediatePromotePlantBatchData[] {
        return this.$store.state.promoteImmaturePlantsBuilder.promoteData;
      },
      set(promoteData: IIntermediatePromotePlantBatchData[]) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { promoteData }
        );
      }
    },
    plantTags: {
      get(): ITagData[] {
        return this.$store.state.promoteImmaturePlantsBuilder.plantTags;
      },
      set(plantTags: ITagData[]) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { plantTags }
        );
      }
    },
    patientLicenseNumber: {
      get(): string {
        return this.$store.state.promoteImmaturePlantsBuilder.patientLicenseNumber;
      },
      set(patientLicenseNumber: string) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { patientLicenseNumber }
        );
      }
    },
    showTagPicker: {
      get(): boolean {
        return this.$store.state.promoteImmaturePlantsBuilder.showTagPicker;
      },
      set(showTagPicker: boolean) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { showTagPicker }
        );
      }
    },
    growthIsodate: {
      get(): string {
        return this.$store.state.promoteImmaturePlantsBuilder.growthIsodate;
      },
      set(growthIsodate: string) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { growthIsodate }
        );
      }
    },
    plantLocation: {
      get(): ILocationData | null {
        return this.$store.state.promoteImmaturePlantsBuilder.plantLocation;
      },
      set(plantLocation: ILocationData | null) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { plantLocation }
        );
      }
    },
    showHiddenDetailFields: {
      get(): boolean {
        return this.$store.state.promoteImmaturePlantsBuilder.showHiddenDetailFields;
      },
      set(showHiddenDetailFields: boolean) {
        this.$store.dispatch(
          `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA}`,
          { showHiddenDetailFields }
        );
      }
    },
    tagsSelected() {
      return (
        (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags.length > 0 &&
        (this as PromoteImmaturePlantsBuilderVuexCoupler).plantTags.length === this.totalPlantCount
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    maximumTotalPlantCount() {
      return totalPlantsAvailableOrNull(
        (this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches
      );
    }
  },
  watch: {
    totalPlantCount: {
      immediate: true,
      handler(newValue, oldValue) {
        if (
          !newValue ||
          !(this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches.length
        ) {
          this.promoteData = [];
          return;
        }

        this.promoteData = allocatePromotePlantCounts(
          newValue,
          (this as PromoteImmaturePlantsBuilderVuexCoupler).selectedPlantBatches
        );
      }
    }
  },
  data() {
    return {
      builderType: BuilderType.PROMOTE_IMMATURE_PLANTS,
      activeStepIndex: 0,
      steps: [
        {
          stepText: "Select plant batches to promote"
        },
        {
          stepText: "Plant details"
        },
        {
          stepText: "Submit"
        }
      ],
      growthPhaseOptions: []
    };
  },
  async created() {
    // Eagerly load the tags
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));

    this.$data.growthPhaseOptions = (
      await dynamicConstsManager.plantBatchGrowthPhases()
    ).map((x: any) => ({ text: x.Display, value: x }));
    this.growthPhase = this.$data.growthPhaseOptions[0].value;
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
