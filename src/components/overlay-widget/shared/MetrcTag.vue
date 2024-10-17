<template>
  <div class="flex flex-row items-stretch rounded overflow-hidden">
    <div class="metrc-tag-blue flex flex-col items-center p-2">
      <canvas :id="`barcode-${label}`"></canvas>
      <dual-color-tag class="text-md" :label="label" />
    </div>
    <div class="bg-black w-8 flex flex-col items-center justify-center text-center">
      <span class="transform rotate-90 text-white font-semibold block text-nowrap">{{ sideText.toLocaleUpperCase()
        }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import DualColorTag from '@/components/overlay-widget/shared/DualColorTag.vue';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import JsBarcode from 'jsbarcode';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'MetrcTag',
  store,
  router,
  props: {
    label: String,
    sideText: String,
  },
  components: {
    DualColorTag,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() { },
  async mounted() {
    JsBarcode(`#barcode-${this.$props.label}`, this.$props.label, {
      background: 'transparent',
      width: 1.3,
      height: 56,
      displayValue: false,
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
.metrc-tag-blue {
  background-color: #bce7fb;
}
</style>
