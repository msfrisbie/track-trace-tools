<template>
  <b-tab title="Custom Features"
    ><b-card-text class="flex flex-col items-center text-center gap-8"
      ><p class="text-2xl ttt-purple">No two cannabis businesses are alike.</p>

      <div class="max-w-2xl">
        Track &amp; Trace Tools might not exactly match how your company does compliance.
        <br />Custom features can be privately developed and deployed to your team.
      </div>

      <div class="max-w-lg flex flex-col items-start gap-4 py-8">
        <div class="w-full text-center text-lg ttt-purple">Examples:</div>
        <ul class="list-disc flex flex-col items-start gap-4">
          <li>Customizing the transfer window to accelerate logistics</li>
          <li>Notifications about incoming and outgoing transfers</li>
          <li>Custom report generation tools</li>
          <li>Dashboards for rapidly viewing and analyzing your operation</li>
          <li>Data export and integration solutions</li>
        </ul>
      </div>

      <div>
        Let's discuss your custom solution!
        <a class="ttt-purple underline" href="mailto:tracktracetools@gmail.com">
          tracktracetools@gmail.com
        </a>
      </div>
    </b-card-text></b-tab
  >
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "Welcome",
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
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
