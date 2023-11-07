<template>
  <div v-if="showTooBigError || showTooSmallError" class="text-xl py-6">
    <span class="text-red-500 font-bold">WARNING: </span>
    <span v-if="showTooBigError"
      >{{ yieldPerPlant }} per plant is very large. Check your unit of
      measure.</span
    >
    <span v-if="showTooSmallError"
      >{{ yieldPerPlant }} per plant is very small. Check your unit of
      measure.</span
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { normalizeToGrams } from '@/utils/units';

const GRAMS_PER_POUND = 453.592;

export default Vue.extend({
  name: 'HarvestYieldChecker',
  store,
  props: {
    unitOfMeasureName: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    plantCount: { type: Number, required: true },
  },
  computed: {
    yieldPerPlant() {
      const props = this.$props as any;

      const yieldAmount = (props.totalQuantity / props.plantCount).toFixed(3);

      return `${yieldAmount} ${props.unitOfMeasureName}`;
    },
    showTooBigError() {
      const gramsPerPlant = normalizeToGrams(
        this.$props.totalQuantity,
        this.$props.unitOfMeasureName
      ) / this.$props.plantCount;

      // Maximum: 5 lb
      if (gramsPerPlant > GRAMS_PER_POUND * 5) {
        return true;
      }

      return false;
    },
    showTooSmallError() {
      const gramsPerPlant = normalizeToGrams(
        this.$props.totalQuantity,
        this.$props.unitOfMeasureName
      ) / this.$props.plantCount;

      // Minimum: 0.1 lb
      if (gramsPerPlant < GRAMS_PER_POUND * 0.05) {
        return true;
      }

      return false;
    },
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
