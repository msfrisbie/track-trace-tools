import '@/assets/tailwind.css';
import Options from '@/components/options/Options.vue';
import { OPTIONS_REDIRECT_KEY } from '@/consts';
import Vue from 'vue';

Vue.config.productionTip = false;

(async () => {
  const result = await chrome.storage.local.get(OPTIONS_REDIRECT_KEY);
  if (result[OPTIONS_REDIRECT_KEY]) {
    window.location.pathname = result[OPTIONS_REDIRECT_KEY];
  }
  await chrome.storage.local.remove(OPTIONS_REDIRECT_KEY);

  /* eslint-disable no-new */
  new Vue({
    el: '#track-trace-tools',
    render: (h) => h(Options),
  });
})();
