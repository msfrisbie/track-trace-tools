<template>
  <b-card
    @click="open()"
    variant="ttt"
    class="cursor-pointer hover:bg-purple-100 hover:border hover:border-purple-600"
  >
    <div>{{ title }}</div>
    <template v-if="loading">
      <b-spinner small variant="ttt" class="mt-4"></b-spinner>
    </template>
    <template v-else>
      <div class="text-2xl t-4">
        <template v-if="count > 0">
          <span class="ttt-purple">{{ count }}</span>
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </div>
    </template>
  </b-card>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "DashboardCard",
  store,
  router,
  props: {
    title: String,
    count: Number,
    loading: Boolean,
    url: String,
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    open() {
      try {
        analyticsManager.track(
          MessageType.CLICKED_DASHBOARD_CARD_LINK,
          JSON.parse(decodeURI(this.$props.url.split("#")[1]))
        );
      } catch (e) {}
      window.location.href = this.$props.url;
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
