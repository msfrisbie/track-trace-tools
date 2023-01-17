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
        <plant-picker :enableVegetative="true" :builderType="builderType" :selectedPlants.sync="selectedPlants" />

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
          <div class="flex flex-col items-center">
            <div class="flex flex-col items-center space-y-4">
              <b-form-group class="w-full" label="Waste Method:" label-size="sm">
                <b-form-select size="md" :options="wasteMethodOptions" v-model="wasteMethod" />
              </b-form-group>

              <b-form-group class="w-full" label="Waste Reason:" label-size="sm">
                <b-form-select size="md" :options="wasteReasonOptions" v-model="wasteReason" />
              </b-form-group>

              <b-form-group class="w-full" label="Reason:" label-size="sm">
                <b-form-input size="md" v-model="reasonNote"></b-form-input>
              </b-form-group>

              <b-form-group class="w-full" label="Destroy Date:" label-size="sm">
                <b-form-datepicker
                  initial-date
                  v-model="destroyPlantsIsodate"
                  :value="destroyPlantsIsodate"
                  size="md"
                />
              </b-form-group>

              <template v-if="showHiddenDetailFields">
                <b-form-group
                  class="w-full"
                  label="Waste Material Mixed:"
                  description="Leave this alone unless you are sure you need to change it"
                  label-size="sm"
                >
                  <b-form-input size="md" v-model="wasteMaterialMixed"></b-form-input>
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
              :plantWeights.sync="destroyedWeights"
            />

            <template v-if="!allPlantsHaveValidWeight">
              <p class="text-red-500">
                One or more plants is missing a weight value.
              </p>
            </template>

            <template v-if="allDetailsProvided">
              <div class="w-full">
                <b-button class="w-full" variant="success" size="md" @click="activeStepIndex = 2">
                  NEXT
                </b-button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeStepIndex === 2">
      <div class="flex-grow" style="height: 35vh">
        <template v-if="selectedPlants.length > 0 && allDetailsProvided">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-2 text-xl pt-6" style="width: 600px">
              <div>
                Destroying
                <span class="font-bold ttt-purple"
                  >{{ totalDestroyedWeight }} {{ unitOfWeight.Name }}</span
                >
                from
                <span class="font-bold ttt-purple">{{ selectedPlants.length }}</span>
                plants.
              </div>

              <div>
                Average per plant waste:
                <span class="font-bold ttt-purple"
                  >{{ averagePerPlantWaste }} {{ unitOfWeight.Name }}</span
                >
              </div>

              <div>
                Waste Method:
                <span class="font-bold ttt-purple">{{ wasteMethod.Name }}</span>
              </div>

              <div>
                Waste Reason:
                <span class="font-bold ttt-purple">{{ wasteReason.Name }}</span>
              </div>

              <div>
                Note:
                <span class="font-bold ttt-purple">{{ reasonNote }}</span>
              </div>

              <div>
                Destroy date:
                <span class="font-bold ttt-purple">{{ destroyPlantsIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >DESTROY {{ selectedPlants.length }} PLANTS</b-button
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
            <span v-if="!wasteReason.Name">Waste reason not provided</span>
            <span v-if="!wasteMethod.Name">Waste reason not provided</span>
            <span v-if="!unitOfWeight.Name">Unit of weight not provided</span>
            <span v-if="!destroyPlantsIsodate">Destroy date not provided</span>
            <span v-if="!totalDestroyedWeight">Total destroyed weight not provided</span>
            <span v-if="!reasonNote">Reason note not provided</span>
            <span v-if="!wasteMaterialMixed">Waste material mixed not provided</span>
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
import { normalDistribution } from "@/utils/math";
import { arrayIsValid } from "@/utils/array";
import { IPlantData, ICsvFile, IMetrcDestroyPlantsPayload } from "@/interfaces";
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";

import { todayIsodate, submitDateFromIsodate } from "@/utils/date";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { BuilderType, MessageType } from "@/consts";
import { builderManager } from "@/modules/builder-manager.module";
import PlantPicker from "@/components/overlay-widget/shared/PlantPicker.vue";
import PlantWeightPicker from "@/components/overlay-widget/shared/PlantWeightPicker.vue";
import CsvBreakout from "@/components/overlay-widget/shared/CsvBreakout.vue";
import { sum } from "lodash";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";

export default Vue.extend({
  name: "DestroyPlantsBuilder",
  store,
  components: {
    BuilderStepHeader,
    PlantPicker,
    PlantWeightPicker,
    CsvBreakout
  },
  methods: {
    selectPlants(selectedPlants: IPlantData[]) {
      this.$data.selectedPlants = selectedPlants;
    },
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`
      });
    },
    submit() {
      const rows: IMetrcDestroyPlantsPayload[] = [];

      for (let i = 0; i < this.$data.selectedPlants.length; ++i) {
        const plant: IPlantData = this.$data.selectedPlants[i];
        const weight: number = this.$data.destroyedWeights[i];

        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.destroyPlantsIsodate),
          PlantWasteMethodId: this.$data.wasteMethod.Id.toString(),
          WasteReasonId: this.$data.wasteReason.Id.toString(),
          ReasonNote: this.$data.reasonNote,
          MaterialMixed: this.$data.wasteMaterialMixed,
          Id: plant.Id.toString(),
          WasteWeight: weight.toString(),
          WasteUnitOfMeasureId: this.$data.unitOfWeight.Id.toString()
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          plantTotal: this.$data.selectedPlants.length,
          totalDestroyedWeight: sum(this.$data.destroyedWeights),
          unitOfWeight: this.$data.unitOfWeight.Name
        },
        this.buildCsvFiles(),
        25
      );
    },
    async downloadAll() {
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPlants.length,
          totalDestroyedWeight: sum(this.$data.destroyedWeights),
          unitOfWeight: this.$data.unitOfWeight.Name,
          destroyIsodate: this.$data.destroyPlantsIsodate
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
          { isVector: false, data: this.$data.wasteMethod.Name },
          { isVector: false, data: this.$data.wasteMaterialMixed },
          { isVector: true, data: this.$data.destroyedWeights },
          { isVector: false, data: this.$data.unitOfWeight.Name },
          { isVector: false, data: this.$data.wasteReason.Name },
          { isVector: false, data: this.$data.reasonNote },
          { isVector: false, data: this.$data.destroyPlantsIsodate }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Waste ${sum(this.$data.destroyedWeights)} ${this.$data.unitOfWeight.Name} from ${
            this.$data.selectedPlants.length
          } plants`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    allPlantsHaveValidWeightImpl() {
      return arrayIsValid(this.$data.destroyedWeights, {
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
    totalDestroyedWeight() {
      return sum(this.$data.destroyedWeights).toFixed(3);
    },
    weightOptions() {
      return this.$data.unitsOfWeight.map((unitOfWeight: any) => ({
        text: unitOfWeight.Name,
        value: unitOfWeight
      }));
    },
    wasteReasonOptions() {
      return this.$data.wasteReasons.map((wasteReason: any) => ({
        text: wasteReason.Name,
        value: wasteReason
      }));
    },
    wasteMethodOptions() {
      return this.$data.wasteMethods.map((wasteMethod: any) => ({
        text: wasteMethod.Name,
        value: wasteMethod
      }));
    },
    averagePerPlantWaste() {
      return parseFloat(
        (sum(this.$data.destroyedWeights) / this.$data.selectedPlants.length).toFixed(3)
      );
    },
    showWeightEntry(): boolean {
      return (
        !!this.$data.wasteMethod &&
        !!this.$data.wasteReason &&
        !!this.$data.unitOfWeight &&
        !!this.$data.destroyPlantsIsodate &&
        !!this.$data.reasonNote &&
        !!this.$data.wasteMaterialMixed
      );
    },
    allPlantsHaveValidWeight(): boolean {
      return this.allPlantsHaveValidWeightImpl();
    },
    allDetailsProvided(): boolean {
      return (
        !!this.$data.wasteMethod &&
        !!this.$data.wasteReason &&
        !!this.$data.unitOfWeight &&
        !!this.$data.destroyPlantsIsodate &&
        this.allPlantsHaveValidWeightImpl() &&
        !!this.$data.reasonNote &&
        !!this.$data.wasteMaterialMixed
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    }
  },
  data() {
    return {
      builderType: BuilderType.DESTROY_PLANTS,
      activeStepIndex: 0,
      selectedPlants: [],
      // Builder state
      showHiddenDetailFields: false,
      // Submission data
      destroyPlantsIsodate: todayIsodate(),
      destroyedWeights: [],
      unitOfWeight: null,
      wasteMethod: null,
      wasteReason: null,
      wasteMaterialMixed: "NA",
      reasonNote: null,
      steps: [
        {
          stepText: "Select plants to destroy"
        },
        {
          stepText: "Destroy details"
        },
        {
          stepText: "Submit"
        }
      ],
      unitsOfWeight: [],
      wasteMethods: [],
      wasteReasons: []
    };
  },
  watch: {
    selectedPlants: {
      immediate: true,
      handler(newValue, oldValue) {
        if (this.$data.destroyedWeights.length !== newValue.length) {
          this.$data.destroyedWeights = Array(newValue.length).fill(0);
        }
      }
    }
    // totalDestroyedWeight: {
    //   immediate: true,
    //   handler(newValue, oldValue) {
    //     this.$data.destroyedWeights = normalDistribution(
    //       sum(this.$data.destroyedWeights),
    //       this.$data.selectedPlants.length
    //     );
    //   }
    // }
  },
  async mounted() {
    this.$data.unitsOfWeight = await dynamicConstsManager.unitsOfWeight();
    this.$data.wasteMethods = await dynamicConstsManager.wasteMethods();
    this.$data.wasteReasons = await dynamicConstsManager.wasteReasons();

    this.$data.unitOfWeight = this.$data.unitsOfWeight[0];
    this.$data.wasteMethod = this.$data.wasteMethods[0];
    this.$data.wasteReason = this.$data.wasteReasons[0];
  },
  async created() {},
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
