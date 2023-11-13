<template>
  <div class="grid grid-cols-2 gap-8">
    <div>
      <div v-for="entry of entries" v-bind:key="entry.question">
        {{ entry.question }}
      </div>
    </div>
    <div>
      <div
        v-for="entry of entries"
        v-bind:key="entry.id"
        class="flex flex-col gap-4"
        v-html="entry.html"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import * as marked from "marked/lib/marked.cjs";
import Vue from "vue";
import { mapState } from "vuex";

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
      entries: [
        {
          question: "What is T3+?",
          answerMarkdown: "See here",
          answerHtml: "",
          id: "",
        },
      ].map((x) => {
        x.id = x.question
          .toLowerCase()
          .replace(/[\W_]+/g, "-")
          .replace(/^-+|-+$/g, "");
        x.answerHtml = marked.parse(x.answerMarkdown);
        return x;
      }) as { question: string; answerMarkdown: string; id: string; answerHtml: string }[],
    };
  },
  methods: {
    testVerify() {},
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
