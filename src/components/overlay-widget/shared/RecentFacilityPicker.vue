<template>
  <div v-if="facilities.length" class="flex flex-col items-stretch">
    <div class="pb-2">
      <span class="text-md text-gray-500">Recently used:</span>
    </div>
    <div class="flex flex-col items-stretch space-y-4 px-4 overflow-y-auto toolkit-scroll" style="max-height: 25vh">
      <b-button @click="selectFacility(facility)" v-for="facility of facilities" v-bind:key="facility.LicenseNumber"
        variant="outline-primary">{{ facilitySummary(facility) }}</b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent, BuilderType } from '@/consts';
import { IMetrcFacilityData } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { facilitySummary } from '@/utils/facility';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'RecentFacilityPicker',
  store,
  router,
  props: {
    facilities: Array as () => IMetrcFacilityData[],
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    selectFacility(facility: IMetrcFacilityData | null) {
      this.$emit('selectFacility', facility);

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        builderType: BuilderType.CREATE_TRANSFER,
        action: 'Selected a recent facility',
        facility,
      });
    },
    facilitySummary,
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
