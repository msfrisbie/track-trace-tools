import '@/assets/tailwind.css';
import Popup from '@/components/popup/Popup.vue';
import Vue from 'vue';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#track-trace-tools',
  render: (h) => h(Popup),
});
