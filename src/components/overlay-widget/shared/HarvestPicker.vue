<template>
  <div class="flex flex-col space-y-4 items-center text-center">
    <!-- https://mattzollinhofer.github.io/vue-typeahead-bootstrap-docs/examples/examples.html#prepend-append -->
    <vue-typeahead-bootstrap
      v-model="harvestNameQuery"
      :data="harvestOptions"
      :minMatchingChars="0"
      :showOnFocus="true"
      :maxMatches="100"
      type="text"
      required
      placeholder="Harvest name"
      class="w-full text-left"
      size="md"
    />
    <!-- @hit="$emit('update:harvestName', $event)" -->

    <template v-if="!error && harvestName.length > 0">
      <template v-if="harvestNameMatchesActiveHarvest">
        <template v-if="!harvestNameIsExpired && !harvestTypeMismatch">
          <div class="text-center text-purple-700">
            Adds to existing harvest
            <span class="font-bold">{{ harvestName }}</span
            >.
          </div>
        </template>

        <template v-if="harvestNameCheckInflight">
          <div class="flex flex-row items-center space-x-2 text-gray-500">
            <span>Verifying harvest eligibility...</span>
          </div>
        </template>

        <template v-else>
          <template v-if="harvestNameIsExpired">
            <div class="text-center text-red-700">
              <span class="font-bold">{{ harvestName }}</span> is more than 24 hours old and cannot
              be used.
            </div>
          </template>

          <template v-if="harvestTypeMismatch">
            <div class="text-center text-red-700">
              <span class="font-bold">{{ harvestName }}</span> is a
              {{ filterWholePlant ? "Manicure" : "Whole Plant" }} harvest. You should only add to an
              existing {{ filterWholePlant ? "Whole Plant" : "Manicure" }} harvest.
            </div>
          </template>
        </template>
      </template>

      <template v-else>
        <div class="text-center text-green-700">
          <span class="font-bold">{{ harvestName }}</span> is a new harvest.
        </div>
      </template>
    </template>

    <error-readout
      v-if="error || inflight"
      :inflight="inflight"
      :error="error"
      loadingMessage="Loading harvest..."
      errorMessage="Unable to load harvests."
      permissionsErrorMessage="Check that your employee account has full 'Harvests' permissions."
      v-on:retry="loadHarvests()"
    />
  </div>
</template>

<script lang="ts">
import ErrorReadout from '@/components/overlay-widget/shared/ErrorReadout.vue';
import { IHarvestData } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { primaryMetrcRequestManager } from '@/modules/metrc-request-manager.module';
import store from '@/store/page-overlay/index';
import Vue from 'vue';

function msAgo(isodate: string): number {
  const now: number = Date.now();

  const ageInMs: number = now - Date.parse(isodate).valueOf();

  return ageInMs;
}

// 24 hours
const HARVEST_EXPIRATION_MS = 1000 * 60 * 60 * 24;

export default Vue.extend({
  name: 'HarvestPicker',
  store,
  components: {
    ErrorReadout,
  },
  async mounted() {
    // @ts-ignore
    this.loadHarvests();
  },
  props: {
    harvestName: String,
    filterWholePlant: Boolean,
  },
  data() {
    return {
      harvestNameQuery: null,
      inflight: false,
      error: null,
      activeHarvests: [],
      harvestNameMatchesActiveHarvest: false,
      harvestNameCheckInflight: false,
      harvestNameIsExpired: false,
      harvestTypeMismatch: false,
    };
  },
  watch: {
    harvestName: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.$data.harvestNameQuery = newValue;

        // @ts-ignore
        this.checkForHarvestEligibility();
      },
    },
    activeHarvests: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.checkForHarvestEligibility();
      },
    },
    harvestNameQuery: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.$emit('update:harvestName', newValue);
      },
    },
  },
  computed: {
    harvestOptions() {
      return this.$data.activeHarvests.map((harvest: IHarvestData) => harvest.Name);
    },
    // harvestNameMatchesActiveHarvest() {
    //   return (
    //     this.$data.activeHarvests.filter(
    //       (harvest: IHarvestData) => harvest.Name === this.harvestName
    //     ).length > 0
    //   );
    // },
  },
  methods: {
    async loadHarvests() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;
        this.$data.activeHarvests = (await primaryDataLoader.activeHarvests()).filter(
          (harvestData: IHarvestData) =>
            (this.$props.filterWholePlant
              ? harvestData.HarvestType === 'WholePlant'
              : harvestData.HarvestType !== 'WholePlant'),
        );
      } catch (e) {
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }
    },
    async checkForHarvestEligibility() {
      this.$data.harvestNameCheckInflight = true;
      this.$data.harvestNameMatchesActiveHarvest = false;
      this.$data.harvestNameIsExpired = false;
      this.$data.harvestTypeMismatch = false;

      // @ts-ignore
      const matchingHarvests = (await primaryDataLoader.activeHarvests()).filter(
        (harvest: IHarvestData) => harvest.Name === this.$props.harvestName,
      );

      if (matchingHarvests.length === 0) {
        return;
      }

      if (matchingHarvests.length > 0) {
        this.$data.harvestNameMatchesActiveHarvest = true;

        const matchingHarvest: IHarvestData = matchingHarvests[0];

        // If the harvest type is a mismatch, show that error first
        if (
          (matchingHarvest.HarvestType === 'WholePlant' && !this.$props.filterWholePlant)
          || (matchingHarvest.HarvestType !== 'WholePlant' && this.$props.filterWholePlant)
        ) {
          this.$data.harvestNameCheckInflight = false;
          this.$data.harvestTypeMismatch = true;
          return;
        }

        // Quick check: if the last edited time was > 24 hours ago,
        // no need to fetch
        if (msAgo(matchingHarvest.LastModified) > HARVEST_EXPIRATION_MS) {
          this.$data.harvestNameCheckInflight = false;
          this.$data.harvestNameIsExpired = true;
          return;
        }

        // Otherwise, get the timetamp from the initial history
        try {
          const responseData = await (
            await primaryMetrcRequestManager.getHarvestHistory(
              JSON.stringify({}),
              matchingHarvest.Id,
            )
          ).data;

          if (msAgo(responseData.Data[0].RecordedDateTime) > HARVEST_EXPIRATION_MS) {
            this.$data.harvestNameIsExpired = true;
            return;
          }
        } finally {
          this.$data.harvestNameCheckInflight = false;
        }
      }
    },
  },
});
</script>
