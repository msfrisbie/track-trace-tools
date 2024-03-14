<template>
  <div class="w-full flex flex-col items-center space-y-4" style="max-height: 50vh">
    <b-button-group class="w-full">
      <b-button :pressed="bulk" variant="outline-primary" @click="bulk = true"
        >TOTAL COUNT</b-button
      >
      <b-button :pressed="!bulk" variant="outline-primary" @click="bulk = false"
        >COUNT PER PLANT BATCH</b-button
      >
    </b-button-group>

    <template v-if="bulk">
      <b-form-group class="w-full" label="Total count:" label-size="sm">
        <b-input-group>
          <b-form-input
            v-model.number="totalCount"
            type="number"
            size="md"
            step="0.0001"
          ></b-form-input>
        </b-input-group>
        <b-button
          variant="link"
          size="sm"
          class="self-start"
          @click="
            totalCount = selectedPlantBatches
              .map((x) => x.UntrackedCount)
              .reduce((a, b) => a + b, 0)
          "
          >DESTROY ALL</b-button
        >
      </b-form-group>
    </template>

    <template v-if="!bulk">
      <div class="toolkit-scroll flex flex-col items-center overflow-y-auto p-2" ref="page">
        <b-form>
          <b-form-group
            v-for="(weight, index) of plantBatchCountsPage"
            :key="index"
            class="flex flex-row items-center space-x-2"
            label-class="text-gray-500"
            :label="`${selectedPlantBatchesPage[index].Name} (${selectedPlantBatchesPage[index].UntrackedCount})`"
            label-cols="auto"
            label-size="lg"
          >
            <b-input-group>
              <b-form-input
                type="number"
                size="md"
                step="0.0001"
                v-model.number="plantBatchCounts[pageOffset + index]"
              ></b-form-input>
            </b-input-group>
          </b-form-group>
        </b-form>
      </div>

      <template v-if="selectedPlantBatches.length > plantBatchCountsPageSize">
        <div class="flex flex-row justify-between items-center" style="width: 420px">
          <b-button :disabled="!hasPrevPage" variant="outline-info" @click="changePage(-1)"
            >&lt;</b-button
          >

          <span>{{ plantBatchCountsPageIndex + 1 }} of {{ pages }}</span>

          <b-button :disabled="!hasNextPage" variant="outline-info" @click="changePage(1)"
            >&gt;</b-button
          >
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { IPlantBatchData } from "@/interfaces";
import store from "@/store/page-overlay/index";
import Vue from "vue";

const PAGE_SIZE = 100;

enum CountMode {
  BULK = "BULK",
  INDIVIDUAL = "INDIVIDUAL",
}

export default Vue.extend({
  name: "PlantBatchCountPicker",
  store,
  props: {
    selectedPlantBatches: {
      type: Array as () => IPlantBatchData[],
      default: [],
    },
    plantBatchCounts: {
      type: Array as () => Number[],
      default: [],
    },
  },
  methods: {
    changePage(offset: number) {
      this.$data.plantBatchCountsPageIndex += offset;
      // @ts-ignore
      this.$refs.page.scrollTop = 0;
    },
    updatePlantBatchCounts() {
      // Default to eager fill
      const counts: number[] = [];
      let remainingCount: number = this.$data.totalCount;

      for (const plantBatch of this.$props.selectedPlantBatches) {
        const allocation = Math.min(remainingCount, plantBatch.UntrackedCount);

        counts.push(allocation);

        remainingCount -= allocation;
      }

      this.$emit("update:plantBatchCounts", counts);
    },
  },
  computed: {
    plantBatchCountsPage(): number[] {
      const startIdx = PAGE_SIZE * this.$data.plantBatchCountsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantBatchCountsPageIndex + 1);
      return this.$props.plantBatchCounts.slice(startIdx, endIdx);
    },
    selectedPlantBatchesPage(): IPlantBatchData[] {
      const startIdx = PAGE_SIZE * this.$data.plantBatchCountsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.plantBatchCountsPageIndex + 1);
      return this.$props.selectedPlantBatches.slice(startIdx, endIdx);
    },
    hasNextPage(): boolean {
      return (
        (this.$data.plantBatchCountsPageIndex + 1) * PAGE_SIZE <
        this.$props.selectedPlantBatches.length
      );
    },
    hasPrevPage(): boolean {
      return this.$data.plantBatchCountsPageIndex > 0;
    },
    pages(): number {
      return Math.ceil(this.$props.selectedPlantBatches.length / PAGE_SIZE);
    },
    pageOffset(): number {
      return this.$data.plantBatchCountsPageIndex * PAGE_SIZE;
    },
    bulkModeEnabled(): boolean {
      return this.$data.mode === CountMode.BULK;
    },
    individualModeEnabled(): boolean {
      return this.$data.mode === CountMode.INDIVIDUAL;
    },
  },
  data() {
    return {
      bulk: true,
      mode: CountMode.BULK,
      totalCount: null,
      plantBatchCountsPageIndex: 0,
      plantBatchCountsPageSize: PAGE_SIZE,
    };
  },
  watch: {
    plantBatchCounts: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:plantBatchCounts", newValue);
      },
    },
    totalCount: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        this.updatePlantBatchCounts();
      },
    },
  },
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss"></style>
