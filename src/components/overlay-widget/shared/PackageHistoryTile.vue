<template>
  <div class="flex flex-col items-center">
    <template v-if="ancestorTree">
      <div class="flex flex-row no-wrap gap-1">
        <package-history-tile
          v-for="subtree of ancestorTree.ancestors"
          v-bind:key="subtree.label"
          :ancestorTree="subtree"
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
      <b-card>
        <div>{{ ancestorTree.license }}</div>
        <div>{{ ancestorTree.label }}</div>
        <template v-if="ancestorTree.pkg?.PackageState">
          <div>{{ ancestorTree.pkg.PackageState }}</div>
        </template>
      </b-card>
    </template>

    <template v-if="childTree">
      <b-card>
        <div>{{ childTree.license }}</div>
        <div>{{ childTree.label }}</div>
        <template v-if="childTree.pkg?.PackageState">
          <div>{{ childTree.pkg.PackageState }}</div>
        </template>
      </b-card>
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
        ></package-history-tile>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
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
    return {};
  },
  methods: {},
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
</style>
