<template>
  <div class="w-full flex flex-col items-center space-y-4" style="max-height: 50vh">
    <b-button-group class="w-full">
      <b-button :pressed="bulk" variant="outline-primary" @click="bulk = true"
        >TOTAL WEIGHT</b-button
      >
      <b-button :pressed="!bulk" variant="outline-primary" @click="bulk = false"
        >WEIGHT PER PLANT</b-button
      >
    </b-button-group>

    <!-- TODO check if it's only one plant which makes this irrelevant -->
    <template v-if="bulk">
      <b-form-group class="w-full" label="Total weight:" label-size="sm">
        <b-input-group>
          <b-form-input
            v-model.number="totalWeight"
            type="number"
            size="md"
            step="0.0001"
          ></b-form-input>

          <template #append>
            <b-form-select
              size="md"
              :options="weightOptions"
              :value="unitOfWeight"
              @change="$emit('update:unitOfWeight', $event)"
            />
          </template>
        </b-input-group>
      </b-form-group>

      <div class="grid grid-cols-2 place-items-center">
        <b-form-group label="" label-size="sm">
          <b-form-checkbox 
            v-model="randomize"> Randomize weights </b-form-checkbox></b-form-group
        >

        <b-form-group label="Decimal places" label-size="sm">
          <b-form-select
            size="sm"
            v-model="precision"
            :options="[1, 2, 3, 4].map((x) => ({ text: x, value: x }))"
          ></b-form-select
        ></b-form-group>
      </div>

      <p class="text-gray-500">
        Per plant weight is randomized. Sum of individual plant weights will equal this amount.
      </p>
    </template>

    <template v-if="!bulk">
      <b-form-group class="w-full" label="Enter plant weight in" label-cols="auto" label-size="lg">
        <b-form-select
          size="md"
          :options="weightOptions"
          :value="unitOfWeight"
          @change="$emit('update:unitOfWeight', $event)"
        />
      </b-form-group>

      <div class="toolkit-scroll flex flex-col items-center overflow-y-auto p-2" ref="page">
        <b-form>
          <b-form-group
            v-for="(weight, index) of plantWeightsPage"
            :key="index"
            class="flex flex-row items-center space-x-2"
            label-class="text-gray-500"
            :label="'...' + selectedPlantsPage[index].Label.substring(12)"
            label-cols="auto"
            label-size="lg"
          >
            <b-input-group :append="unitOfWeight.Name">
              <b-form-input
                type="number"
                size="md"
                step="0.0001"
                v-model.number="plantWeights[pageOffset + index]"
              ></b-form-input>
            </b-input-group>
          </b-form-group>
        </b-form>
      </div>

      <template v-if="selectedPlants.length > plantWeightsPageSize">
        <div class="flex flex-row justify-between items-center" style="width: 420px">
          <b-button :disabled="!hasPrevPage" variant="outline-info" @click="changePage(-1)"
            >&lt;</b-button
          >

          <span>{{ plantWeightsPageIndex + 1 }} of {{ pages }}</span>

          <b-button :disabled="!hasNextPage" variant="outline-info" @click="changePage(1)"
            >&gt;</b-button
          >
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { IPlantData } from "@/interfaces";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { normalDistribution } from "@/utils/math";
import Vue from "vue";

const PAGE_SIZE = 100;

enum WeightMode {
  BULK = "BULK",
  INDIVIDUAL = "INDIVIDUAL",
}

export default Vue.extend({
  name: "PlantWeightPicker",
  store,
  props: {
    selectedPlants: {
      type: Array as () => IPlantData[],
      default: [],
    },
    plantWeights: {
      type: Array as () => Number[],
      default: [],
    },
    unitOfWeight: Object,
  },
  methods: {
    changePage(offset: number) {
      this.$data.plantWeightsPageIndex += offset;
      // @ts-ignore
      this.$refs.page.scrollTop = 0;
    },
    updatePlantWeights() {
      // Default to even split
      let weights = Array(this.selectedPlants.length).fill(
        
      );

      if (this.$data.randomize) {
        weights = normalDistribution(
            this.$data.totalWeight,
            this.selectedPlants.length,
            this.$data.precision
          )
      }
      this.$emit(
          "update:plantWeights",
          weights
        );
    }
  },
  computed: {
    plantWeightsPage(): number[] {
      const startIdx = PAGE_SIZE * this.$data.plantWeightsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantWeightsPageIndex + 1);
      return this.$props.plantWeights.slice(startIdx, endIdx);
    },
    selectedPlantsPage(): IPlantData[] {
      const startIdx = PAGE_SIZE * this.$data.plantWeightsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantWeightsPageIndex + 1);
      return this.$props.selectedPlants.slice(startIdx, endIdx);
    },
    hasNextPage(): boolean {
      return (this.$data.plantWeightsPageIndex + 1) * PAGE_SIZE < this.$props.selectedPlants.length;
    },
    hasPrevPage(): boolean {
      return this.$data.plantWeightsPageIndex > 0;
    },
    pages(): number {
      return Math.ceil(this.$props.selectedPlants.length / PAGE_SIZE);
    },
    pageOffset(): number {
      return this.$data.plantWeightsPageIndex * PAGE_SIZE;
    },
    weightOptions(): Object[] {
      return this.$data.unitsOfWeight.map((unitOfWeight: any) => ({
        text: unitOfWeight.Name,
        value: unitOfWeight,
      }));
    },
    bulkModeEnabled(): boolean {
      return this.$data.mode === WeightMode.BULK;
    },
    individualModeEnabled(): boolean {
      return this.$data.mode === WeightMode.INDIVIDUAL;
    },
  },
  data() {
    return {
      bulk: true,
      mode: WeightMode.BULK,
      totalWeight: null,
      plantWeightsPageIndex: 0,
      plantWeightsPageSize: PAGE_SIZE,
      error: null,
      unitsOfWeight: [],
      precision: 2,
      randomize: false,
    };
  },
  watch: {
    plantWeights: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:plantWeights", newValue);
      },
    },
    unitOfWeight: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:unitOfWeight", newValue);
      },
    },
    totalWeight: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        this.updatePlantWeights();
      },
    },
    precision: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        this.updatePlantWeights();
      },
    },
    randomize: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        this.updatePlantWeights();
      },
    },
  },
  async mounted() {
    this.$data.unitsOfWeight = await dynamicConstsManager.unitsOfWeight();
  },
});
</script>

<style type="text/scss" lang="scss"></style>
