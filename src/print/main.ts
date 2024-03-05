import "@/assets/tailwind.css";
import Print from "@/components/print/Print.vue";
import Vue from "vue";

Vue.config.productionTip = false;

(async () => {
  /* eslint-disable no-new */
  new Vue({
    el: "#track-trace-tools",
    render: (h) => h(Print),
  });
})();
