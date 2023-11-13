<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-stretch max-w-lg gap-4">
      <div class="text-xl text-center">
        Track &amp; Trace Tools can export directly to Google Sheets.
      </div>
      <div class="text-md text-gray-600 text-center">
        Sign in to your Google account to enable this feature. Only available with T3+.
      </div>

      <div class="flex flex-col items-center">
        <iframe
          width="640"
          height="400"
          src="https://www.youtube.com/embed/JBR21XSKK3I"
          title="Generating reports with Track &amp; Trace Tools"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <hr />

      <div class="flex flex-col items-center">
        <o-auth-login></o-auth-login>
      </div>
    </div>
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
