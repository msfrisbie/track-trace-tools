<template>
  <b-card no-body>
    <div
      class="flex flex-col items-stretch gap-1 p-2"
      v-bind:class="{ 'bg-gray-200': !isOrigin, 'bg-purple-100': isOrigin }"
    >
      <div class="flex flex-row items-center justify-between gap-2">
        <span>
          <div>{{ node.pkg.LicenseNumber }}</div>
        </span>

        <b-badge :variant="getBadgeVariant(node.pkg.PackageState)">{{
          node.pkg.PackageState
        }}</b-badge>
      </div>
      <div class="font-bold">{{ node.label }}</div>
    </div>

    <template v-if="node.type === HistoryTreeNodeType.OWNED_PACKAGE">
      <hr />
      <div class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap">
        <picker-icon
          icon="box"
          style="width: 5rem"
          class="flex-shrink-0"
          :textClass="node.pkg.Quantity === 0 ? 'text-red-500' : ''"
          :text="getQuantityAndUnitDescription(node.pkg)"
        />

        <picker-card class="flex-grow" :title="`${node.pkg.ItemName}`" :label="node.pkg.Label" />
      </div>
      <hr />
      <div class="p-2">
        <template v-if="node.pkg.ProductionBatchNumber">
          <div>
            {{ node.pkg.ProductionBatchNumber }}
          </div>
          <hr class="py-1" />
        </template>
        <div>Packaged by {{ node.pkg.PackagedByFacilityLicenseNumber }}</div>
        <div>Recieved from {{ node.pkg.ReceivedFromFacilityLicenseNumber }}</div>
      </div>
    </template>
  </b-card>
</template>

<script lang="ts">
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { HistoryTreeNodeType, PackageState } from "@/consts";
import { IHistoryTreeNode } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { getQuantityAndUnitDescription } from "@/utils/package";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistoryCard",
  store,
  router,
  props: {
    node: Object as () => IHistoryTreeNode,
    isOrigin: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  components: {
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      HistoryTreeNodeType,
    };
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
    getQuantityAndUnitDescription,
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
