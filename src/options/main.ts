import '@/assets/tailwind.css';
import Options from '@/components/options/Options.vue';
import Vue from 'vue';

Vue.config.productionTip = false;

(async () => {
  /* eslint-disable no-new */
  new Vue({
    el: '#track-trace-tools',
    render: (h) => h(Options),
  });
})();
