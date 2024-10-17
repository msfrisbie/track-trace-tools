import {
  DEBUG_ATTRIBUTE,
  MessageType,
  MetrcGridId,
  ModalAction,
  ModalType,
  TTT_TABLEGROUP_ATTRIBUTE,
} from "@/consts";
import { BackgroundState, DarkModeState, IAtomicService, SnowflakeState } from "@/interfaces";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { MetrcTableActions } from "@/store/page-overlay/modules/metrc-table/consts";
import { debugLogFactory } from "@/utils/debug";
import { getHashData } from "@/utils/url";
import _ from "lodash-es";
import { timer } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { analyticsManager } from "../analytics-manager.module";
import { authManager } from "../auth-manager.module";
import { isDevelopment } from "../environment.module";
import { metrcModalManager } from "../metrc-modal-manager.module";
import { modalManager } from "../modal-manager.module";
import {
  PACKAGE_TAB_REGEX,
  PLANTS_TAB_REGEX,
  REPORTS_TAB_REGEX,
  SALES_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_HUB_REGEX,
  TRANSFER_TAB_REGEX,
  TRANSFER_TEMPLATE_TAB_REGEX,
} from "./consts";
import {
  addButtonsToPackageTableImpl,
  addButtonsToTransferTableImpl,
  modifyTransferModalImpl,
} from "./inline-widget-utils";
import {
  clickLogoutDismissImpl,
  clickRefreshLinksImpl,
  controlSnowflakeAnimationImpl,
  getVisibleAnimationContainerImpl,
  interceptViewManifestButtonImpl,
  setPaginationImpl,
  suppressAnimationContainerImpl,
} from "./metrc-utils";
import {
  initializeFilterButtonsImpl,
  mirrorMetrcTableState,
  resetFilterElementReferencesImpl,
  setFilter,
} from "./search-utils";
import {
  controlBackgroundImpl,
  controlDarkModeImpl,
  controlLogoutBarImpl,
  togglePageVisibilityClassesImpl,
} from "./style-utils";
import {
  activeTabOrNullImpl,
  clickTabStartingWithImpl,
  isTabActiveImpl,
  manageTabs,
} from "./tab-utils";

const debugLog = debugLogFactory("page-manager.module.ts");

class PageManager implements IAtomicService {
  textBuffer: string = "";

  suppressAnimationContainerTimeout: any = null;

  paginationOptions: NodeList = [] as any;

  extendButton: HTMLElement | null = null;

  snowflakeCanvas: HTMLElement | null = null;

  sessionTimeoutAlert: HTMLElement | null = null;

  sessionTimeoutBar: HTMLElement | null = null;

  tttTransferButton: HTMLElement | null = null;

  tttNewPackageButton: HTMLElement | null = null;

  quickTransferButton: HTMLElement | null = null;

  quickTransferTemplateButton: HTMLElement | null = null;

  quickPackageButton: HTMLElement | null = null;

  packageToolsButton: HTMLElement | null = null;

  reportToolsButton: HTMLElement | null = null;

  transferToolsButton: HTMLElement | null = null;

  plantToolsButton: HTMLElement | null = null;

  visiblePaginationSizeSelector: HTMLElement | null = null;

  viewManifestButton: HTMLElement | null = null;

  replacementManifestButton: HTMLElement | null = null;

  animationContainers: HTMLElement[] = [];

  activeModal: HTMLElement | null = null;

  // Transfer Modal

  addMoreButton: HTMLElement | null = null;

  addMoreInput: HTMLElement | null = null;

  packageTagInputContainer: HTMLElement | null = null;

  // Prevents recurring method from overrunning itself
  paused: boolean = false;

  refresh: Promise<void> = Promise.resolve();

  refreshResolve: any;

  async init() {
    this.manageRecoveryLinks();

    this.setEventHandlers();

    this.initializeDebug();

    try {
      await authManager.authStateOrError();
    } catch (e) {
      return;
    }

    // addRobotoToHead();

    this.cycleRefreshPromise();

    // These are references which are not expected to be dynamic in nature
    this.snowflakeCanvas = document.querySelector("canvas") as HTMLElement | null;

    try {
      await manageTabs();

      const currentHashData = getHashData();

      for (const [metrcGridId, metrcGridFilters] of Object.entries(currentHashData.metrcGridFilters ?? {})) {
        for (const [field, value] of Object.entries(metrcGridFilters)) {
          console.log({ metrcGridId, field, value });
          await setFilter(metrcGridId as MetrcGridId, field, value);
        }
      }
    } catch (e) {
      console.error('FAILED HASH DATA');
      console.error(e);
    }

    // Eagerly modify
    timer(0, 2500).subscribe(() => this.modifyPageAtInterval());

    const debouncedHandler = _.debounce(() => this.modifyPageOnDomChange(), 100);

    const observer = new MutationObserver(() => debouncedHandler());

    observer.observe(document.body, { subtree: true, childList: true });

    window.addEventListener("hashchange", () => {
      // Treat a URL change as a DOM change
      this.modifyPageOnDomChange();
    });

    if (store.state.settings?.preventLogout) {
      if ("wakeLock" in navigator) {
        try {
          // @ts-ignore
          await navigator.wakeLock.request("screen");
          console.log("Wake lock engaged");
        } catch (err) {
          // The Wake Lock request has failed - usually system related, such as battery.
          console.error(err);
        }
      }
    }

    if (store.state.demoMode) {
      if (isDevelopment()) {
        // This screws up Metrc login, too dangerous for prod
        document.title = "T3 Metrc Demo";
        window.history.replaceState({}, "T3 Metrc Demo", window.location.origin);
      }

      // When holding alt in demo mode, mousemoves will scramble numbers
      document.addEventListener("mousemove", (e) => {
        if (!e.altKey || !e.target) {
          return;
        }

        const element = e.target as HTMLElement;

        if (element.childNodes.length === 1 && element.firstChild?.nodeType === 3) {
          const txt = element.firstChild!.nodeValue!.split("");

          for (const [idx, char] of txt.entries()) {
            if (/\d/.test(char)) {
              txt[idx] = Math.floor(Math.random() * 10).toString();
            }
          }

          element.firstChild!.nodeValue = txt.join("");
        }
      });
    }
  }

  pauseFor(pauseMs: number) {
    this.paused = true;

    setTimeout(() => {
      this.paused = false;
    }, pauseMs);
  }

  cycleRefreshPromise(): void {
    this.refreshResolve && this.refreshResolve();
    this.refresh = new Promise((resolve, reject) => {
      this.refreshResolve = resolve;
    });
  }

  /**
   * Shared method for emulating a mutex for methods that use native event dispatch
   */
  clickSettleDelay() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  initializeDebug() {
    timer(0, 1000).subscribe(() => {
      // This works! Use for scanner
      // console.log(document.activeElement);
      // try {
      //   // @ts-ignore
      //   document.activeElement.value = "jake";
      // } catch (e) {
      //   console.error(e);
      // }

      if (window.location.hash === "#debug") {
        document.body.setAttribute(DEBUG_ATTRIBUTE, "true");
      }

      const currentDebugAttribute: string | null = document.body.getAttribute(DEBUG_ATTRIBUTE);
      const currentDebugState: string = store.state.debugMode.toString();

      if (currentDebugAttribute === currentDebugState) {
        // No change
      } else if (!["true", "false"].includes(currentDebugAttribute || "")) {
        // Attribute has not yet been set
        document.body.setAttribute(DEBUG_ATTRIBUTE, currentDebugState);
      } else {
        // Update state from attribute
        store.commit(MutationType.SET_DEBUG_MODE, currentDebugAttribute === "true");
      }
    });
  }

  flushTextBuffer() {
    // Flush text buffer
    analyticsManager.track(MessageType.TEXT_BUFFER, {
      textBuffer: this.textBuffer,
    });

    this.textBuffer = "";
  }

  setEventHandlers() {
    // This only informs us of how the users are spending time on Metrc
    // without disclosing sensitive information.
    document.addEventListener("click", (e: MouseEvent) => {
      if (e.target && e.isTrusted) {
        if (this.textBuffer.length > 0) {
          this.flushTextBuffer();
        }

        try {
          let targetText = null;
          let targetClassName = null;
          const clientX = e.clientX;
          const clientY = e.clientY;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // Don't allow large strings
          try {
            // @ts-ignore
            targetText = e.target.innerText.trim().slice(0, 100);
          } catch (err) {}

          try {
            // @ts-ignore
            targetClassName = e.target.className;
          } catch (err) {}

          if (store.state.client.flags.enable_click_tracking === "true") {
            analyticsManager.track(MessageType.CLICK, {
              targetText,
              targetClassName,
              clientX,
              clientY,
              windowWidth,
              windowHeight,
            });
          }
        } catch (err) {}
      }

      store.dispatch(`metrcTable/${MetrcTableActions.UPDATE_PRINTABLE_TAG_POOL}`);

      mirrorMetrcTableState();
    });

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this.textBuffer += e.key;

      if (this.textBuffer.length > 500) {
        this.flushTextBuffer();
      }

      if (e.key === "Escape") {
        const modalCloseButton: HTMLAnchorElement | null = document.querySelector(
          `.k-widget.k-window .k-window-titlebar a[aria-label="Close"]`
        );

        if (modalCloseButton) {
          modalCloseButton.click();
        }
      }
    });

    document.addEventListener("input", (e: Event) => {
      mirrorMetrcTableState();
    });

    document.addEventListener("change", (e: Event) => {
      mirrorMetrcTableState();
    });
  }

  async modifyPageAtInterval() {
    if (this.paused) {
      return;
    }

    this.paused = true;

    try {
      if (!this.extendButton) {
        this.extendButton = document.querySelector("#extend_session") as HTMLElement | null;
      }

      if (!this.sessionTimeoutAlert) {
        this.sessionTimeoutAlert = document.querySelector(
          "#session_timeout_alert"
        ) as HTMLElement | null;
      }

      if (!this.sessionTimeoutBar) {
        this.sessionTimeoutBar = document.querySelector("#session_timeout") as HTMLElement | null;
      }

      if (!this.visiblePaginationSizeSelector) {
        this.visiblePaginationSizeSelector = document.querySelector(
          ".k-state-active .k-pager-sizes .k-dropdown-wrap"
        );
      }

      const userAlerts = document.querySelector("#user-alerts");
      if (userAlerts) {
        // @ts-ignore
        userAlerts.style["max-height"] = "150px";
        // @ts-ignore
        userAlerts.style["overflow-y"] = "auto";
      }

      this.activeModal = document.querySelector("div.k-widget.k-window");

      if (store.state.settings?.preventLogout) {
        await this.clickLogoutDismiss();
      }

      if (store.state.settings?.autoDismissPopups) {
        setTimeout(() => {
          for (const btn of document.querySelectorAll(
            "#user-alerts .alert button"
          ) as NodeListOf<HTMLElement>) {
            btn.click();
          }
        }, 5000);
      }

      if (store.state.settings) {
        this.controlLogoutBar(store.state.settings.preventLogout);
        this.controlSnowflakeAnimation(store.state.settings.snowflakeState);
        this.controlDarkMode(store.state.settings.darkModeState);
        this.controlBackground(store.state.settings.backgroundState);
      }
      this.togglePageVisibilityClasses();

      this.tagTableGroups();

      this.initializeFilterButtons();

      mirrorMetrcTableState();

      if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        this.addButtonsToPackageTable();
      }

      if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        this.interceptViewManifestButton();

        this.addButtonsToTransferTable();

        // Transfer subtable for packages should get these too
        // This MUST occur after the transfer buttons are added
        this.addButtonsToPackageTable();
      }

      if (window.location.pathname.match(TRANSFER_HUB_REGEX)) {
        // this.acquireTransferFilterElements();

        this.interceptViewManifestButton();

        this.addButtonsToTransferTable();

        // Transfer subtable for packages should get these too
        // This MUST occur after the transfer buttons are added
        this.addButtonsToPackageTable();
      }

      if (window.location.pathname.match(TRANSFER_TEMPLATE_TAB_REGEX)) {
      }

      if (window.location.pathname.match(TAG_TAB_REGEX)) {
      }

      if (window.location.pathname.match(SALES_TAB_REGEX)) {
      }

      if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
      }

      if (window.location.pathname.match(REPORTS_TAB_REGEX)) {
      }

      await this.modifyTransferModal();

      await this.setPagination();
    } finally {
      this.paused = false;

      this.cycleRefreshPromise();
    }
  }

  async modifyPageOnDomChange() {
    this.modifyPageAtInterval();

    this.updatePromoModal();

    metrcModalManager.maybeAddWidgetsAndListenersToModal();
  }

  getVisibleAnimationContainer(expectedText: string) {
    return getVisibleAnimationContainerImpl(expectedText);
  }

  isTabActive(tab: any) {
    return isTabActiveImpl(tab);
  }

  activeTabOrNull(tabList: NodeList) {
    return activeTabOrNullImpl(tabList);
  }

  suppressAnimationContainer() {
    return suppressAnimationContainerImpl();
  }

  async manageRecoveryLinks() {
    // If the page is 500 or 404, add a simple link to get them home

    // This needs to wait a bit for the toaster to initialize, otherwise the messages don't show
    await timer(1000);

    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");

    if (h1?.innerText.toUpperCase().includes("SERVER ERROR")) {
      if (h2?.innerText.toUpperCase().includes("404 - FILE OR DIRECTORY NOT FOUND")) {
        // 404
        toastManager.openToast("Click here to go back to your Metrc homepage", {
          title: "Page Not Found",
          autoHideDelay: 30000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
          href: window.location.origin,
        });

        analyticsManager.track(MessageType.DETECTED_METRC_ERROR_PAGE, { type: "Not found" });
      }

      if (h2?.innerText.toUpperCase().includes("RUNTIME ERROR")) {
        // 500
        toastManager.openToast("Metrc might be down", {
          title: "Server Error",
          autoHideDelay: 30000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        toastManager.openToast("Click here to go back to your Metrc homepage", {
          title: "Server Error",
          autoHideDelay: 30000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
          href: window.location.origin,
        });

        analyticsManager.track(MessageType.DETECTED_METRC_ERROR_PAGE, { type: "Server error" });
      }
    }
  }

  async addButtonsToPackageTable() {
    return addButtonsToPackageTableImpl();
  }

  async interceptViewManifestButton() {
    return interceptViewManifestButtonImpl();
  }

  async addButtonsToTransferTable() {
    return addButtonsToTransferTableImpl();
  }

  modifyTransferModal() {
    return modifyTransferModalImpl();
  }

  async clickTabWithGridId(metrcGridId: MetrcGridId): Promise<boolean> {
    const element = document.querySelector(
      `[data-grid-selector="#${metrcGridId}"]`
    )! as HTMLElement;

    if (element) {
      element.click();
      return true;
    }

    return false;
  }

  async clickTabStartingWith(
    tabList: NodeList,
    tabText: string,
    previousTabText: string | null = null,
    /**
     * Positive integer
     *
     * 1 means it must be the previously seen node
     * 2 means it was seen two nodes ago
     */
    previousTabTextOffset: number | null = null
  ) {
    return clickTabStartingWithImpl(tabList, tabText, previousTabText, previousTabTextOffset);
  }

  async initializeFilterButtons() {
    return initializeFilterButtonsImpl();
  }

  // When a tab changes, we need to wipe out the references and reacquire them
  async resetFilterElementReferences() {
    return resetFilterElementReferencesImpl();
  }

  // This should be done exactly once per pageload, once the element is found
  async setPagination() {
    return setPaginationImpl();
  }

  async clickLogoutDismiss() {
    return clickLogoutDismissImpl();
  }

  controlSnowflakeAnimation(state: SnowflakeState) {
    return controlSnowflakeAnimationImpl(state);
  }

  controlDarkMode(state: DarkModeState) {
    return controlDarkModeImpl(state);
  }

  controlBackground(state: BackgroundState) {
    return controlBackgroundImpl(state);
  }

  togglePageVisibilityClasses() {
    return togglePageVisibilityClassesImpl();
  }

  controlLogoutBar(hide: boolean) {
    return controlLogoutBarImpl(hide);
  }

  tagTableGroups() {
    // Metrc nests tables, which makes adding widgets very difficult.
    // This performs eager attribute grouping, which allows CSS selectors to tease apart nested tables
    // and associates them with their immediate parents.

    try {
      const tablesAndRows = document.querySelectorAll(
        `table[role="treegrid"], 
        table[role="treegrid"] tr:not([${TTT_TABLEGROUP_ATTRIBUTE}]),
        table[role="grid"], 
        table[role="grid"] tr:not([${TTT_TABLEGROUP_ATTRIBUTE}])`
      );

      let groupId = null;
      for (const el of tablesAndRows) {
        if (el.hasAttribute(TTT_TABLEGROUP_ATTRIBUTE)) {
          groupId = el.getAttribute(TTT_TABLEGROUP_ATTRIBUTE);
          continue;
        }

        // We are encountering a node with no group ID
        if (el.nodeName === "TABLE") {
          groupId = uuidv4();
          el.setAttribute(TTT_TABLEGROUP_ATTRIBUTE, groupId);
        } else {
          if (!groupId) {
            throw new Error("Needed groupId, but was not yet assigned");
          }
          el.setAttribute(TTT_TABLEGROUP_ATTRIBUTE, groupId);
        }
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  clickRefreshLinks() {
    return clickRefreshLinksImpl();
  }

  updatePromoModal() {
    if (document.querySelector("#spinnerBackground")) {
      modalManager.dispatchModalEvent(ModalType.PROMO, ModalAction.OPEN, {});
    } else {
      modalManager.dispatchModalEvent(ModalType.PROMO, ModalAction.CLOSE, {});
    }
  }
}

export const pageManager = new PageManager();
