<template>
  <fragment>
    <div class="option-select">
      <div>Select your label template and print this page directly onto the labels</div>
      <b-form-select style="border: 1px solid gray; border-radius: 0.2rem; padding: 0.2rem" size="lg" :options="options"
        v-model="selectedOption"></b-form-select>
    </div>
    <div class="label-container" v-if="selectedOption" :style="selectedOption.labelContainerStyle">
      <fragment v-bind:key="idx" v-for="[idx, value] of barcodeValues.entries()">
        <printed-label :width="selectedOption.labelWidth" :height="selectedOption.labelHeight"
          :barcode="value"></printed-label>
        <!-- <div v-if="idx > 0 && idx % 30 === 0" class="col-start-1 col-span-3 break-after"></div> -->
      </fragment>
    </div>
  </fragment>
</template>

<script lang="ts">
import { PRINT_DATA_KEY } from "@/consts";
import BootstrapVue from "bootstrap-vue";
import Vue from "vue";
import Fragment from "vue-fragment";
import PrintedLabel from "./PrintedLabel.vue";

Vue.use(BootstrapVue);
Vue.use(Fragment.Plugin);

export default Vue.extend({
  name: "Print",
  props: {},
  components: {
    PrintedLabel,
  },
  computed: {},
  data() {
    return {
      selectedOption: null,
      options: [
        {
          text: "Avery 8160",
          value: {
            labelWidth: "2.625in",
            labelHeight: "1in",
            labelContainerStyle: `column-gap: 0.125in; grid-template-columns: repeat(3, 1fr);`,
          },
        },
      ],
      barcodeValues: [],
    };
  },
  methods: {},
  async created() { },
  async mounted() {
    this.$data.selectedOption = this.$data.options[0].value;

    chrome.storage.local.get(PRINT_DATA_KEY).then((result) => {
      this.$data.barcodeValues = result[PRINT_DATA_KEY] ?? [];
    });
  },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) { },
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/print";
</style>
