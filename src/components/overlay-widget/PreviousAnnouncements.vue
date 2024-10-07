<template>
  <div>
    <div ref="announcementsContainer" class="flex flex-col gap-6 px-8">
      <template v-if="visibleAnnouncements.length === 0">
        <span class="text-lg text-gray-600 text-center">All caught up!</span>
        <span class="text-sm text-gray-400 text-center">Track &amp; Trace Tools announcements will appear here</span>
      </template>
      <div v-for="[idx, visibleAnnouncement] of visibleAnnouncements.entries()"
        v-bind:key="visibleAnnouncement.published_at" class="flex flex-col gap-2 font-light">
        <template v-if="idx === 0">
          <div class="text-sm text-gray-400">{{ visibleAnnouncement.readable_published_at }}</div>

          <div class="flex flex-col gap-4 font-medium" v-html="visibleAnnouncement.html"></div>
        </template>
        <template v-else>

          <div class="text-sm text-gray-400">{{ visibleAnnouncement.readable_published_at }}</div>

          <div class="flex flex-col gap-4 opacity-80" v-html="visibleAnnouncement.html"></div>
        </template>
        <hr class="my-6" />
      </div>

      <div class="flex flex-col items-center justify-center gap-2">
        <b-button v-if="dismissableAnnouncements.length > 0" @click="dismissAnnouncements()" variant="outline-dark"
          size="sm" class="opacity-40 hover:opacity-100">DISMISS</b-button>
        <b-button v-if="hiddenAnnouncements.length > 0" @click="showAllAnnouncements()" variant="outline-dark" size="sm"
          class="opacity-40 hover:opacity-100">SHOW ALL</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  AnnouncementsActions,
  AnnouncementsGetters,
} from "@/store/page-overlay/modules/announcements/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PreviousAnnouncements",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      announcements: (state: IPluginState) => state.announcements.announcements,
      showDismissed: (state: IPluginState) => state.announcements.showDismissed,
    }),
    ...mapGetters({
      visibleAnnouncements: `announcements/${AnnouncementsGetters.VISIBLE_ANNOUNCEMENTS}`,
      hiddenAnnouncements: `announcements/${AnnouncementsGetters.HIDDEN_ANNOUNCEMENTS}`,
      dismissableAnnouncements: `announcements/${AnnouncementsGetters.DISMISSABLE_ANNOUNCEMENTS}`,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      dismissAnnouncements: `announcements/${AnnouncementsActions.DISMISS_ANNOUNCEMENTS}`,
      showAllAnnouncements: `announcements/${AnnouncementsActions.SHOW_ALL_ANNOUNCEMENTS}`,
    }),
  },
  async created() { },
  async mounted() {
    // Create the Intersection Observer
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            // If the element is in the viewport
            await store.dispatch(`announcements/${AnnouncementsActions.VIEW_ANNOUNCEMENTS}`);
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
