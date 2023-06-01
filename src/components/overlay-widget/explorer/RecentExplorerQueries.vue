<template>
  <div class="flex flex-col items-stretch gap-2 pt-16">
    <span v-if="explorer.recent.length > 0">Recent queries:</span>
    <smart-link
      v-for="(smartLink, idx) of explorer.recent"
      v-bind:key="idx + smartLink.queryString"
      :text="smartLink.queryString"
      :targetType="smartLink.targetType"
    ></smart-link>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerTargetType } from "@/store/page-overlay/modules/explorer/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import SmartLink from "./SmartLink.vue";

export default Vue.extend({
  name: "RecentExplorerQueries",
  store,
  router,
  props: {},
  components: {
    SmartLink,
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
  },
  data() {
    return {
      ExplorerTargetType,
    };
  },
  methods: {
    ...mapActions({}),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
