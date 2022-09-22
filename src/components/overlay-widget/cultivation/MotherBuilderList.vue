<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-stretch space-y-8 w-72">
      <div class="text-center text-lg">Type of mother:</div>
      <b-button @click="open('/cultivator/mother/plants')" variant="outline-success"
        >MATURE PLANTS</b-button
      >
      <b-button @click="open('/cultivator/mother/plant-batches')" variant="outline-success"
        >IMMATURE PLANTS <b-badge class="ml-2 opacity-50" variant="success">BETA</b-badge></b-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { MessageType } from "@/consts";

export default Vue.extend({
  name: "MotherBuilderList",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([])
  },
  data() {
    return {};
  },
  methods: {
    open(route: string) {
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${route}`
      });

      this.$router.push(route);
    }
  },
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss" scoped></style>
