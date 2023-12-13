<template>
  <builder-list :options="options"></builder-list>
</template>

<script lang="ts">
import BuilderList from "@/components/overlay-widget/shared/BuilderList.vue";
import { env } from "@/modules/environment.module";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "TransferBuilderListView",
  store,
  components: {
    BuilderList,
  },
  methods: {},
  data() {
    return {
      options: [
        {
          backgroundColor: "#773c77",
          text: "CSV TRANSFER FILL",
          route: "/transfer/csv-fill",
          icon: "file-csv",
          enabled:
            env() === "development" &&
            (store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus),
          visible: true,
          isBeta: false,
          isNew: false,
          isPlus: true,
        },
        {
          backgroundColor: "#773c77",
          text: "TRANSFER BUILDER",
          route: "/transfer/transfer-builder",
          icon: "truck-loading",
          enabled: store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus,
          visible: true,
          isBeta: false,
          isNew: false,
          isPlus: true,
          helpRoute: "/help/transfer",
        },
        // {
        //   route: "/transfer/transfer-builder-template",
        //   text: "CREATE TEMPLATE",
        //   icon: "truck-loading",
        //   backgroundColor: "#773c77",
        //   enabled: isCurrentHostAllowed([]),
        // },
        // {
        //   route: '/transfer',
        //   text: 'TRANSFER TRACKING PAGES',
        //   icon: 'tasks',
        //   backgroundColor: '#773c77',
        //   enabled: isCurrentHostAllowed([]),
        // },
        // {
        //   route: "/transfer",
        //   text: "INBOUND TRANSPORT LINKS",
        //   icon: "link",
        //   backgroundColor: "#773c77",
        //   enabled: isCurrentHostAllowed([]),
        // },
      ],
    };
  },
  async mounted() {},
  async created() {},
  computed: {},
});
</script>

<style type="text/scss" lang="scss"></style>
