/* eslint-disable import/no-unresolved, no-new, import/extensions, import/named */

import Vue from 'vue';
import TrackTraceToolsPageOverlay from '~/src/components/page-overlay/TrackTraceToolsPageOverlay.vue';
import { TTT_ROOT_ELEMENT_ID } from '~/src/consts';

export function renderTTTOverlay() {
  const tttShadowHost = document.createElement('div');
  tttShadowHost.setAttribute('id', 'ttt-shadow-host');
  tttShadowHost.attachShadow({ mode: 'open' });
  document.body.appendChild(tttShadowHost);

  const tttContainer = document.createElement('div');
  tttContainer.setAttribute('id', TTT_ROOT_ELEMENT_ID);
  tttShadowHost.shadowRoot?.appendChild(tttContainer);

  new Vue({
    el: tttContainer,
    render: (h) => h(TrackTraceToolsPageOverlay),
  });
}
