// import router from '@/router/page-overlay';
import store from "@/store/page-overlay";
import App from "App.vue";
import Vue from "vue";

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount("#track-trace-tools");
