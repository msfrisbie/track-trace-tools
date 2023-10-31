<template>
  <div class="flex flex-col space-y-4 items-center text-center">
    <!-- https://mattzollinhofer.github.io/vue-typeahead-bootstrap-docs/examples/examples.html#prepend-append -->

    <template v-if="location">
      <b-button-group class="self-start">
        <b-button
          size="md"
          variant="primary"
          disabled
          class="overflow-x-hidden"
          style="max-width:400px"
          >{{ location.Name }}</b-button
        >
        <b-button
          size="md"
          variant="primary"
          @click="
            $emit('update:location', null);
            locationNameQuery = '';
          "
          >&#10005;</b-button
        >
      </b-button-group>
    </template>

    <template v-if="!location">
      <vue-typeahead-bootstrap
        v-model="locationNameQuery"
        :data="locations"
        :serializer="location => location.Name"
        :minMatchingChars="0"
        :showOnFocus="true"
        :maxMatches="100"
        @hit="$emit('update:location', $event)"
        type="text"
        required
        placeholder="Location name"
        class="w-full text-left"
        size="md"
      />
    </template>

    <error-readout
      v-if="error || inflight"
      :inflight="inflight"
      :error="error"
      loadingMessage="Loading locations..."
      errorMessage="Unable to load locations."
      permissionsErrorMessage="Check that your employee account has 'Manage Locations' permissions."
      v-on:retry="loadLocations()"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { ILocationData } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import { DataLoadError, DataLoadErrorType } from "@/modules/data-loader/data-loader-error";

export default Vue.extend({
  name: "LocationPicker",
  store,
  components: {
    ErrorReadout
  },
  async mounted() {
    // @ts-ignore
    this.loadLocations();
  },
  props: {
    location: Object as () => ILocationData,
    suggestedLocationName: String
  },
  data() {
    return {
      locationNameQuery: "",
      inflight: false,
      error: null,
      locations: []
    };
  },
  computed: {
    locationOptions() {
      return this.$data.locations.map((location: ILocationData) => ({
        text: location.Name,
        value: location
      }));
    }
  },
  watch: {
    location: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.$data.locationNameQuery = newValue?.Name;
      }
    },
    suggestedLocationName: {
      immediate: true,
      handler() {
        (this as any).maybeSetLocationDefault();
      }
    }
  },
  methods: {
    async loadLocations() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;
        this.$data.locations = await primaryDataLoader.locations();

        (this as any).maybeSetLocationDefault();
      } catch (e) {
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }

      if (this.$data.locations.length === 0) {
        console.error("Server returned 0 locations");

        this.$data.error = new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          "Zero results returned"
        );
      }
    },
    maybeSetLocationDefault() {
      if (!this.$data.locations) {
        return;
      }

      if (!(this as any).suggestedLocationName) {
        return;
      }

      if ((this as any).location) {
        return;
      }

      const matchingLocation = this.$data.locations.find(
        (x: ILocationData) => x.Name === (this as any).suggestedLocationName
      );

      if (matchingLocation) {
        this.$emit("update:location", matchingLocation);
      }
    }
  }
});
</script>
