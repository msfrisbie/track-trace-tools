import { enableFetchMocks} from 'jest-fetch-mock';
import { chrome } from "jest-chrome";

// Stub before remaining imports
enableFetchMocks();

const manifest: chrome.runtime.Manifest = {
  name: "my chrome extension",
  manifest_version: 3,
  version: "1.0.0",
};

chrome.runtime.getManifest.mockImplementation(() => manifest);

import { mockDataManager } from '@/modules/mock-data-manager.module';
import { mockVuex } from '@/test/utils/mocks';
import { todayIsodate } from '@/utils/date';
import { shallowMount, Wrapper } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import HarvestBuilder from './HarvestBuilder.vue';

let localVue = mockVuex();

describe("HarvestBuilder.vue", () => {
  let wrapper: Wrapper<any>;
  let store: Store<any>;

  beforeEach(() => {
    // render the component
    wrapper = shallowMount(HarvestBuilder, { localVue });

    store = new Vuex.Store({
      // actions
    });
  });

  it("Renders harvest builder", () => {
    expect(wrapper.exists()).toEqual(true);
  });

  it("Initializes harvest builder data", () => {
    expect(wrapper.vm.$data).toEqual({
      activeStepIndex: 0,
      builderType: "HARVEST_PLANTS",
      dryingLocation: null,
      harvestIsodate: todayIsodate(),
      harvestName: "",
      harvestedWeights: [],
      patientLicenseNumber: "",
      previousHarvestDataKey: null,
      selectedPlants: [],
      showHiddenDetailFields: false,
      steps: [
        {
          stepText: "Select plants to harvest",
        },
        {
          stepText: "Harvest details",
        },
        {
          stepText: "Submit",
        },
      ],
      unitOfWeight: null,
    });
  });

  it("Re-initializes the harvest weights with new plants", () => {
    const previousWeights = [1, 2, 3];
    const newPlants = mockDataManager.mockPlants({ filter: {} }).slice(0, 5);

    wrapper.setData({
      ...wrapper.vm.$data,
      harvestedWeights: previousWeights,
    });

    expect(wrapper.vm.$data.harvestedWeights).toEqual(previousWeights);

    wrapper.setData({
      ...wrapper.vm.$data,
      selectedPlants: newPlants,
    });

    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$data.harvestedWeights).toEqual(Array(5).fill(0));
    });
  });

  //   expect(wrapper.text()).toEqual('');

  //   const selectedPlants = mockDataManager.mockPlants({ filter: {} });

  //   wrapper.setData({
  //     ...wrapper.vm.$data,
  //     selectedPlants
  //   });

  //   console.log(selectedPlants);

  //   expect(wrapper.text()).toEqual('');

  //   // // should not allow for `username` less than 7 characters, excludes whitespace
  //   // wrapper.setData({ username: ' '.repeat(7) })

  //   // // assert the error is rendered
  //   // expect(wrapper.find('.error').exists()).toBe(true)

  //   // // update the name to be long enough
  //   // wrapper.setData({ username: 'Lachlan' })

  //   // // assert the error has gone away
  //   // expect(wrapper.find('.error').exists()).toBe(false)
  // })
});
