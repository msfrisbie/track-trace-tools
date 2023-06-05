<template>
  <div class="snowflakes" aria-hidden="true">
    <div :class="`snowflake text-${settings.snowflakeSize}`" v-for="i in 12" :key="i">
      <template v-if="settings.snowflakeCharacter === 'TEXT'">
        {{ settings.snowflakeText }}</template
      >
      <template v-if="settings.snowflakeCharacter === 'IMAGE'">
        <div
          :class="`snowflake-crop-${settings.snowflakeImageCrop}`"
          :style="snowflakeImageStyle"
        ></div>
      </template>
      <template
        v-if="settings.snowflakeCharacter !== 'IMAGE' && settings.snowflakeCharacter !== 'TEXT'"
      >
        {{ settings.snowflakeCharacter }}
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

function imageWidth(snowflakeSize: string) {
  switch (snowflakeSize) {
    case "xs":
      return "12px";
    case "sm":
      return "18px";
    case "md":
      return "24px";
    case "lg":
      return "32px";
    case "xl":
      return "40px";
    case "2xl":
      return "48px";
    case "3xl":
      return "56px";
    case "4xl":
      return "64px";
    case "5xl":
      return "72px";
    case "6xl":
      return "80px";
    case "7xl":
      return "88px";
    case "8xl":
      return "96px";
    case "9xl":
      return "100px";
    default:
      return "24px";
  }
}

export default Vue.extend({
  name: "Snowflakes",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>(["settings"]),
    snowflakeImageStyle(): string {
      const dimension = imageWidth(this.$store.state.settings.snowflakeSize);

      return `width: ${dimension}; height: ${dimension}; background-image: url(${this.$store.state.settings.snowflakeImage});`;
    },
  },
  data() {
    return {
      arr: Array(12).fill(""),
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.snowflake-crop-none {
  background: transparent no-repeat center center;
  background-size: contain;
}
.snowflake-crop-rounded {
  border-radius: 20%;
  background: transparent no-repeat center center;
  background-size: cover;
}

.snowflake-crop-square {
  background: transparent no-repeat center center;
  background-size: cover;
}

.snowflake-crop-circle {
  border-radius: 100%;
  background: transparent no-repeat center center;
  background-size: cover;
}
</style>
