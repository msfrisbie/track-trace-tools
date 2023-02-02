import "@/assets/tailwind.css";
import Options from "@/components/options/Options.vue";
import { ChromeStorageKeys } from "@/consts";
import Vue from "vue";

Vue.config.productionTip = false;

(async () => {
  const initialOptionsPath = await chrome.storage.local.get(ChromeStorageKeys.INITIAL_OPTIONS_PATH);
  if (initialOptionsPath) {
    window.location.hash = `#${initialOptionsPath}`;
    await chrome.storage.local.remove(ChromeStorageKeys.INITIAL_OPTIONS_PATH);
  }

  /* eslint-disable no-new */
  new Vue({
    el: "#track-trace-tools",
    render: (h) => h(Options),
  });
})();
