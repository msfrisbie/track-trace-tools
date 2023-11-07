<template>
  <div class="font-mono">
    <span class="text-gray-400 text-center">{{ labelPrefix }}</span>
    <span class="text-gray-800 text-center font-bold">{{ labelSuffix }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

function firstNonzeroSuffixIntIndex(value: string): number {
  return value.slice(sliceOffset).match(/[1-9]/)?.index || 0;
}

const sliceOffset: number = 16;

export default Vue.extend({
  name: 'DualColorTag',
  props: {
    label: String,
  },
  computed: {
    labelPrefix() {
      return this.$props.label.slice(
        0,
        sliceOffset + firstNonzeroSuffixIntIndex(this.$props.label)
      );
    },
    labelSuffix() {
      return this.$props.label.slice(sliceOffset + firstNonzeroSuffixIntIndex(this.$props.label));
    },
  },
});
</script>
