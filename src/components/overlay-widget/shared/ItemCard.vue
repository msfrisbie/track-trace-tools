<template>
  <div class="flex flex-col items-start space-y-2">
    <span class="text-lg text-gray-700">{{ batchNumber }}</span>
    <span class="text-lg text-gray-700">{{ categoryName }}</span>
    <span class="text-lg text-gray-700">{{ unitOfMeasure }}</span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ItemCard",
  components: {},
  props: {
    batchNumber: String,
    categoryName: String,
    unitOfMeasure: String,
  },
});
</script>