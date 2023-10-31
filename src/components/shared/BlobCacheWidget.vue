<template>
  <div>
    <b-button @click="downloadGlobal()">DOWNLOAD GLOBAL BLOB</b-button>
    <b-form-file v-on:change="setGlobal($event)"></b-form-file>
  </div>
</template>

<script lang="ts">
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { readJSONFile } from "@/utils/file";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "BlobCacheWidget",
  store,
  router,
  props: {
    cachekey: String,
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    async downloadGlobal() {
      // @ts-ignore
      const cachedValue = globalThis[this.$props.cachekey];

      if (cachedValue === undefined) {
        toastManager.openToast(`Global blob cache is not set`, {
          title: "Download error",
          autoHideDelay: 5000,
          variant: "success",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }

      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(cachedValue)
      )}`;
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${this.$props.cachekey}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    },
    async setGlobal(e: any): Promise<void> {
      if (!e) {
        this.$data.metadata = null;
        return;
      }
      const data = await readJSONFile(e.target.files[0]);

      console.log(data);

      // @ts-ignore
      globalThis[this.$props.cachekey] = data;

      toastManager.openToast(`Set global blob cache`, {
        title: "Upload success",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
