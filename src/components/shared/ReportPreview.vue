<template>
  <div>{{ reportType }}</div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ReportPreview",
  store,
  router,
  props: {
    reportType: String as () => ReportType,
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
