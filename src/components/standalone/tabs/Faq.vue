<template>
  <b-tab title="FAQ"
    ><b-card-text class="flex flex-col items-center text-center gap-8">
      <div id="faq" class="flex flex-col items-center px-6">
        <div class="flex flex-col items-stretch max-w-md gap-16">
          <div class="flex flex-col text-start items-stretch gap-8 text-lg">
            <div class="text-2xl ttt-purple">What is Track &amp; Trace Tools?</div>

            <div>
              Track &amp; Trace Tools (TTT) is an open source Chrome extension that integrates with
              Metrc to add extra features. It is not affiliated with Metrc.
            </div>
            <hr />
            <div class="text-2xl ttt-purple">How do I get Track &amp; Trace Tools?</div>
            <div>
              <div>There are several ways of installing Track &amp; Trace Tools:</div>
              <ul class="list-disc ml-4 mt-6 flex flex-col gap-4">
                <li>
                  Install the
                  <a class="ttt-purple underline" v-bind:href="webStoreUrl" target="_blank">
                    Track &amp; Trace Tools extension</a
                  >
                  from the Chrome Web Store (recommended)
                </li>
                <li>
                  <a class="ttt-purple underline" v-bind:href="githubReleasesUrl" target="_blank"
                    >Download a prebuilt release</a
                  >
                  and install it locally
                </li>
                <li>
                  <a class="ttt-purple underline" v-bind:href="githubUrl" target="_blank">
                    Build the extension from source</a
                  >
                  and install it locally
                </li>
              </ul>
            </div>
            <hr />
            <div class="text-2xl ttt-purple">How do I request a custom feature?</div>
            <div>
              If you would like a custom feature made for your company,
              <a class="ttt-purple underline" v-bind:href="email"> send an email</a>.
            </div>
            <hr />
            <div class="text-2xl ttt-purple">What does "open source" mean?</div>
            <div>
              The Track &amp; Trace Tools source code is
              <a class="ttt-purple underline" v-bind:href="githubUrl" target="_blank">
                publicly available here</a
              >. It is released under the
              <a v-bind:href="mitLicenseUrl" target="_blank" class="ttt-purple underline"
                >MIT license</a
              >.
            </div>
            <hr />
            <div class="text-2xl ttt-purple">What does the MIT license mean?</div>
            <div>
              You can read the MIT license
              <a v-bind:href="mitLicenseUrl" target="_blank" class="ttt-purple underline"> here</a>.
              Some things to note:
              <ul class="list-disc ml-4 my-6 flex flex-col gap-4">
                <li>Track &amp; Trace Tools has no warranty of any kind.</li>
                <li>
                  Track &amp; Trace Tools is provided as-is. The author cannot be held liable for
                  the software, use at your own risk.
                </li>
              </ul>
            </div>
            <hr />
            <div class="text-2xl ttt-purple">Where should I ask questions?</div>
            <div>
              Questions, bug reports, and feature requests should be posted in the
              <a class="ttt-purple underline" v-bind:href="forumUrl" target="_blank">
                Track &amp; Trace Tools Forum</a
              >.
            </div>
          </div>
        </div>
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
  name: "Faq",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      webStoreUrl: "https://chrome.google.com/webstore/detail/dfljickgkbfaoiifheibjpejloipegcb",
      githubUrl: "https://github.com/msfrisbie/track-trace-tools",
      githubReleasesUrl: "https://github.com/msfrisbie/track-trace-tools/releases",
      forumUrl: "https://track-trace-tools.talkyard.net/latest",
      email: "mailto:tracktracetools@gmail.com",
      mitLicenseUrl: "https://github.com/msfrisbie/track-trace-tools/blob/master/LICENSE.md",
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
