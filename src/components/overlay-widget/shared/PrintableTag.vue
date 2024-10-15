<template>
  <div class="flex flex-row items-stretch">
    <div class="flex flex-col items-center p-2">
      <div v-if="title && title.length">{{ title }}</div>
      <div v-if="subtitle && subtitle.length">{{ subtitle }}</div>
      <canvas :id="`barcode-${label}`"></canvas>
      <div>{{ label }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import JsBarcode from 'jsbarcode';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'PrintableTag',
  store,
  router,
  props: {
    label: String,
    title: String,
    subtitle: String,
  },
  components: {
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

<style type="text/scss" lang="scss" scoped></style>
