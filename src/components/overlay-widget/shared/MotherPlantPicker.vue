<template>
  <div class="w-full flex flex-col items-center space-y-4" style="max-height: 50vh">
    <b-form-group class="w-full" label="Enter the take as:" label-size="sm">
      <b-button-group class="w-full">
        <b-button :pressed="bulk === true" variant="outline-primary" @click="bulk = true"
          >TOTAL {{ plantBatchType.Name.toLocaleUpperCase() + "S" }}</b-button
        >
        <b-button :pressed="bulk === false" variant="outline-primary" @click="bulk = false">
          {{ plantBatchType.Name.toLocaleUpperCase() + "S" }} PER MOTHER</b-button
        >
      </b-button-group>
    </b-form-group>

    <template v-if="bulk === true">
      <b-form-group class="w-full" label="Total take:" label-size="sm">
        <b-input-group>
          <b-form-input v-model.number="totalCount" type="number" size="md" step="1"></b-form-input>

          <b-input-group-append is-text>
            {{ plantBatchType.Name + "s" }}
          </b-input-group-append>
        </b-input-group>

        <template v-if="selectedMothers.length > 1">
          <p class="mb-4 text-gray-500 mt-1">
            This amount is evenly distributed between mother plants.
          </p>
        </template>
      </b-form-group>

      <template v-if="totalCount > 0">
        <b-form-group class="w-full" label="Max package size: (optional)" label-size="sm">
          <b-input-group>
            <b-form-input
              v-model.number="maximumPerBatch"
              type="number"
              size="md"
              step="1"
              min="1"
            ></b-form-input>
          </b-input-group>
        </b-form-group>
      </template>
    </template>

    <template v-if="bulk === false">
      <div class="toolkit-scroll flex flex-col items-center overflow-y-auto p-2" ref="page">
        <b-form>
          <template v-for="(motherPlantRow, motherPlantRowIndex) of childMatrixPage">
            <template v-for="(batch, batchIndex) of motherPlantRow">
              <b-form-group
                :key="`${motherPlantRowIndex},${batchIndex}`"
                class="flex flex-row items-center space-x-2"
                label-cols="auto"
              >
                <template v-slot:label>
                  <dual-color-tag
                    class="text-sm"
                    :label="
                      selectedMothersPage[motherPlantRowIndex].Label ||
                      selectedMothersPage[motherPlantRowIndex].Name
                    "
                  />
                </template>

                <b-input-group>
                  <b-form-input
                    type="number"
                    step="1"
                    :max="maximumPerBatch"
                    v-model.number="childMatrix[pageOffset + motherPlantRowIndex][batchIndex]"
                  >
                  </b-form-input>

                  <b-input-group-append is-text>
                    {{ plantBatchType.Name + "s" }}
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </template>
          </template>
        </b-form>
      </div>

      <template v-if="selectedMothers.length > childMatrixPageSize">
        <div class="flex flex-row justify-between items-center" style="width: 420px">
          <b-button :disabled="!hasPrevPage" variant="outline-info" @click="changePage(-1)"
            >&lt;</b-button
          >

          <span>{{ childMatrixPageIndex + 1 }} of {{ pages }}</span>

          <b-button :disabled="!hasNextPage" variant="outline-info" @click="changePage(1)"
            >&gt;</b-button
          >
        </div>
      </template>
    </template>

    <template v-if="totalPackagesCreated > 0 && totalChildCount > 0">
      <span class="text-xl my-4">
        Creates
        <span style="color: #49276a" class="font-bold"
          >{{ totalChildCount }} {{ plantBatchType.Name.toLocaleLowerCase() + "s" }}</span
        >
        in
        <span style="color: #49276a" class="font-bold">{{ totalPackagesCreated }}</span>
        packages.</span
      >
    </template>
  </div>
</template>

<script lang="ts">
import DualColorTag from "@/components/overlay-widget/shared/DualColorTag.vue";
import { IPlantBatchData, IPlantBatchType, IPlantData } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { splitMax } from "@/utils/array";
import { evenDistribution } from "@/utils/math";
import { sum } from "lodash";
import Vue from "vue";

const PAGE_SIZE = 100;

enum CountMode {
  BULK = "BULK",
  INDIVIDUAL = "INDIVIDUAL",
}

export default Vue.extend({
  name: "MotherPlantPicker",
  store,
  components: {
    DualColorTag,
  },
  props: {
    selectedMothers: {
      type: Array as () => IPlantData[] | IPlantBatchData[],
      required: true,
    },
    childMatrix: {
      type: Array as () => number[][],
      required: true,
    },
    plantBatchType: { type: Object as () => IPlantBatchType, default: {} },
  },
  methods: {
    changePage(offset: number) {
      this.$data.childMatrixPageIndex += offset;
      // @ts-ignore
      this.$refs.page.scrollTop = 0;
    },
    updateChildMatrix(matrix: number[][]) {
      this.$emit("update:childMatrix", matrix);
    },
  },
  computed: {
    totalPackagesCreated(): number {
      return sum(
        this.$props.childMatrix.map(
          (x: (number | null)[]) => x.filter((x: number | null) => x !== null).length
        )
      );
    },
    totalChildCount() {
      return sum(this.$props.childMatrix.map((x: number[]) => sum(x)));
    },
    childMatrixPage(): number[] {
      const startIdx = PAGE_SIZE * this.$data.childMatrixPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.childMatrixPageIndex + 1);
      return this.$props.childMatrix
        .slice(startIdx, endIdx)
        .map((x: number[]) => (x.length > 0 ? x : [null]));
    },
    selectedMothersPage(): IPlantData[] {
      const startIdx = PAGE_SIZE * this.$data.childMatrixPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.childMatrixPageIndex + 1);
      return this.$props.selectedMothers.slice(startIdx, endIdx);
    },
    hasNextPage(): boolean {
      return (this.$data.childMatrixPageIndex + 1) * PAGE_SIZE < this.$props.selectedMothers.length;
    },
    hasPrevPage(): boolean {
      return this.$data.childMatrixPageIndex > 0;
    },
    pages(): number {
      return Math.ceil(this.$props.selectedMothers.length / PAGE_SIZE);
    },
    pageOffset(): number {
      return this.$data.childMatrixPageIndex * PAGE_SIZE;
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
      bulk: null,
      mode: CountMode.BULK,
      totalCount: null,
      maximumPerBatch: null,
      childMatrixPageIndex: 0,
      childMatrixPageSize: PAGE_SIZE,
      error: null,
    };
  },
  watch: {
    // bulk: {
    //   immediate: true,
    //   handler(newValue, oldValue) {
    //     if (newValue === true) {
    //       this.$data.maximumPerBatch = null;
    //     }
    //   },
    // },
    childMatrix: {
      immediate: true,
      handler(newValue, oldValue) {
        this.updateChildMatrix(newValue);
      },
    },
    maximumPerBatch: {
      immediate: true,
      handler(newValue, oldValue) {
        const matrix: number[][] = evenDistribution(
          this.$data.totalCount,
          this.selectedMothers.length
        ).map((x) => splitMax(x, newValue));

        this.updateChildMatrix(matrix);
      },
    },
    plantBatchType: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:plantBatchType", newValue);
      },
    },
    totalCount: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        const matrix: number[][] = evenDistribution(newValue, this.selectedMothers.length).map(
          (x) => splitMax(x, this.$data.maximumPerBatch)
        );

        this.updateChildMatrix(matrix);
      },
    },
  },
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss"></style>
