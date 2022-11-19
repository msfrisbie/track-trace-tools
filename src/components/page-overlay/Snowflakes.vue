<template>
  <div class="snowflakes" aria-hidden="true">
    <div class="snowflake" v-for="i in 12" :key="i">{{ settings.snowflakeCharacter }}</div>
    <!-- <div class="snowflake">❅</div>
    <div class="snowflake">❆</div>
    <div class="snowflake">❅</div>
    <div class="snowflake">❆</div>
    <div class="snowflake">❅</div>
    <div class="snowflake">❆</div>
    <div class="snowflake">❅</div>
    <div class="snowflake">❆</div>
    <div class="snowflake">❅</div>
    <div class="snowflake">❆</div>
    <div class="snowflake">❅</div>
    <div class="snowflake">❆</div> -->
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "Snowflakes",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState(["settings"]),
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

<style type="text/scss" lang="scss" scoped></style>
