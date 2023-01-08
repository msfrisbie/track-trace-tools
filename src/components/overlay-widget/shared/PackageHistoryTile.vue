<template>
  <div class="border border-black m-1 flex flex-col items-center">
    <template v-if="ancestorTree">
      <div class="flex flex-row no-wrap">
        <package-history-tile
          v-for="subtree of ancestorTree.ancestors"
          v-bind:key="subtree.label"
          :ancestorTree="subtree"
        ></package-history-tile>
      </div>
      <div>{{ ancestorTree.license }}</div>
      <div>{{ ancestorTree.label }}</div>
      <div>{{ ancestorTree.pkg?.PackageState }}</div>
    </template>

    <template v-if="childTree">
      <div>{{ childTree.license }}</div>
      <div>{{ childTree.label }}</div>
      <div class="flex flex-row no-wrap">
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
