import '@/test/utils/auto-mock-auth-manager';
import '@/test/utils/auto-mock-chrome';
import '@/test/utils/auto-mock-facility-manager';
import '@/test/utils/auto-mock-fetch';
import '@/test/utils/auto-mock-metrc-request-manager';
import '@/test/utils/auto-mock-page-manager';
import '@/test/utils/auto-mock-passive-page-analyzer';
import '@/test/utils/auto-mock-t3-request-manager';
import { mockVuex } from '@/test/utils/mocks';
import { shallowMount, Wrapper } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import TrackTraceToolsPageOverlay from './TrackTraceToolsPageOverlay.vue';

const localVue = mockVuex();

describe('TrackTraceToolsPageOverlay.vue', () => {
  let wrapper: Wrapper<any>;
  let store: Store<any>;

  beforeEach(() => {
    // render the component
    wrapper = shallowMount(TrackTraceToolsPageOverlay, { localVue });

    store = new Vuex.Store({
      // actions
    });
  });

  it('Renders component', () => {
    expect(wrapper.exists()).toEqual(true);
  });
});
