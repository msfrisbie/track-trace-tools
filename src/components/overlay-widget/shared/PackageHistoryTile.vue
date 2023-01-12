<template>
  <div class="flex flex-col items-center">
    <template v-if="parentNode">
      <template v-if="depth < maxDepth">
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            v-for="parentLabel of parentNode.parentLabels"
            v-bind:key="nodeId + '_' + parentLabel"
            :parentLabel="parentLabel"
            :depth="depth + 1"
            :maxDepth="maxDepth"
          ></package-history-tile>
        </div>
        <div
          v-if="parentNode.parentLabels.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-parent': parentNode.parentLabels.length === 1,
            'multi-parent': parentNode.parentLabels.length > 1,
          }"
        >
          <div style="border-right: 1px solid black" class="h-6"></div>
        </div>
      </template>
      <b-card no-body>
        <div
          class="flex flex-col items-stretch gap-1 p-2"
          v-bind:class="{ 'bg-gray-200': !isOrigin, 'bg-purple-100': isOrigin }"
        >
          <div class="flex flex-row items-center justify-between gap-2">
            <span>
              <div>{{ parentNode.pkg.LicenseNumber }}</div>
            </span>

            <b-badge :variant="getBadgeVariant(parentNode.pkg.PackageState)">{{
              parentNode.pkg.PackageState
            }}</b-badge>
          </div>
          <div class="font-bold">{{ parentNode.label }}</div>
        </div>
        <template v-if="isOrigin">
          <hr />
          <div
            class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap"
          >
            <picker-icon
              icon="box"
              style="width: 5rem"
              class="flex-shrink-0"
              :textClass="parentNode.pkg.Quantity === 0 ? 'text-red-500' : ''"
              :text="`${parentNode.pkg.Quantity} ${parentNode.pkg.UnitOfMeasureAbbreviation}`"
            />

            <picker-card
              class="flex-grow"
              :title="`${parentNode.pkg.Item.Name}`"
              :label="parentNode.pkg.Label"
            />
          </div>
        </template>
        <hr />
        <div class="p-2">
          <div v-if="parentNode.pkg.PackagedByFacilityLicenseNumber">
            Packaged by {{ parentNode.pkg.PackagedByFacilityLicenseNumber }}
          </div>
          <div v-if="parentNode.pkg.ReceivedFromFacilityLicenseNumber">
            Recieved from {{ parentNode.pkg.ReceivedFromFacilityLicenseNumber }}
          </div>
        </div>
      </b-card>
    </template>

    <template v-if="childNode">
      <b-card no-body>
        <div
          class="flex flex-col items-stretch gap-1 p-2"
          v-bind:class="{ 'bg-gray-200': !isOrigin, 'bg-purple-100': isOrigin }"
        >
          <div class="flex flex-row items-center justify-between gap-2">
            <span>
              <div>{{ childNode.pkg.LicenseNumber }}</div>
            </span>

            <b-badge :variant="getBadgeVariant(childNode.pkg.PackageState)">{{
              childNode.pkg.PackageState
            }}</b-badge>
          </div>
          <div class="font-bold">{{ childLabel }}</div>
        </div>
        <template v-if="isOrigin">
          <hr />
          <div
            class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap"
          >
            <picker-icon
              icon="box"
              style="width: 5rem"
              class="flex-shrink-0"
              :textClass="childNode.pkg.Quantity === 0 ? 'text-red-500' : ''"
              :text="`${childNode.pkg.Quantity} ${childNode.pkg.UnitOfMeasureAbbreviation}`"
            />

            <picker-card
              class="flex-grow"
              :title="`${childNode.pkg.Item.Name}`"
              :label="childNode.pkg.Label"
            />
          </div>
        </template>
        <hr />
        <div class="p-2">
          <div v-if="childNode.pkg.PackagedByFacilityLicenseNumber">
            Packaged by {{ childNode.pkg.PackagedByFacilityLicenseNumber }}
          </div>
          <div v-if="childNode.pkg.ReceivedFromFacilityLicenseNumber">
            Recieved from {{ childNode.pkg.ReceivedFromFacilityLicenseNumber }}
          </div>
        </div>
      </b-card>

      <template v-if="depth < maxDepth">
        <div
          v-if="childNode.childLabels.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-child': childNode.childLabels.length === 1,
            'multi-child': childNode.childLabels.length > 1,
          }"
          style="border-bottom: 1px solid black"
        >
          <div style="border-right: 1px solid black" class="h-6"></div>
        </div>
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            v-for="childLabel of childNode.childLabels"
            v-bind:key="nodeId + '_' + childLabel"
            :childLabel="childLabel"
            :depth="depth + 1"
            :maxDepth="maxDepth"
          ></package-history-tile>
        </div>
      </template>
    </template>

    <template v-if="!parentNode && !childNode">
      <b-card no-body>
        <div
          class="flex flex-col items-stretch gap-1 p-2"
          v-bind:class="{ 'bg-gray-200': !isOrigin, 'bg-purple-100': isOrigin }"
        >
          <div class="font-bold">
            <template v-if="childLabel">{{ childLabel }}</template>
            <template v-if="parentLabel">{{ parentLabel }}</template>
          </div>
        </div>
      </b-card>
    </template>
  </div>
</template>

<script lang="ts">
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { HistoryTreeNodeType, PackageState } from "@/consts";
import { IChildPackageTreeNode, IParentPackageTreeNode, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import { v4 as uuidv4 } from "uuid";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistoryTile",
  store,
  router,
  props: {
    depth: Number,
    maxDepth: {
      type: Number,
      required: false,
      default: 20,
    },
    isOrigin: {
      type: Boolean,
      required: false,
      default: false,
    },
    childLabel: {
      type: String,
      required: false,
    },
    parentLabel: {
      type: String,
      required: false,
    },
  },
  components: {
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      parentTree: (state: IPluginState) => state.packageHistory.parentTree,
      childNode: (state: IPluginState) => state.packageHistory.childTree,
    }),
    parentNode(): IParentPackageTreeNode | null {
      if (!this.$store.state.packageHistory.parentTree) {
        return null;
      }
      return this.$store.state.packageHistory.parentTree[this.parentLabel];
    },
    childNode(): IChildPackageTreeNode | null {
      if (!this.$store.state.packageHistory.childTree) {
        return null;
      }
      return this.$store.state.packageHistory.childTree[this.childLabel];
    },
  },
  data() {
    return {
      nodeId: uuidv4(),
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
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.one-child {
  border-bottom: 1px solid transparent;
}

.multi-child {
  border-bottom: 1px solid black;
  margin-bottom: 0.5rem;
}

.one-parent {
  border-top: 1px solid transparent;
}

.multi-parent {
  border-top: 1px solid black;
  margin-top: 0.5rem;
}

.origin {
  border-width: 2px;
  border-style: solid;
}
</style>
