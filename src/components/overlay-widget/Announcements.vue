<template>
  <div>
    <div ref="announcementsContainer" class="flex flex-col gap-6 px-8">
      <template v-if="visibleAnnouncements.length === 0">
        <span class="text-lg text-gray-600 text-center">All caught up!</span>
        <span class="text-sm text-gray-400 text-center"
          >Track &amp; Trace Tools announcements will appear here</span
        >
      </template>
      <div
        v-for="visibleAnnouncement of visibleAnnouncements"
        v-bind:key="visibleAnnouncement.published_at"
        class="flex flex-col gap-2"
      >
        <div class="text-sm text-gray-400">{{ visibleAnnouncement.readable_published_at }}</div>

        <div class="flex flex-col gap-4" v-html="visibleAnnouncement.html"></div>

        <hr class="my-6" />
      </div>

      <div class="flex flex-col items-center justify-center gap-2">
        <b-button
          v-if="dismissableAnnouncements.length > 0"
          @click="dismissAnnouncements()"
          variant="outline-dark"
          size="sm"
          class="opacity-40 hover:opacity-100"
          >DISMISS</b-button
        >
        <b-button
          v-if="hiddenAnnouncements.length > 0"
          @click="showAllAnnouncements()"
          variant="outline-dark"
          size="sm"
          class="opacity-40 hover:opacity-100"
          >SHOW ALL</b-button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { IPluginState } from '@/interfaces';
import {
  AnnouncementsActions,
  AnnouncementsGetters,
} from '@/store/page-overlay/modules/announcements/consts';
import { IAnnouncementData } from '@/store/page-overlay/modules/announcements/interfaces';

export default Vue.extend({
  name: 'Announcements',
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
  async created() {},
  async mounted() {
    // Create the Intersection Observer
    const observer = new IntersectionObserver(
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
        rootMargin: '0px', // No margins
        threshold: 0, // Trigger the callback when even one pixel is visible
      }
    );

    // Start observing the target
    observer.observe(this.$refs.announcementsContainer as Element);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
