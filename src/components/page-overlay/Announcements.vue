<template>
  <div class="flex flex-col items-center">
    <div class="flex-grow w-full gap-8 max-w-2xl">
      <previous-announcements class="p-4"></previous-announcements>
    </div>
  </div>
</template>

<script lang="ts">
import PreviousAnnouncements from "@/components/overlay-widget/PreviousAnnouncements.vue";
import store from '@/store/page-overlay/index';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'Announcements',
  store,
  data() {
    return {
    };
  },
  components: {
    PreviousAnnouncements,
  },
  mounted() { },
  computed: {
    ...mapState([]),
  },
  destroyed() { },
  methods: {
  },
});
</script>
