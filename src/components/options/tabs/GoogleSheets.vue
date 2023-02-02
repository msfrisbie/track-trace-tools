<template>
  <div class="flex flex-col items-center gap-4">
    <o-auth-login></o-auth-login>
  </div>
</template>

<script lang="ts">
import OAuthLogin from "@/components/shared/OAuthLogin.vue";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "GoogleSheets",
  store,
  router,
  props: {
    enabled: Boolean,
  },
  components: {
    OAuthLogin,
  },
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
