<template>
  <div style="height: 40px; overflow: hidden">
    <b-carousel v-model="slide" no-hover-pause :interval="interval" img-width="640" img-height="40"
      background="transparent" @sliding-start="onSlideStart" @sliding-end="onSlideEnd" class="promo-carousel"
      style="margin-bottom: 0 !important" ref="myCarousel">
      <b-carousel-slide v-for="(slide, index) of slides" :key="index" html="foobar" img-blank @click.native="next()">
        <template v-if="slide === 'review'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Enjoying Track & Trace Tools?</div>
            <div>
              <a class="text-purple-500 underline"
                href="https://chrome.google.com/webstore/detail/track-trace-tools/dfljickgkbfaoiifheibjpejloipegcb/reviews"
                target="_blank" @click.stop>Leave a review!</a>
              It only takes 5 seconds.
            </div>
          </div>
        </template>
        <template v-if="slide === 'shortcuts'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Quickly open T3 with keyboard shortcuts</div>
            <div>
              Use
              <b-badge variant="light" class="font-mono" style="text-shadow: none">Alt</b-badge> +
              <b-badge variant="light" class="font-mono" style="text-shadow: none">t</b-badge> or
              <b-badge variant="light" class="font-mono" style="text-shadow: none">⌥</b-badge> +
              <b-badge variant="light" class="font-mono" style="text-shadow: none">t</b-badge> to
              open/close T3
            </div>
          </div>
        </template>
        <template v-if="slide === 'forum'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Questions? Bugs? Feature ideas?</div>
            <div>
              Post in the
              <a class="text-purple-500 hover:text-purple-500 underline"
                href="https://track-trace-tools.talkyard.net/latest" target="_blank" @click.stop>Track & Trace Tools
                Forum</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'solutions'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Need custom features for your company?</div>
            <div>
              Reach out to
              <a class="text-purple-500 hover:text-purple-500 underline" href="mailto:matt@trackandtrace.tools"
                target="_blank" @click.stop>matt@trackandtrace.tools</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'opensource'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Track & Trace Tools is open source!</div>
            <div>
              Source code can be found
              <a class="text-purple-500 hover:text-purple-500 underline"
                href="https://github.com/msfrisbie/track-trace-tools" target="_blank" @click.stop>here</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'harvest'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Harvest and manicure in bulk!</div>
            <div>Use T3 to harvest thousands of plants by just the total weight.</div>
          </div>
        </template>
        <template v-if="slide === 'clickme'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Get tips even faster!</div>
            <div>Click here to skip to the next tip.</div>
          </div>
        </template>
        <template v-if="slide === 'logout'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Stop logging in over and over!</div>
            <div>Track & Trace Tools stops Metrc's auto-logout.</div>
          </div>
        </template>
        <template v-if="slide === 'finalize'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Finalize sales in bulk!</div>
            <div>T3 can auto-finalize all sales before a specific date.</div>
          </div>
        </template>
        <template v-if="slide === 'tagvoid'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Void tags in bulk!</div>
            <div>Track & Trace Tools can auto-void ranges of tags.</div>
          </div>
        </template>

        <template v-if="slide === 'snowflakes'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Snowflakes? How about noflakes!</div>
            <div>Track & Trace Tools removes the Metrc snowflakes.</div>
          </div>
        </template>
        <!-- <template v-if="slide === 'settings'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Customize Track &amp; Trace Tools</div>
            <div>Control and configure how T3 interacts with Metrc in Settings.</div>
          </div>
        </template> -->
        <template v-if="slide === 'csv'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Generate CSVs</div>
            <div>T3 can generate Metrc CSVs. Click "Download CSV" in the "Submit" step.</div>
          </div>
        </template>
        <template v-if="slide === 'plus'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Metrc Maximized</div>
            <div>
              Get access to advanced Track &amp; Trace Tools features with
              <a class="text-purple-500 hover:text-purple-500 underline" href="#"
                @click.stop="openRoute('/plus')">T3+</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'settings'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Customise Metrc Appearance</div>
            <div>
              Change the look and feel of Metrc in
              <a class="text-purple-500 hover:text-purple-500 underline" href="#"
                @click.stop="openRoute('/settings/all')">Settings</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'donate'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Support Track &amp; Trace Tools!</div>
            <div>
              Donate to the open source cannabis project
              <a class="text-purple-500 hover:text-purple-500 underline" :href="donateUrl" target="_blank"
                @click.stop>here</a>
            </div>
          </div>
        </template>
        <template v-if="slide === 'googlesheets'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">Google Sheets + Metrc</div>
            <div>Securely generate reports and export data with T3 Reports</div>
          </div>
        </template>
        <template v-if="slide === 'searchsurvey'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">T3 Search is getting an upgrade!</div>
            <div>
              <a class="text-purple-500 hover:text-purple-500 underline" href="https://forms.gle/HnGn8hAN9tMXK3fp9"
                target="_blank" @click.stop>Take this quick survey</a>
              to make sure search V2 has what you need
            </div>
          </div>
        </template>
        <template v-if="slide === 'share'">
          <div class="text-gray-700 flex flex-col justify-around gap-2">
            <div class="font-semibold ttt-purple">
              Spread the word about open source cannabis software!
            </div>
            <div class="flex flex-row justify-center items-center gap-2">
              <!-- Twitter (url, text, @mention) -->
              <a class="text-purple-500 hover:text-purple-500 underline" :href="twitterShareUrl" target="_blank"
                @click.stop>
                <font-awesome-icon :icon="['fab', 'twitter']" />
              </a>

              <!-- Facebook (url) -->
              <a class="text-purple-500 hover:text-purple-500 underline" :href="facebookShareUrl" target="_blank"
                @click.stop>
                <font-awesome-icon :icon="['fab', 'facebook']" />
              </a>

              <!-- Reddit (url, title) -->
              <a class="text-purple-500 hover:text-purple-500 underline" :href="redditShareUrl" target="_blank"
                @click.stop>
                <font-awesome-icon :icon="['fab', 'reddit']" />
              </a>

              <!-- LinkedIn (url, title, summary, source url) -->
              <a class="text-purple-500 hover:text-purple-500 underline" :href="linkedinShareUrl" target="_blank"
                @click.stop>
                <font-awesome-icon :icon="['fab', 'linkedin']" />
              </a>

              <!-- Email (subject, body) -->
              <a class="text-purple-500 hover:text-purple-500 underline" :href="emailShareUrl" target="_blank"
                @click.stop>
                <font-awesome-icon icon="envelope" />
              </a>

              <a class="text-purple-500 hover:text-purple-500 underline" :href="shareUrl" target="_blank" @click.stop>
                <font-awesome-icon icon="link" />
              </a>
            </div>
          </div>
        </template>
      </b-carousel-slide>
    </b-carousel>
  </div>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import _ from "lodash-es";
import Vue from "vue";
import { mapState } from "vuex";

const shareUrl = "https://www.trackandtrace.tools?utm_source=ttt";
const shareTitle = "Track and Trace Tools";
const shareSummary = "Supercharge your Metrc workflow";

export default Vue.extend({
  name: "PromoSlideshow",
  store,
  router,
  props: {
    interval: {
      type: Number,
      default: 30000,
    },
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      shareUrl,
      redditShareUrl: `https://reddit.com/submit?url=${shareUrl}&title=${shareTitle}`,
      twitterShareUrl: `https://twitter.com/share?url=${shareUrl}&text=${shareTitle}&via=tracktracetools`,
      linkedinShareUrl: `https://www.linkedin.com/shareArticle?url=${shareUrl}&title=${shareTitle}&summary=${shareSummary}`,
      emailShareUrl: `mailto:?subject=${shareTitle}&body=${shareUrl}`,
      facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      donateUrl: "https://buy.stripe.com/fZe9BB7Ua56yaHefYY",
      slide: 0,
      sliding: null,
      slides: _.shuffle([
        "plus",
        "review",
        "finalize",
        "tagvoid",
        "shortcuts",
        "forum",
        "clickme",
        "solutions",
        "opensource",
        "snowflakes",
        "csv",
        "harvest",
        "logout",
        "share",
        // "donate",
        "googlesheets",
        "settings",
        // "searchsurvey",
      ]),
    };
  },
  methods: {
    next() {
      // @ts-ignore
      this.$refs.myCarousel.next();
    },
    onSlideStart(slide: any) {
      this.$data.sliding = true;
    },
    onSlideEnd(slide: any) {
      this.$data.sliding = false;
    },
    openRoute(initialRoute: string) {
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute,
      });
    },
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
