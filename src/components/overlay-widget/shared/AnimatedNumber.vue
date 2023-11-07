<template>
  <span>{{ displayNumber }}</span>
</template>

<script lang="ts">
// Adapted from https://stackoverflow.com/questions/35531629/vuejs-animate-number-changes
import Vue from 'vue';

export default Vue.extend({
  name: 'AnimatedNumber',
  props: {
    number: Number,
  },
  data() {
    return {
      displayNumber: 0,
      interval: false,
    };
  },
  mounted() {
    this.$data.displayNumber = this.$props.number ? this.$props.number : 0;
  },
  watch: {
    number() {
      clearInterval(this.$data.interval);

      if (this.$props.number === this.$data.displayNumber) {
        return;
      }

      this.$data.interval = window.setInterval(() => {
        if (this.$data.displayNumber !== this.$props.number) {
          let change = (this.$props.number - this.$data.displayNumber) / 10;
          change = change >= 0 ? Math.ceil(change) : Math.floor(change);
          this.$data.displayNumber += change;
        }
      }, 20);
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
