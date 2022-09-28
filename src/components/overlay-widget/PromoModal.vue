<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="promo-modal"
    modal-class="ttt-modal"
    dialog-class="flex flex-col justify-end"
    size="xl"
    :static="true"
    no-fade
    no-close-on-esc
    no-close-on-backdrop
    centered
    hide-header
    hide-footer
    ref="promo"
  >
    <promo-slideshow :interval="8000"></promo-slideshow>
  </b-modal>
</template>

<script lang="ts">
import PromoSlideshow from "@/components/overlay-widget/PromoSlideshow.vue";
import Vue from "vue";

export default Vue.extend({
  components: {
    PromoSlideshow,
  },
  name: "PromoModal",
  data() {
    return {};
  },
  methods: {
    show() {
      this.$bvModal.show("promo-modal");
    },
    hide() {
      this.$bvModal.hide("promo-modal");
    },
    toggle() {
      // @ts-ignore
      this.$refs["promo"].toggle();
    },
  },
  async mounted() {},
});
</script>
