<template>
  <div class="flex flex-col items-start space-y-2">
    <span v-if="title" class="text-lg text-gray-700">{{ title }}</span>

    <dual-color-tag class="text-md" :label="label" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import DualColorTag from '@/components/overlay-widget/shared/DualColorTag.vue';

export default Vue.extend({
  name: 'PickerCard',
  components: {
    DualColorTag
  },
  props: {
    title: String,
    label: String
  }
});
</script>
