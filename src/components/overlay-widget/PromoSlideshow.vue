<template>
  <div>
    <b-carousel
      id="carousel-1"
      v-model="slide"
      :interval="5000"
      img-width="540"
      img-height="40"
      background="transparent"
      @sliding-start="onSlideStart"
      @sliding-end="onSlideEnd"
      class="promo-carousel text-red-600"
      style="margin-bottom: 0 !important"
    >
      <b-carousel-slide img-blank>
        <div class="text-red-500">Foo</div>
      </b-carousel-slide>
      <b-carousel-slide img-blank>
        <div class="text-red-500">Bar</div>
      </b-carousel-slide>
    </b-carousel>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PromoSlideshow",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      slide: 0,
      sliding: null,
    };
  },
  methods: {
    onSlideStart(slide: any) {
      this.$data.sliding = true;
    },
    onSlideEnd(slide: any) {
      this.$data.sliding = false;
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
