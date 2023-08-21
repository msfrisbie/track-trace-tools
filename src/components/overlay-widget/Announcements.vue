<template>
  <div>
    <vue-markdown :source="src"></vue-markdown>
    {{ src }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import VueMarkdown from "vue-markdown-render";

export default Vue.extend({
  name: "Announcements",
  store,
  router,
  props: {},
  components: {
    VueMarkdown,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      src: `# header
        ## subheader
        body`,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
