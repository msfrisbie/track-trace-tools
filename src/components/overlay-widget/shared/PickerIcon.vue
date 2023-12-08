<template>
  <div class="flex flex-col items-center justify-center space-y-1">
    <font-awesome-icon :icon="icon" size="2x" style="color: #49276a" class="opacity-60" />

    <span v-bind:class="mergedTextClass">{{ text }}</span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "PickerIcon",
  components: {},
  props: {
    icon: String,
    text: String,
    textClass: String,
  },
  computed: {
    mergedTextClass() {
      return `text-base text-center text-gray-600 font-bold ${this.textClass || ""}`;
    },
  },
});
</script>
