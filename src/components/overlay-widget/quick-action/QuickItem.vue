<template>
  <div>Example</div>
</template>

<script lang="ts">
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "QuickItem",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {
    console.log(JSON.stringify(await dynamicConstsManager.itemCategories()));
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
