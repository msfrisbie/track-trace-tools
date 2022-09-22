import "@/assets/tailwind.css";
import Standalone from "@/components/standalone/Standalone.vue";
import Vue from "vue";

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: "#track-trace-tools",
  render: (h) => h(Standalone),
});
