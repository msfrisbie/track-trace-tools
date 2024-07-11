<template>
  <div class="grid grid-cols-3 gap-8">
    <div class="flex flex-col gap-2 h-full p-4">
      <a class="shadow-xl py-2 px-4 mb-8 rounded-md no-underline bg-gradient-to-r from-purple-800 to-purple-400 hover:from-purple-700 hover:to-purple-300 text-white text-xl font-light flex flex-row items-center gap-6 justify-between"
        href="https://dash.trackandtrace.tools" style="text-decoration: none" target="_blank"><span>GET T3+</span><span
          class="bounce">→</span></a>
      <div v-for="entry of entries" v-bind:key="entry.question" @click="selectEntry(entry)">
        <span class="text-xl font-light ttt-purple hover:underline cursor-pointer hover:text-purple-300">&#8250;&nbsp;{{
        entry.question }}</span>
      </div>
    </div>
    <div class="col-span-2 overflow-y-auto toolkit-scroll h-full flex flex-col gap-12 p-4" ref="answers">
      <div v-bind:class="{ 'bg-purple-50': entry === selectedEntry }" :id="entry.id" v-for="entry of entries"
        v-bind:key="entry.id" class="flex flex-col gap-4 p-4 rounded-xl shadow" v-html="entry.answerHtml"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
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
        //         {
        //           question: "What is changing?",
        //           answerMarkdown: `
        // **Users now have the option to subscribe to T3+.**

        // T3+ makes Track & Trace Tools even more powerful by adding new features such as advanced reports, a Metrc history explorer, scan sheet generator, and more.

        // Track & Trace Tools will not require a subscription to use basic features.

        // A small number of existing tools are being moved to T3+. These tools will be available as part of the free plan until 12/1/2023.

        // [Read more about T3+ tools](https://dash.trackandtrace.tools/features)
        //           `,
        //           answerHtml: "",
        //           id: "",
        //         },
        {
          question: "What is included with T3+?",
          answerMarkdown: `
**T3+ gives you access to a large set of new tools specially designed for cannabis businesses of all types and sizes.**

T3+ will continue to get new tools over time for no additional cost. T3+ users will also be granted early access to [OpenTag](https://trackandtrace.tools/scan) once it is ready.

[Read more about all the T3+ features](https://dash.trackandtrace.tools/features)
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
        //         {
        //           question: "What happens if I use a license key?",
        //           answerMarkdown: `
        // **All license keys will no longer grant access to T3+.**

        // If you use a license key for either the T3+ beta or for custom features, these keys will no longer provide access to T3+ effective 12/1/2023.

        // To keep using T3+ features, you will need a T3+ subscription.
        // `,
        //           answerHtml: "",
        //           id: "",
        //         },
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
      analyticsManager.track(MessageType.CLICKED_PLUS_QUESTION, { entry: entry.id });

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
    analyticsManager.track(MessageType.OPENED_PLUS);
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
    transform: translateX(12px);
  }

  60% {
    transform: translateX(6px);
  }
}
</style>
