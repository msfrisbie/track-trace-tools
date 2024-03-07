<template>
  <div class="label-container">
    <printed-label
      v-for="[idx, value] of barcodeValues.entries()"
      v-bind:key="idx"
      width="2.625in"
      height="1in"
      padding="0"
      :barcode="value"
    ></printed-label>
  </div>
</template>

<script lang="ts">
import { PRINT_DATA_KEY } from "@/consts";
import Vue from "vue";
import PrintedLabel from "./PrintedLabel.vue";

export default Vue.extend({
  name: "Print",
  props: {},
  components: {
    PrintedLabel,
  },
  computed: {},
  data() {
    return {
      barcodeValues: [],
      // values: [
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      //     "1234567812345678",
      // ]
    };
  },
  methods: {},
  async created() {},
  async mounted() {
    chrome.storage.local.get(PRINT_DATA_KEY).then((result) => {
      this.$data.barcodeValues = result[PRINT_DATA_KEY] ?? [];
    });
  },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
@import "@/scss/print";
</style>
