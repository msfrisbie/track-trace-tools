<template>
  <font-awesome-icon :icon="icon" v-bind:style="{ color: iconColor }" />
</template>

<script lang="ts">
import { IIndexedPlantData } from '@/interfaces';
import Vue from 'vue';

export default Vue.extend({
  name: 'PlantIcon',
  props: {
    plant: Object as () => IIndexedPlantData,
  },
  computed: {
    icon() {
      return 'leaf';
    },
    iconColor() {
      return '#49276a';
    },
  },
});
</script>
