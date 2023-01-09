<template>
  <div class="flex flex-col items-center bg-gray-300 bg-opacity-50">
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
        class="w-full flex flex-row justify-center mt-1"
        style="border-top: 1px solid black"
      >
        <div style="border-right: 1px solid black" class="h-6"></div>
      </div>
      <div style="border: 1px solid black">
        <div>{{ ancestorTree.license }}</div>
        <div>{{ ancestorTree.label }}</div>
        <template v-if="ancestorTree.pkg?.PackageState">
          <div>{{ ancestorTree.pkg.PackageState }}</div>
        </template>
      </div>
    </template>

    <template v-if="childTree">
      <div style="border: 1px solid black">
        <div>{{ childTree.license }}</div>
        <div>{{ childTree.label }}</div>
        <template v-if="childTree.pkg?.PackageState">
          <div>{{ childTree.pkg.PackageState }}</div>
        </template>
      </div>
      <div
        v-if="childTree.children.length > 0"
        class="w-full flex flex-row justify-center mb-1"
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

<style type="text/scss" lang="scss" scoped></style>
