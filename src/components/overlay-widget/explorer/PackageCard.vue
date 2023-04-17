<template>
  <div class="rounded-md border border-solid ttt-purple-border overflow-hidden">
    <div class="flex flex-col items-stretch gap-1 p-2 ttt-purple-bg text-white">
      <div class="flex flex-row items-center justify-between gap-2">
        <span>
          <div>{{ pkg.LicenseNumber }}</div>
        </span>

        <b-badge :variant="getBadgeVariant(pkg.PackageState)">{{ pkg.PackageState }}</b-badge>
      </div>
      <!-- <div class="font-bold">{{ pkg.Label }}</div> -->
    </div>

    <hr />
    <div class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap">
      <picker-icon
        icon="box"
        style="width: 5rem"
        class="flex-shrink-0"
        :textClass="pkg.Quantity === 0 ? 'text-red-500' : ''"
        :text="`${pkg.Quantity} ${pkg.UnitOfMeasureAbbreviation}`"
      />

      <picker-card class="flex-grow" :title="`${pkg.Item.Name}`" :label="pkg.Label" />
    </div>
    <hr />
    <div class="p-2 text-gray-500">
      <template v-if="pkg.ProductionBatchNumber">
        <div>
          {{ pkg.ProductionBatchNumber }}
        </div>
        <hr class="py-1" />
      </template>
      <div>Packaged by {{ pkg.PackagedByFacilityLicenseNumber }}</div>
      <div v-if="pkg.ReceivedFromFacilityLicenseNumber">
        Recieved from {{ pkg.ReceivedFromFacilityLicenseNumber }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { PackageState } from "@/consts";
import { IIndexedPackageData } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageCard",
  store,
  router,
  props: {
    pkg: Object as () => IIndexedPackageData,
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
    getBadgeVariant(packageState: PackageState): string {
      switch (packageState) {
        case PackageState.ACTIVE:
          return "success";
        case PackageState.INACTIVE:
          return "danger";
        case PackageState.IN_TRANSIT:
          return "dark";
        default:
          return "light";
      }
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.origin {
  border-width: 2px;
  border-style: solid;
}
</style>
