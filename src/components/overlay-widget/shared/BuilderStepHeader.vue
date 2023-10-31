<template>
  <div
    class="flex flex-row items-center justify-center space-x-2 text-lg cursor-pointer px-4"
    v-bind:class="{
      'opacity-100': active,
      'opacity-50': !active,
    }"
  >
    <span
      class="step-number rounded-full h-8 w-8 flex items-center justify-center text-white"
      v-bind:class="{
        'bg-purple-400': active,
        'bg-gray-400': !active,
      }"
      >{{ stepNumber }}</span
    >
    <span>{{ stepText }}</span>
  </div>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "BuilderStepHeader",
  store,
  props: {
    stepNumber: Number,
    stepText: String,
    active: Boolean,
  },
});
</script>

<style type="text/scss" lang="scss">
.step-number {
  transition: background-color 0.5s ease;
}
</style>
