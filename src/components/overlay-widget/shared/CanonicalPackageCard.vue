<template>
  <div class="rounded-md border border-solid overflow-hidden">
    <div class="flex flex-col items-stretch gap-1 p-2">
      <div class="flex flex-row items-center justify-between gap-2">
        <span class="text-sm">{{ pkg.LicenseNumber }} </span>

        <b-badge :variant="getBadgeVariant(pkg.PackageState)">{{ pkg.PackageState }}</b-badge>
      </div>
    </div>

    <hr />

    <div class="p-2 flex flex-row items-center justify-start space-x-4 text-sm">
      <picker-icon icon="box" style="width: 5rem" class="flex-shrink-0"
        :textClass="pkg.Quantity === 0 ? 'text-red-500' : ''" :text="getQuantityAndUnitDescription(pkg)" />

      <div class="flex flex-col items-start space-y-2">
        <span class="text-md text-gray-700">{{ getItemNameOrError(pkg) }}</span>

        <dual-color-tag class="text-sm" :label="getLabelOrError(pkg)" />
      </div>
    </div>
    <template v-if="hasVisibleSecondaryAttributes">
      <hr />

      <div class="p-2 text-gray-500">
        <template v-if="showProductionBatchNumber">
          <div v-if="getProductionBatchNumberOrError(pkg)">
            {{ getProductionBatchNumberOrError(pkg) }}
          </div>
          <hr class="py-1" />
        </template>

        <template v-if="showPackagedBy">
          <div v-if="getPackagedByFacilityLicenseNumberOrError(pkg)">
            Packaged by {{ getPackagedByFacilityLicenseNumberOrError(pkg) }}
          </div>
        </template>

        <template v-if="showReceivedFrom">
          <div v-if="getReceivedFromFacilityLicenseNumberOrError(pkg)">
            Recieved from {{ getReceivedFromFacilityLicenseNumberOrError(pkg) }}
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import DualColorTag from "@/components/overlay-widget/shared/DualColorTag.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { PackageState } from "@/consts";
import { IPluginState, IUnionIndexedPackageData } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  getItemNameOrError,
  getLabelOrError,
  getPackagedByFacilityLicenseNumberOrError,
  getProductionBatchNumberOrError,
  getQuantityAndUnitDescription,
  getReceivedFromFacilityLicenseNumberOrError,
} from "@/utils/package";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "CanonicalPackageCard",
  store,
  router,
  props: {
    pkg: Object as () => IUnionIndexedPackageData,
    showProductionBatchNumber: {
      type: Boolean,
      default: false,
    },
    showPackagedBy: {
      type: Boolean,
      default: false,
    },
    showReceivedFrom: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    DualColorTag,
    // PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
    hasVisibleSecondaryAttributes(): boolean {
      if (
        this.$props.showProductionBatchNumber &&
        getProductionBatchNumberOrError(this.$props.pkg)
      ) {
        return true;
      }

      if (
        this.$props.showPackagedBy &&
        getPackagedByFacilityLicenseNumberOrError(this.$props.pkg)
      ) {
        return true;
      }

      if (
        this.$props.showReceivedFrom &&
        getReceivedFromFacilityLicenseNumberOrError(this.$props.pkg)
      ) {
        return true;
      }

      return false;
    },
  },
  data() {
    return {};
  },
  methods: {
    getLabelOrError,
    getItemNameOrError,
    getProductionBatchNumberOrError,
    getPackagedByFacilityLicenseNumberOrError,
    getReceivedFromFacilityLicenseNumberOrError,
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
    getQuantityAndUnitDescription,
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
