<template>
  <div class="flex flex-col items-stretch space-y-8">
    <b-form-group label="PLANNED ROUTE" label-class="text-gray-400" label-size="sm" style="margin: 0">
      <b-form-textarea v-model="plannedRoute" rows="4" placeholder="Enter route description" required
        :state="!plannedRoute ? false : null" />
    </b-form-group>

    <template v-if="directionDataLoading">
      <div class="flex flex-row space-x-2 justify-center items-center text-gray-500">
        <b-spinner small />
        <span>Loading directions</span>
      </div>
    </template>

    <template v-if="showMapsIframe">
      <google-maps class="w-full h-full col-span-2" mapMode="directions" :destination="destinationAddress"
        :origin="originAddress" />
    </template>
  </div>
</template>

<script lang="ts">
import GoogleMaps from '@/components/shared/GoogleMaps.vue';
import { AnalyticsEvent } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import store from '@/store/page-overlay/index';
import { TransferBuilderActions } from '@/store/page-overlay/modules/transfer-builder/consts';
import { debugLogFactory } from '@/utils/debug';
import { extractTextDirections, IGoogleMapsDirections, isStubAddress } from '@/utils/google-maps';
import _ from 'lodash-es';
import Vue from 'vue';

const debugLog = debugLogFactory('RoutePicker.vue');

export default Vue.extend({
  name: 'RoutePicker',
  props: {
    originAddress: String,
    destinationAddress: String,
    loadGoogleMapsDirections: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    GoogleMaps,
  },
  store,
  computed: {
    plannedRoute: {
      get(): string {
        // @ts-ignore
        return store.state.transferBuilder.plannedRoute;
      },
      set(plannedRoute): void {
        // @ts-ignore
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          plannedRoute,
        });
      },
    },
  },
  data() {
    return {
      showMapsIframe: false,
      directionDataLoading: false,
    };
  },
  watch: {
    originAddress: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.updateDirections();
      },
    },
    destinationAddress: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.updateDirections();
      },
    },
  },
  methods: {
    updateDirections() {
      this.$data.showMapsIframe = false;
      // @ts-ignore
      if (this.loadGoogleMapsDirections) {
        this.$data.directionDataLoading = true;

        // @ts-ignore
        this.updateDirectionsImpl();
      }
    },
    updateDirectionsImpl: _.debounce(async function () {
      // This is a sucky way of binding to this
      // @ts-ignore
      const _this: any = this;

      if (!_this.originAddress || !_this.destinationAddress) {
        return;
      }

      if (isStubAddress(_this.originAddress)) {
        return;
      }

      if (isStubAddress(_this.destinationAddress)) {
        return;
      }

      analyticsManager.track(AnalyticsEvent.BUILDER_EVENT, {
        action: 'Started update directions',
      });

      _this.$data.showMapsIframe = true;

      const response: any = null;
      try {
        // response = await stubRequestManager.directions(
        //   _this.originAddress,
        //   _this.destinationAddress
        // );
      } catch (e) {
        analyticsManager.track(AnalyticsEvent.BUILDER_EVENT, {
          action: 'Failed to load directions',
        });
      }

      _this.$data.directionDataLoading = false;

      if (!response || !response.valid) {
        debugLog(async () => ['directions response', response]);

        analyticsManager.track(AnalyticsEvent.BUILDER_EVENT, {
          action: 'Directions response was invalid',
        });

        return;
      }

      const directions: IGoogleMapsDirections[] = response.directions;

      // Only update the planned route if the textarea is empty
      _this.plannedRoute = extractTextDirections(directions[0]);

      analyticsManager.track(AnalyticsEvent.BUILDER_EVENT, {
        action: 'Received directions response',
        directionsResponse: response,
      });
    }, 500),
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
