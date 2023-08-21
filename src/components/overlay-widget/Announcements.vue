<template>
  <div>
    <div ref="announcementsContainer" class="flex flex-col gap-6">
      <div
        v-for="parsedAnnouncement of parsedAnnouncements"
        v-bind:key="parsedAnnouncement.published_at"
        class="flex flex-col gap-2"
      >
        <div>{{ parsedAnnouncement.readable_published_at }}</div>

        <div v-html="parsedAnnouncement.html"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
// The marked import structure is causing problems
// @ts-ignore
import * as marked from "marked/lib/marked.cjs";
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
        x.readable_published_at = new Date(x.published_at).toLocaleString();
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
    // Create the Intersection Observer
    let observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // If the element is in the viewport
            store.dispatch(`announcements/${AnnouncementsActions.VIEW_ANNOUNCEMENTS}`);
          }
        });
      },
      {
        root: null, // Use the viewport as the container
        rootMargin: "0px", // No margins
        threshold: 0, // Trigger the callback when even one pixel is visible
      }
    );

    // Start observing the target
    observer.observe(this.$refs.announcementsContainer as Element);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
