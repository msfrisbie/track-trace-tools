<template>
  <div class="flex flex-col space-y-2 items-stretch">
    <div class="text-xl text-gray-800">
      {{ facility.FacilityName }}
    </div>
    <div class="text-md text-gray-500">
      {{ facility.LicenseNumber }}
    </div>
    <!-- <div>
      <div
        class="text-md text-gray-500"
        v-for="addressLine of addressLines"
        v-bind:key="addressLine"
      >
        {{ addressLine }}
      </div>
    </div> -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { IMetrcFacilityData } from "@/interfaces";
import { facilityReadableAddressLinesOrNull } from "@/utils/address";

export default Vue.extend({
  name: "FacilitySummary",
  store,
  router,
  props: {
    facility: Object as () => IMetrcFacilityData,
  },
  components: {},
  computed: {
    ...mapState([]),
    // addressLines(): string[] | null {
    //   return facilityReadableAddressLinesOrNull(
    //     this.facility as IMetrcFacilityData
    //   );
    // },
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
