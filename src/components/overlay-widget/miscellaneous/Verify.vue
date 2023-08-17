<template>
  <div>
    <div>Verify</div>
    <b-button @click="testVerify()">TEST</b-button>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { t3RequestManager } from "@/modules/t3-request-manager.module";

export default Vue.extend({
  name: "Verify",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    testVerify() {
      t3RequestManager.testVerify().then((response) => console.log(response.data));
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
