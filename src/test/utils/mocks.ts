import { createLocalVue } from "@vue/test-utils";
import { BootstrapVue } from "bootstrap-vue";
import { chrome } from "jest-chrome";
import Vuex from "vuex";

const mockModuleFactory = (extras = {}) => ({
  init: jest.fn(),
  ...extras,
});

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
  jest.mock("@/utils/debug", () =>
    // const originalModule = jest.requireActual('../foo-bar-baz');

    // Mock the default export and named export 'foo'
    ({
      __esModule: true,
      //   ...originalModule,
      debugLogFactory: jest.fn(() => () => {}),
    })
  );
}

export function mockStore() {
  jest.mock("@/store/page-overlay/index", () => ({
    __esModule: true,
  }));
}

export function mockAuthManager() {
  jest.mock("@/modules/auth-manager.module", () => ({
    __esModule: true,
    authManager: mockModuleFactory({
      authStateOrError: () => ({
        identity: "user@example.com",
      }),
      authStateOrNull: () => ({
        identity: "user@example.com",
      }),
    }),
  }));
}

export function mockPageManager() {
  jest.mock("@/modules/page-manager/page-manager.module", () => ({
    __esModule: true,
    pageManager: mockModuleFactory(),
  }));
}

export function mockAnalyticsManager() {
  jest.mock("@/modules/analytics-manager.module", () => ({
    __esModule: true,
    analyticsManager: mockModuleFactory(),
  }));
}

export function mockPassivePageAnalyzer() {
  jest.mock("@/modules/passive-page-analyzer.module", () => ({
    __esModule: true,
    passivePageAnalyzer: mockModuleFactory(),
  }));
}

export function mockClientBuildManager() {
  jest.mock("@/modules/client-build-manager.module", () => ({
    __esModule: true,
    clientBuildManager: mockModuleFactory(),
  }));
}

export function mockExpiringCacheManager() {
  jest.mock("@/modules/expiring-cache-manager.module", () => ({
    __esModule: true,
    expiringCacheManager: mockModuleFactory(),
  }));
}

export function mockCredentialManager() {
  jest.mock("@/modules/credential-manager.module", () => ({
    __esModule: true,
    credentialManager: mockModuleFactory(),
  }));
}

export function mockMockDataManager() {
  jest.mock("@/modules/mock-data-manager.module", () => ({
    __esModule: true,
    mockDataManager: mockModuleFactory(),
  }));
}

export function mockModalManager() {
  jest.mock("@/modules/modal-manager.module", () => ({
    __esModule: true,
    modalManager: mockModuleFactory(),
  }));
}

export function mockUpdateManager() {
  jest.mock("@/modules/update-manager.module", () => ({
    __esModule: true,
    updateManager: mockModuleFactory(),
  }));
}

export function mockIntegrigyManager() {
  jest.mock("@/modules/integrity-manager.module", () => ({
    __esModule: true,
    integrityManager: mockModuleFactory(),
  }));
}

export function mockMetrcModalManager() {
  jest.mock("@/modules/metrc-modal-manager.module", () => ({
    __esModule: true,
    metrcModalManager: mockModuleFactory(),
  }));
}

export function mockAnnouncementsManager() {
  jest.mock("@/modules/announcements-manager.module", () => ({
    __esModule: true,
    announcementsManager: mockModuleFactory(),
  }));
}

export function mockToastManager() {
  jest.mock("@/modules/toast-manager.module", () => ({
    __esModule: true,
    toastManager: mockModuleFactory(),
  }));
}

export function mockFacilityManager() {
  jest.mock("@/modules/facility-manager.module", () => ({
    __esModule: true,
    facilityManager: mockModuleFactory({
      cachedFacilities: [],
      ownedFacilitiesOrError: () => [],
    }),
  }));
}

export function mockT3RequestManager() {
  jest.mock("@/modules/t3-request-manager.module", () => ({
    __esModule: true,
    t3RequestManager: mockModuleFactory({
      loadT3plus: () => ({
        plusUsers: [],
      }),
      loadFlags: () => ({}),
      loadAnnouncements: () => [],
    }),
  }));
}

export function mockMetrcRequestManager() {
  jest.mock("@/modules/metrc-request-manager.module", () => ({
    __esModule: true,
    primaryMetrcRequestManager: mockModuleFactory({
      getUserProfileHTML: () => ({
        data: {},
      }),
    }),
  }));
}

export function mockFetchManager() {
  jest.mock("@/modules/fetch-manager.module", () => ({
    __esModule: true,
    fetchManager: jest.fn(),
  }));
}

export function mockSandboxManager() {
  jest.mock("@/modules/sandbox-manager.module", () => ({
    __esModule: true,
    sandboxManager: mockModuleFactory({
      runsBeforeModuleInit: jest.fn(),
      runsAfterAuthInit: jest.fn(),
      runsAfterModuleInit: jest.fn(),
    }),
  }));
}

export function mockVuex() {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  // [Vue warn]: Unknown custom element: <b-button> - did you register the component correctly?
  // For recursive components, make sure to provide the "name" option.
  localVue.use(BootstrapVue);

  return localVue;
}
