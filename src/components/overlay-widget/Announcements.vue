<template>
  <div>
    <div
      v-for="parsedAnnouncement of parsedAnnouncements"
      v-bind:key="parsedAnnouncement.published_at"
      class="flex flex-col gap-2"
      v-html="parsedAnnouncement.html"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
// The marked import structure is causing problems
// @ts-ignore
import * as marked from "marked/lib/marked.esm";
import { IPluginState } from "@/interfaces";
import { AnnouncementsActions } from "@/store/page-overlay/modules/announcements/consts";
import { IAnnouncementData } from "@/store/page-overlay/modules/announcements/interfaces";

const renderer = {
  heading(text: string, level: any) {
    return `<h${level} class="text-${4 - level}xl ttt-purple">${text}</h${level}>`;
  },
  link(href: string, title: string, text: string) {
    if (href === null) {
      return text;
    }
    let out = '<a class="text-purple-500 underline" href="' + href + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += ">" + text + "</a>";
    return out;
  },
};

marked.use({ renderer });

export default Vue.extend({
  name: "Announcements",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      announcements: (state: IPluginState) => state.announcements.announcements,
    }),
    parsedAnnouncements(): IAnnouncementData[] {
      return store.state.announcements.announcements.map((x) => {
        x.html = marked.parse(x.markdown);
        return x;
      });
    },
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {
    store.dispatch(`announcements/${AnnouncementsActions.VIEW_ANNOUNCEMENTS}`);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
