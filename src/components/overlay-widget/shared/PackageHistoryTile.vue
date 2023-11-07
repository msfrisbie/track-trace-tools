<template>
  <div class="flex flex-col items-center">
    <template v-if="ancestorTree">
      <template v-if="depth < maxParentVisibleDepth">
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            class="justify-end"
            v-for="subtree of filteredAncestors"
            v-bind:key="subtree.label"
            :ancestorTree="subtree"
            :depth="depth + 1"
          ></package-history-tile>
        </div>
        <div
          v-if="filteredAncestors.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-parent': filteredAncestors.length === 1,
            'multi-parent': filteredAncestors.length > 1,
          }"
        >
          <div style="border-right: 1px solid black" class="h-6"></div>
        </div>
      </template>
    </template>

    <package-history-card
      :id="isOrigin ? 'tree-origin' : ''"
      :node="childTree || ancestorTree"
      :isOrigin="isOrigin"
    ></package-history-card>

    <template v-if="childTree">
      <template v-if="depth < maxChildVisibleDepth">
        <div
          v-if="filteredChildren.length > 0"
          class="w-full flex flex-row justify-center"
          :class="{
            'one-child': filteredChildren.length === 1,
            'multi-child': filteredChildren.length > 1,
          }"
        >
          <div style="border-right: 1px solid black" class="h-6"></div>
        </div>
        <div class="flex flex-row no-wrap gap-1">
          <package-history-tile
            class="justify-start"
            v-for="subtree of filteredChildren"
            v-bind:key="subtree.label"
            :childTree="subtree"
            :depth="depth + 1"
          ></package-history-tile>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryCard from '@/components/overlay-widget/shared/PackageHistoryCard.vue';
import { HistoryTreeNodeType, PackageState } from '@/consts';
import { IPackageAncestorTreeNode, IPackageChildTreeNode } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { unitOfMeasureNameToAbbreviation } from '@/utils/units';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'PackageHistoryTile',
  store,
  router,
  props: {
    depth: Number,
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
  components: {
    PackageHistoryCard,
  },
  computed: {
    ...mapState([]),
    filteredAncestors() {
      if (store.state.packageHistory.showUnownedPackages) {
        return this.ancestorTree.ancestors;
      }
      return this.ancestorTree.ancestors.filter(
        (node) => node.type === HistoryTreeNodeType.OWNED_PACKAGE
      );
    },
    filteredChildren() {
      if (store.state.packageHistory.showUnownedPackages) {
        return this.childTree.children;
      }
      return this.childTree.children.filter(
        (node) => node.type === HistoryTreeNodeType.OWNED_PACKAGE
      );
    },
    maxParentVisibleDepth: {
      get(): number {
        return store.state.packageHistory.maxParentVisibleDepth;
      },
    },
    maxChildVisibleDepth: {
      get(): number | null {
        return store.state.packageHistory.maxChildVisibleDepth;
      },
    },
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
          return 'success';
        case PackageState.INACTIVE:
          return 'danger';
        case PackageState.IN_TRANSIT:
          return 'dark';
        default:
          return 'light';
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
