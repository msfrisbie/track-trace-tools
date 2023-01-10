<template>
  <div class="flex flex-col items-center">
    <template v-if="ancestorTree">
      <template v-if="depth < maxDepth">
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            v-for="subtree of ancestorTree.ancestors"
            v-bind:key="subtree.label"
            :ancestorTree="subtree"
            :depth="depth + 1"
            :maxDepth="maxDepth"
          ></package-history-tile>
        </div>
        <div
          v-if="ancestorTree.ancestors.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-parent': ancestorTree.ancestors.length === 1,
            'multi-parent': ancestorTree.ancestors.length > 1,
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
              <div>{{ ancestorTree.pkg.LicenseNumber }}</div>
            </span>

            <b-badge :variant="getBadgeVariant(ancestorTree.pkg.PackageState)">{{
              ancestorTree.pkg.PackageState
            }}</b-badge>
          </div>
          <div class="font-bold">{{ ancestorTree.label }}</div>
        </div>
        <template v-if="ancestorTree.type === HistoryTreeNodeType.OWNED_PACKAGE">
          <hr />
          <div class="p-2">
            <div v-if="ancestorTree.pkg.PackagedByFacilityLicenseNumber">
              Packaged by {{ ancestorTree.pkg.PackagedByFacilityLicenseNumber }}
            </div>
            <div v-if="ancestorTree.pkg.ReceivedFromFacilityLicenseNumber">
              Recieved from {{ ancestorTree.pkg.ReceivedFromFacilityLicenseNumber }}
            </div>
          </div>
        </template>
      </b-card>
    </template>

    <template v-if="childTree">
      <b-card no-body>
        <div
          class="flex flex-col items-stretch gap-1 p-2"
          v-bind:class="{ 'bg-gray-200': !isOrigin, 'bg-purple-100': isOrigin }"
        >
          <div class="flex flex-row items-center justify-between gap-2">
            <span>
              <div>{{ childTree.pkg.LicenseNumber }}</div>
            </span>

            <b-badge :variant="getBadgeVariant(childTree.pkg.PackageState)">{{
              childTree.pkg.PackageState
            }}</b-badge>
          </div>
          <div class="font-bold">{{ childTree.label }}</div>
        </div>
        <template v-if="childTree.type === HistoryTreeNodeType.OWNED_PACKAGE">
          <hr />
          <div class="p-2">
            <div v-if="childTree.pkg.PackagedByFacilityLicenseNumber">
              Packaged by {{ childTree.pkg.PackagedByFacilityLicenseNumber }}
            </div>
            <div v-if="childTree.pkg.ReceivedFromFacilityLicenseNumber">
              Recieved from {{ childTree.pkg.ReceivedFromFacilityLicenseNumber }}
            </div>
          </div>
        </template>
      </b-card>

      <template v-if="depth < maxDepth">
        <div
          v-if="childTree.children.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-child': childTree.children.length === 1,
            'multi-child': childTree.children.length > 1,
          }"
          style="border-bottom: 1px solid black"
        >
          <div style="border-right: 1px solid black" class="h-6"></div>
        </div>
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            v-for="subtree of childTree.children"
            v-bind:key="subtree.label"
            :childTree="subtree"
            :depth="depth + 1"
            :maxDepth="maxDepth"
          ></package-history-tile>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { HistoryTreeNodeType, PackageState } from "@/consts";
import { IPackageAncestorTreeNode, IPackageChildTreeNode } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistoryTile",
  store,
  router,
  props: {
    depth: Number,
    maxDepth: { type: Number, required: false, default: 20 },
    isOrigin: {
      type: Boolean,
      required: false,
      default: false,
    },
    childTree: {
      type: Object as () => IPackageChildTreeNode,
      required: false,
    },
    ancestorTree: {
      type: Object as () => IPackageAncestorTreeNode,
      required: false,
    },
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      HistoryTreeNodeType,
    };
  },
  methods: {
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
