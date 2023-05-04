import { createLocalVue } from "@vue/test-utils";
import { BootstrapVue } from "bootstrap-vue";
import { chrome } from "jest-chrome";
import Vuex from "vuex";

export function mockConsts() {
  jest.mock("@/consts", () => {
    const originalModule = jest.requireActual("@/consts");

    return {
      __esModule: true,
      ...originalModule,
    };
  });
}

export function mockChrome() {
  const manifest: chrome.runtime.Manifest = {
    name: "my chrome extension",
    manifest_version: 3,
    version: "1.0.0",
  };

  chrome.runtime.getManifest.mockImplementation(() => manifest);

  chrome.storage.local.set.mockImplementation(() => Promise.resolve());
  chrome.storage.local.get.mockImplementation(() => Promise.resolve({}));
}

export function mockDebugUtils() {
  // Mock out a single function from the imported module
  jest.mock("@/utils/debug", () => {
    // const originalModule = jest.requireActual('../foo-bar-baz');

    //Mock the default export and named export 'foo'
    return {
      __esModule: true,
      //   ...originalModule,
      debugLogFactory: jest.fn(() => () => {}),
    };
  });
}

export function mockStore() {
  jest.mock("@/store/page-overlay/index", () => {
    return {
      __esModule: true,
    };
  });
}

export function mockAuthManager() {
  jest.mock("@/modules/auth-manager.module", () => {
    return {
      __esModule: true,
      authManager: jest.fn(),
    };
  });
}

export function mockAnalyticsManager() {
  jest.mock("@/modules/analytics-manager.module", () => {
    return {
      __esModule: true,
      analyticsManager: jest.fn(),
    };
  });
}

export function mockFetchManager() {
  jest.mock("@/modules/fetch-manager.module", () => {
    return {
      __esModule: true,
      fetchManager: jest.fn(),
    };
  });
}

export function mockVuex() {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  // [Vue warn]: Unknown custom element: <b-button> - did you register the component correctly?
  // For recursive components, make sure to provide the "name" option.
  localVue.use(BootstrapVue);

  return localVue;
}
