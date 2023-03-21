<template>
  <div class="flex flex-col items-center gap-8">
    <div class="flex flex-col items-stretch max-w-lg gap-8 my-16">
      <div class="text-center text-5xl font-light ttt-purple">Introducing T3+</div>
      <div class="flex flex-col text-start items-stretch gap-4 text-lg">
        <div class="font-bold ttt-purple opacity-75 text-center text-xl pb-4">
          Maximize your Metrc potential.
        </div>
        <div class="text-center flex flex-col items-center gap-1 py-4">
          <div class="font-semibold ttt-purple text-4xl opacity-90">$99/year</div>
          <div class="text-center text-xs text-gray-500">per Metrc user</div>
        </div>
        <div class="text-center text-sm text-gray-500">
          Discounted pricing is available for multiple users.
        </div>
        <a
          role="button"
          tabindex="0"
          href="mailto:tracktracetools@gmail.com?subject=Interest in T3 Plus&amp;body=I'm interested in getting access to T3 Plus. 

Please let me know next steps!"
          class="ttt-purple-bg btn btn-primary mb-12"
          >ASK ABOUT T3+</a
        >
        <div class="text-2xl ttt-purple">What is T3+?</div>
        <div class="pb-4">
          T3+ is a suite of advanced analytics tools designed to help you maximize the potential of
          Metrc. With T3+, you can now take your data-driven decision-making to the next level and
          gain deep insights into your Metrc data.
        </div>
        <div class="text-2xl ttt-purple">How is T3+ different?</div>
        <div class="pb-4">
          T3+ is the paid version of Track &amp; Trace Tools. The open source version will be free
          to the cannabis community forever.
        </div>
        <div class="text-2xl ttt-purple">What you get with T3+:</div>
        <ul class="list-disc">
          <li>
            <span class="font-semibold text-purple-700">Advanced snapshots</span>
            such as Outgoing Transfer Manifests, Straggler Inventory, Harvested Plants, and
            Quickviews
          </li>
          <li>
            <span class="font-semibold text-purple-700">Package history explorer</span>
            which allows you to explore the entire tree of source and child packages.
          </li>
          <li>
            <span class="font-semibold text-purple-700">Early access</span>
            to all new and experimental Track &amp; Trace Tools and T3+ features
          </li>
          <li>
            <span class="font-semibold text-purple-700">Priority support</span>
            for all Track &amp; Trace Tools features
          </li>
          <li>
            <span class="font-semibold text-purple-700">Tooling customization</span>
            for Track &amp; Trace Tools
          </li>
          <li>
            <span class="font-semibold text-purple-700">Supports the open source project</span>.
            Track &amp; Trace Tools will be free for the cannabis community<span
              class="italic"
            ></span>
            forever.
          </li>
        </ul>
      </div>
    </div>
  </div>
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
