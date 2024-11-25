<template>
  <div class="grid grid-cols-2 gap-8" style="grid-template-columns: minmax(400px, auto) 1fr;">
    <div class="flex flex-col gap-2 h-full p-4">
      <a class="shadow-xl py-4 px-4 mb-8 rounded-md no-underline bg-gradient-to-r from-purple-800 to-purple-400 hover:from-purple-700 hover:to-purple-300 text-white text-3xl font-light flex flex-row items-center gap-6 justify-between"
        href="https://dash.trackandtrace.tools" style="text-decoration: none" target="_blank"><span>GET T3+</span><span
          class="bounce">→</span></a>
      <div v-for="entry of entries" v-bind:key="entry.question" @click="selectEntry(entry)">
        <span class="text-xl font-light ttt-purple hover:underline cursor-pointer hover:text-purple-300">&#8250;&nbsp;{{
          entry.question }}</span>
      </div>
    </div>
    <div class="overflow-y-auto toolkit-scroll h-full flex flex-col gap-12 p-4" ref="answers">
      <div class="flex flex-col gap-4 p-4 rounded-xl shadow border-2 border-red-500 bg-gray-800 text-white"
        v-if="!hasPlus && isChristmasSeason">
        <h2 class="text-3xl font-bold">Black Friday Deal for T3+</h2>
        <p>New subscribers can enjoy <span class="font-semibold text-red-500">33% off</span> their T3+ subscription for
          the first 3 months!</p>
        <p>Don't miss out on this limited-time offer. Available until <strong>12/8/2024</strong>.</p>
        <p class="text-xl py-6">Use coupon code <span class="font-semibold text-red-500 font-mono">BLACKFRIDAY</span> at
          checkout on Stripe
          to claim your discount.
        </p>
        <p class="italic">Offer valid only for new subscribers.</p>
        <b-button class="max-w-sm" variant="danger" size="lg" href="https://dash.trackandtrace.tools"
          target="_blank">GET THIS
          DEAL</b-button>
      </div>

      <div v-bind:class="{ 'bg-purple-50': entry === selectedEntry }" :id="entry.id" v-for="entry of entries"
        v-bind:key="entry.id" class="flex flex-col gap-4 p-4 rounded-xl shadow" v-html="entry.answerHtml"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { hasPlusImpl } from "@/utils/plus";
// The marked import structure is causing problems
// @ts-ignore
import * as marked from "marked/lib/marked.cjs";
import Vue from "vue";
import { mapState } from "vuex";

interface IEntry {
  question: string;
  answerMarkdown: string;
  id: string;
  answerHtml: string;
}

export default Vue.extend({
  name: "Plus",
  store,
  router,
  props: {},
  components: {},
  computed: {
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    isChristmasSeason() {
      const currentDate = new Date();

      const start = new Date('2024-11-24T00:00:00-06:00'); // 12:00 AM on 11/24
      const end = new Date('2024-12-08T23:59:59-06:00'); // 11:59 PM on 12/08

      return currentDate >= start && currentDate <= end;
    },
    ...mapState([]),
  },
  data() {
    return {
      selectedEntry: null as IEntry | null,
      entries: [
        {
          question: "What is T3+?",
          answerMarkdown: `
**T3+ is a premium subscription for Track & Trace Tools.**
          
T3+ gives you access to additional tools and is available as a monthly subscription.

[Get T3+](https://dash.trackandtrace.tools)
`,
          answerHtml: "",
          id: "",
        },
        {
          question: "What is included with T3+?",
          answerMarkdown: `
**T3+ gives you access to a large set of new tools specially designed for cannabis businesses of all types and sizes.**

T3+ will continue to get new tools over time for no additional cost. 

[Read more about all the T3+ features](https://github.com/classvsoftware/t3-wiki/wiki/T3+)
`,
          answerHtml: "",
          id: "",
        },
        {
          question: "What if I don't want T3+?",
          answerMarkdown: `
**If you don't want T3+, keep using Track & Trace Tools as normal.**

The base version of Track & Trace Tools is still free. The T3+ badge at the bottom of your screen will only be removed with a subscription.
`,
          answerHtml: "",
          id: "",
        },
        {
          question: "How much does T3+ cost?",
          answerMarkdown: `
**T3+ is a monthly subscription with a 30-day free trial.** 

There are multiple pricing tiers to fit the needs of small and large organizations.

[Read more about T3+ plans](https://dash.trackandtrace.tools/plans)
`,
          answerHtml: "",
          id: "",
        },
        {
          question: "Who works on T3+?",
          answerMarkdown: `
Track & Trace Tools is maintained by just one person - [me](https://www.mattfriz.com/)!

The extension is now used by thousands of cannabis companies across the USA. T3+ is an affordable subscription that will allow me to keep Track & Trace Tools as an open source project.
`,
          answerHtml: "",
          id: "",
        },
        {
          question: "I have more questions about T3+",
          answerMarkdown: `
Reach out to [matt@trackandtrace.tools](mailto:matt@trackandtrace.tools)
`,
          answerHtml: "",
          id: "",
        },
      ].map((x) => {
        x.id = x.question
          .toLowerCase()
          .replace(/[\W_]+/g, "-")
          .replace(/^-+|-+$/g, "");
        x.answerHtml = marked.parse(`# ${x.question}\n\n${x.answerMarkdown}`);
        return x;
      }) as IEntry[],
    };
  },
  methods: {
    selectEntry(entry: IEntry) {
      analyticsManager.track(AnalyticsEvent.CLICKED_PLUS_QUESTION, { entry: entry.id });

      this.$data.selectedEntry = entry;

      // @ts-ignore
      const answers: HTMLElement = this.$refs.answers!;

      answers
        .querySelector(`#${entry.id}`)!
        .scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
    },
  },
  async created() { },
  async mounted() {
    analyticsManager.track(AnalyticsEvent.OPENED_PLUS);
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
.bounce {
  animation: bounceRight 3s ease infinite;
}

@keyframes bounceRight {

  from,
  to {
    transform: scale(1, 1);
  }

  25% {
    transform: scale(0.8, 1.2);
  }
}

@keyframes bounceRight {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(0);
  }

  40% {
    transform: translateX(20px);
  }

  60% {
    transform: translateX(10px);
  }
}
</style>
