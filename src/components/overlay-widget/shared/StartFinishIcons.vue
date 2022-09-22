<template>
  <div class="flex flex-col items-center">
    <font-awesome-icon class="mb-1 mt-4" size="md" :icon="['far', 'circle']" />
    <template v-for="x in Array(ellipsisCount)">
      <font-awesome-icon v-bind:key="x" size="md" icon="ellipsis-v" style="margin-bottom: 1px" />
    </template>
    <!-- <font-awesome-icon size="md" icon="ellipsis-v" style="margin-bottom: 1px" />
    <font-awesome-icon size="md" icon="ellipsis-v" /> -->
    <font-awesome-icon class="mt-1 mb-4" size="2x" icon="map-marker-alt" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";

export default Vue.extend({
  name: "StartFinishIcons.vue",
  store,
  router,
  props: {
    ellipsisCount: {
      type: Number,
      default: 3
    }
  },
  components: {},
  computed: {
    ...mapState([])
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss" scoped></style>
