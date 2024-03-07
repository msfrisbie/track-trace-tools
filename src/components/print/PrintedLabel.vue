<template>
  <div class="printed-label" :style="inlineLabelStyle">
    <canvas
      style="width: 100%; padding: 0.5rem"
      jsbarcode-background="transparent"
      :jsbarcode-value="barcode"
      :id="`barcode-${barcode}`"
    ></canvas>
  </div>
</template>

<script lang="ts">
import JsBarcode from "jsbarcode";
import Vue from "vue";

export default Vue.extend({
  name: "PrintedLabel",
  props: {
    width: String,
    height: String,
    padding: String,
    barcode: String,
    // text1: String,
    // text2: String
  },
  components: {},
  computed: {
    inlineLabelStyle(): string {
      return `width: ${this.$props.width}; 
            height: ${this.$props.height}; 
            padding: ${this.$props.padding}`;
    },
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {
    JsBarcode(`#barcode-${this.$props.barcode}`).init();
    // , this.$props.barcode, {
    //   background: "transparent",
    // width: 1.3,
    // height: 56,
    // displayValue: false,
    // });
  },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
