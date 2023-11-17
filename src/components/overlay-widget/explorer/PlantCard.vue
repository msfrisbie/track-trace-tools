<template>
  <div class="rounded-md border border-solid ttt-purple-border overflow-hidden">
    <div class="flex flex-col items-stretch gap-1 p-2 ttt-purple-bg text-white">
      <div class="flex flex-row items-center justify-between gap-2">
        <span>
          <div>{{ plant.LicenseNumber }}</div>
        </span>

        <b-badge :variant="getBadgeVariant(plant.PlantState)">{{ plant.PlantState }}</b-badge>
      </div>
    </div>

    <hr />
    <div
      class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap overflow-x-auto"
    >
      <picker-icon icon="box" style="width: 5rem" class="flex-shrink-0" text="" />

      <picker-card class="flex-grow" :title="`${plant.Label}`" :label="plant.StrainName" />
    </div>
  </div>
</template>

<script lang="ts">
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import PickerIcon from '@/components/overlay-widget/shared/PickerIcon.vue';
import { PlantState } from '@/consts';
import { IIndexedPlantBatchData, IIndexedPlantData } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { unitOfMeasureNameToAbbreviation } from '@/utils/units';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'PlantCard',
  store,
  router,
  props: {
    plant: Object as () => IIndexedPlantData,
  },
  components: {
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    unitOfMeasureNameToAbbreviation,
    getBadgeVariant(plantState: PlantState): string {
      switch (plantState) {
        case PlantState.FLOWERING:
          return 'success';
        case PlantState.VEGETATIVE:
          return 'info';
        case PlantState.INACTIVE:
          return 'danger';
        default:
          return 'light';
      }
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
