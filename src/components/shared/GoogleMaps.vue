<template>
  <iframe frameborder="0" style="border: 0" :src="src" allowfullscreen>
  </iframe>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { googleMapsApiKey } from "@/modules/environment.module";

export default Vue.extend({
  name: "GoogleMaps",
  store,
  router,
  props: {
    destination: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: false,
    },
    mapMode: {
      type: String,
      required: true,
    },
  },
  components: {},
  computed: {
    ...mapState([]),
    src(): string {
      switch (this.$props.mapMode) {
        case "place":
          return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey()}&q=${encodeURIComponent(
            this.$props.destination
          )}`;
        case "directions":
          return `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey()}&destination=${encodeURIComponent(
            this.$props.destination
          )}&origin=${encodeURIComponent(this.$props.origin)}`;
        default:
          return "";
      }
    },
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
