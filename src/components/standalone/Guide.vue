<template>
  <div style="height: 100vh">
    <div class="flex flex-col p-4 space-y-6" style="height: 100%; overflow-y: auto">
      <div class="flex flex-row justify-between items-center">
        <title-banner />

        <div class="text-center text-gray-500">v{{ version }}</div>
      </div>

      <b-card no-body class="flex-grow">
        <b-tabs pills card vertical class="flex-grow" active-nav-item-class="ttt-purple-bg">
          <b-tab title="Welcome" active
            ><b-card-text class="flex flex-col items-center text-center gap-8"
              ><p class="text-2xl ttt-purple">Thanks for installing Track &amp; Trace Tools!</p>

              <p>
                You're all set! Track &amp; Trace Tools will automatically be added to metrc.com
                next time you use it.
              </p>

              <div class="flex flex-col items-center gap-2">
                <div
                  class="fake-metrc-container flex flex-row justify-end items-end border-b border-r border-gray-500"
                  style="height: 250px; width: 500px"
                >
                  <b-button variant="primary" title="Toolbox" style="padding: 0">
                    <track-trace-tools-logo
                      fill="#49276a"
                      :inverted="true"
                      style="height: 52px; width: 52px"
                    />
                  </b-button>
                </div>

                <div class="text-sm text-gray-600 text-center">
                  The Toolbox button will appear in the bottom right. <br />
                  Click it to access tools and change your settings.
                </div>
              </div>
            </b-card-text>
          </b-tab>

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
                <a class="ttt-purple underline" v-bind:href="email"> tracktracetools@gmail.com </a>
              </div>
            </b-card-text></b-tab
          >
          <b-tab title="FAQ"
            ><b-card-text class="flex flex-col items-center text-center gap-8">
              <div id="faq" class="flex flex-col items-center px-6">
                <div class="flex flex-col items-stretch max-w-md gap-16">
                  <!-- <div class="text-center text-5xl font-light ttt-purple">FAQ</div> -->
                  <div class="flex flex-col text-start items-stretch gap-8 text-lg">
                    <div class="font-bold ttt-purple opacity-75">
                      What is Track &amp; Trace Tools?
                    </div>

                    <div>
                      Track &amp; Trace Tools (TTT) is an open source Chrome extension that
                      integrates with Metrc to add extra features. It is not affiliated with Metrc.
                    </div>
                    <hr />
                    <div class="font-bold ttt-purple opacity-75">
                      How do I get Track &amp; Trace Tools?
                    </div>
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
                          <a
                            class="ttt-purple underline"
                            v-bind:href="githubReleasesUrl"
                            target="_blank"
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
                    <div class="font-bold ttt-purple opacity-75">
                      How do I request a custom feature?
                    </div>
                    <div>
                      If you would like a custom feature made for your company,
                      <a class="ttt-purple underline" v-bind:href="email"> send an email</a>.
                    </div>
                    <hr />
                    <div class="font-bold ttt-purple opacity-75">What does "open source" mean?</div>
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
                    <div class="font-bold ttt-purple opacity-75">
                      What does the MIT license mean?
                    </div>
                    <div>
                      You can read the MIT license
                      <a v-bind:href="mitLicenseUrl" target="_blank" class="ttt-purple underline">
                        here</a
                      >. Some things to note:
                      <ul class="list-disc ml-4 my-6 flex flex-col gap-4">
                        <li>Track &amp; Trace Tools has no warranty of any kind.</li>
                        <li>
                          Track &amp; Trace Tools is provided as-is. The author cannot be held
                          liable for the software, use at your own risk.
                        </li>
                      </ul>
                    </div>
                    <hr />
                    <div class="font-bold ttt-purple opacity-75">Where should I ask questions?</div>
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

          <b-tab title="License"
            ><b-card-text class="flex flex-col gap-4"
              ><p>MIT License</p>

              <p>Copyright (c) 2022 Matt Frisbie</p>

              <p>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the "Software"), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
              </p>

              <p>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>

              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </b-card-text></b-tab
          >
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { version } from "@/modules/version";
import Vue from "vue";
import router from "./router";

require("@/assets/images/metrc-background.svg");

export default Vue.extend({
  name: "Guide",
  router,
  props: {},
  components: {
    TitleBanner,
    TrackTraceToolsLogo,
  },
  computed: {},
  data() {
    return {
      webStoreUrl: "https://chrome.google.com/webstore/detail/dfljickgkbfaoiifheibjpejloipegcb",
      githubUrl: "https://github.com/msfrisbie/track-trace-tools",
      githubReleasesUrl: "https://github.com/msfrisbie/track-trace-tools/releases",
      forumUrl: "https://track-trace-tools.talkyard.net/latest",
      email: "mailto:tracktracetools@gmail.com",
      mitLicenseUrl: "https://github.com/msfrisbie/track-trace-tools/blob/master/LICENSE.md",
      version,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.fake-metrc-container {
  background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 90%,
      rgba(255, 255, 255, 1) 100%
    ),
    linear-gradient(
      to left,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 95%,
      rgba(255, 255, 255, 1) 100%
    ),
    url(/img/metrc-background.svg);
  padding: 4rem 1rem 1rem 4rem;
}
</style>
