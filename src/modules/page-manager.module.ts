import {
  DEBUG_ATTRIBUTE,
  LandingPage,
  MessageType,
  METRC_INDUSTRY_LICENSE_PATH_REGEX,
  METRC_TAG_REGEX,
  ModalAction,
  ModalType,
  PackageFilterIdentifiers,
  PackageTabLabel,
  PlantFilterIdentifiers,
  PlantsTabLabel,
  TabKey,
  TagFilterIdentifiers,
  TagsTabLabel,
  TransferFilterIdentifiers,
  TransfersTabLabel,
  TTT_DARK_MODE,
  TTT_LIGHT_MODE,
  TTT_SNOWFLAKES,
} from "@/consts";
import {
  DarkModeState,
  IAtomicService,
  IAuthState,
  IPackageSearchFilters,
  IPageMetrcFacilityData,
  ITagSearchFilters,
  ITransferSearchFilters,
  SnowflakeState,
} from "@/interfaces";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { isIdentityEligibleForTransferTools } from "@/utils/access-control";
import { getUrl } from "@/utils/assets";
import { debugLogFactory } from "@/utils/debug";
import { getLicenseFromNameOrError } from "@/utils/facility";
import { hashObjectValueOrNull } from "@/utils/url";
import _ from "lodash";
import { timer } from "rxjs";
import { analyticsManager } from "./analytics-manager.module";
import { authManager } from "./auth-manager.module";
import { primaryDataLoader } from "./data-loader/data-loader.module";
import { facilityManager } from "./facility-manager.module";
import { metrcModalManager } from "./metrc-modal-manager.module";
import { modalManager } from "./modal-manager.module";

export const PLANTS_TAB_REGEX = /.*\/plants$/;
export const REPORTS_TAB_REGEX = /.*\/reports$/;
export const PACKAGE_TAB_REGEX = /.*\/packages$/;
export const TRANSFER_TAB_REGEX = /.*\/transfers\/licensed$/;
export const TRANSFER_HUB_REGEX = /.*\/transfers\/hub$/;
export const TRANSFER_TEMPLATE_TAB_REGEX = /.*\/transfers\/licensed\/templates$/;
export const SALES_TAB_REGEX = /.*\/sales\/receipts$/;
export const TAG_TAB_REGEX = /.*\/admin\/tags$/;

const debugLog = debugLogFactory("page-manager.module.ts");

// https://stackoverflow.com/questions/12036038/is-there-unicode-glyph-symbol-to-represent-search
// color: #49276a;
const SEARCH_ICON_MARKUP = `<div class="inline-search-icon">&#9906;</div>`;
const ARROW_ICON_MARKUP = `<div>&#8599;</div>`;

function atLeastOneIsTruthy(...elements: any[]) {
  return elements.reduce((a, b) => !!a || !!b);
}

/**
 * Dispatching a click event causes the page to scroll down to show that element.
 * Temporarily hiding the element causes the page to skip the scroll without warping the DOM
 *
 * @param el
 */
// function scrollSafeClick(el: HTMLElement) {
//     console.log('scroll safe clicking el', el)
//     const e = new Event('click');
//     e.preventDefault();
//     el.dispatchEvent(e);
//     // el.style.display = 'none';
//     // el.click();
//     // setTimeout(() => { el.style.display = 'block' }, 100);
// }

function noScrollEventFactory(eventName = "click"): Event {
  const e = new Event(eventName);
  e.preventDefault();
  return e;
}

const t0 = performance.now();
const INLINE_TABLE_BUTTON_RENDER_DELAY = 500;

class PageManager implements IAtomicService {
  textBuffer: string = "";

  suppressAnimationContainerTimeout: any = null;

  plantsTabs: NodeList = [] as any;
  selectedPlantTab: HTMLElement | null = null;

  packageTabs: NodeList = [] as any;
  selectedPackageTab: HTMLElement | null = null;
  // activePackageTab: HTMLElement | null = null;
  // onHoldPackageTab: HTMLElement | null = null;
  // inactivePackageTab: HTMLElement | null = null;

  transferTabs: NodeList = [] as any;
  selectedTransferTab: HTMLElement | null = null;
  // incomingTransferTab: HTMLElement | null = null;
  // outgoingTransferTab: HTMLElement | null = null;
  // rejectedTransferTab: HTMLElement | null = null;

  salesTabs: NodeList = [] as any;

  tagTabs: NodeList = [] as any;
  selectedTagTab: HTMLElement | null = null;
  // availableTagTab: HTMLElement | null = null;
  // usedTagTab: HTMLElement | null = null;
  // voidedTagTab: HTMLElement | null = null;

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

  // Plant Search
  plantSearchComponent: HTMLElement | null = null;

  plantLabelFilterInput: HTMLInputElement | null = null;
  plantLabelFilterSelect: HTMLElement | null = null;
  plantLabelApplyFiltersButton: HTMLButtonElement | null = null;

  plantStrainNameFilterInput: HTMLInputElement | null = null;
  plantStrainNameApplyFiltersButton: HTMLButtonElement | null = null;

  plantLocationNameFilterInput: HTMLInputElement | null = null;
  plantLocationNameApplyFiltersButton: HTMLButtonElement | null = null;

  plantClearFiltersButton: HTMLButtonElement | null = null;

  // Package Search

  packageSearchComponent: HTMLElement | null = null;

  packageLabelFilterInput: HTMLInputElement | null = null;
  packageLabelFilterSelect: HTMLElement | null = null;
  packageLabelApplyFiltersButton: HTMLButtonElement | null = null;

  packageSourceHarvestNameFilterInput: HTMLInputElement | null = null;
  packageSourceHarvestNameApplyFiltersButton: HTMLButtonElement | null = null;

  packageSourcePackageLabelFilterInput: HTMLInputElement | null = null;
  packageSourcePackageLabelApplyFiltersButton: HTMLButtonElement | null = null;

  packageItemNameFilterInput: HTMLInputElement | null = null;
  packageItemNameApplyFiltersButton: HTMLButtonElement | null = null;

  packageItemStrainNameFilterInput: HTMLInputElement | null = null;
  packageItemStrainNameApplyFiltersButton: HTMLButtonElement | null = null;

  packageItemProductCategoryNameFilterInput: HTMLInputElement | null = null;
  packageItemProductCategoryNameApplyFiltersButton: HTMLButtonElement | null = null;

  packageLocationNameFilterInput: HTMLInputElement | null = null;
  packageLocationNameApplyFiltersButton: HTMLButtonElement | null = null;

  packageClearFiltersButton: HTMLButtonElement | null = null;

  // Transfer Search

  transferManifestNumberFilterInput: HTMLInputElement | null = null;
  transferManifestNumberFilterSelect: HTMLElement | null = null;
  transferManifestNumberApplyFiltersButton: HTMLButtonElement | null = null;

  transferClearFiltersButton: HTMLButtonElement | null = null;

  // Tag Search

  tagNumberFilterInput: HTMLInputElement | null = null;
  tagNumberFilterSelect: HTMLElement | null = null;
  tagNumberApplyFiltersButton: HTMLButtonElement | null = null;

  tagClearFiltersButton: HTMLButtonElement | null = null;

  // Prevents recurring method from overrunning itself
  paused: boolean = false;

  private refresh: Promise<void> = Promise.resolve();
  private refreshResolve: any;

  async init() {
    // this.manageLoginRedirect();
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
    this.packageTabs = document.querySelectorAll("#packages_tabstrip li.k-item") as NodeList;
    this.plantsTabs = document.querySelectorAll("#plants_tabstrip li.k-item") as NodeList;
    this.transferTabs = document.querySelectorAll("#transfers_tabstrip li.k-item") as NodeList;
    this.salesTabs = document.querySelectorAll("#sales_tabstrip li.k-item") as NodeList;
    this.tagTabs = document.querySelectorAll("#tags_tabstrip li.k-item") as NodeList;
    this.plantsTabs = document.querySelectorAll("#plants_tabstrip li.k-item") as NodeList;

    // Eagerly modify
    timer(0, 2500).subscribe(() => this.modifyPageAtInterval());

    const debouncedHandler = _.debounce(() => this.modifyPageOnDomChange(), 100);

    const observer = new MutationObserver(() => debouncedHandler());

    observer.observe(document.body, { subtree: true, childList: true });
  }

  public pauseFor(pauseMs: number) {
    this.paused = true;

    setTimeout(() => (this.paused = false), pauseMs);
  }

  private cycleRefreshPromise(): void {
    this.refreshResolve && this.refreshResolve();
    this.refresh = new Promise((resolve, reject) => {
      this.refreshResolve = resolve;
    });
  }

  /**
   * Shared method for emulating a mutex for methods that use native event dispatch
   */
  private clickSettleDelay() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  private initializeDebug() {
    timer(0, 1000).subscribe(() => {
      // This works! Use for scanner
      // console.log(document.activeElement);
      // try {
      //   // @ts-ignore
      //   document.activeElement.value = "jake";
      // } catch (e) {
      //   console.error(e);
      // }

      // Phase out Task Queue, remove from settings
      store.commit(MutationType.PURGE_TASK_QUEUE);

      if (window.location.hash === "#debug") {
        document.body.setAttribute(DEBUG_ATTRIBUTE, "true");
      }

      const currentDebugAttribute: string | null = document.body.getAttribute(DEBUG_ATTRIBUTE);
      const currentDebugState: string = store.state.debugMode.toString();

      if (currentDebugAttribute === currentDebugState) {
        // No change
        return;
      } else if (!["true", "false"].includes(currentDebugAttribute || "")) {
        // Attribute has not yet been set
        document.body.setAttribute(DEBUG_ATTRIBUTE, currentDebugState);
        return;
      } else {
        // Update state from attribute
        store.commit(MutationType.SET_DEBUG_MODE, currentDebugAttribute === "true");
      }
    });
  }

  private flushTextBuffer() {
    // Flush text buffer
    analyticsManager.track(MessageType.TEXT_BUFFER, {
      textBuffer: this.textBuffer,
    });

    this.textBuffer = "";
  }

  private setEventHandlers() {
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
          let clientX = e.clientX;
          let clientY = e.clientY;
          let windowWidth = window.innerWidth;
          let windowHeight = window.innerHeight;

          // Don't allow large strings
          try {
            // @ts-ignore
            targetText = e.target.innerText.trim().slice(0, 100);
          } catch (err) {}

          try {
            // @ts-ignore
            targetClassName = e.target.className;
          } catch (err) {}

          analyticsManager.track(MessageType.CLICK, {
            targetText,
            targetClassName,
            clientX,
            clientY,
            windowWidth,
            windowHeight,
          });
        } catch (err) {}
      }
    });

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this.textBuffer += e.key;

      if (this.textBuffer.length > 500) {
        this.flushTextBuffer();
      }
    });
  }

  private getVisibleAnimationContainer(expectedText: string) {
    // Assumption: last container is almost certainly the one just added
    const containers = document.querySelectorAll(".k-animation-container");

    for (let i = containers.length - 1; i >= 0; --i) {
      const container = containers[i] as HTMLElement;

      // if (container.style.display !== 'none') {
      if (container.textContent?.includes(expectedText) && container.style.display !== "none") {
        return container;
      }
    }

    return null;
  }

  private async modifyPageAtInterval() {
    if (this.paused) {
      return;
    }

    this.paused = true;

    try {
      // TODO much of this can be moved into observer handler
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

      // TODO move this into property
      const userAlerts = document.querySelector("#user-alerts");
      if (userAlerts) {
        // @ts-ignore
        userAlerts.style["max-height"] = "150px";
        // @ts-ignore
        userAlerts.style["overflow-y"] = "auto";
      }

      this.activeModal = document.querySelector("div.k-widget.k-window");

      // TODO the methods should read the store directly
      if (store.state.settings?.preventLogout) {
        await this.clickLogoutDismiss();
      }

      if (store.state.settings) {
        this.controlLogoutBar(store.state.settings.preventLogout);
        this.controlSnowflakeAnimation(store.state.settings.snowflakeState);
        this.controlDarkMode(store.state.settings.darkModeState);
      }
      this.togglePageVisibilityClasses();

      if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        await this.managePackageTabs();
        this.acquirePackageFilterElements();
        // this.readPackageFilters();

        // this.addTttNewPackageButtonToPackagesPage();

        // this.addTttTransferButtonToPackagesPage();

        //     this.addQuickTransferButtonToPackagesPage();
        //     this.addQuickPackageButtonToPackagesPage();

        // this.addPackageModalButtonToPackagesPage();

        this.addButtonsToPackageTable();
      }

      if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        await this.manageTransfersTabs();
        this.acquireTransferFilterElements();
        this.readTransferFilters();

        // this.addTttTransferButtonToTransferPage();

        //     this.addQuickTransferButtonToTransferPage();

        // this.addTransferModalButtonToTransfersPage();

        this.interceptViewManifestButton();

        this.addButtonsToTransferTable();

        // Transfer subtable for packages should get these too
        // This MUST occur after the transfer buttons are added
        this.addButtonsToPackageTable();
      }

      if (window.location.pathname.match(TRANSFER_HUB_REGEX)) {
        this.interceptViewManifestButton();
      }

      if (window.location.pathname.match(TRANSFER_TEMPLATE_TAB_REGEX)) {
        //     this.addQuickTransferTemplateButtonToTransferTemplatesPage();
      }

      if (window.location.pathname.match(TAG_TAB_REGEX)) {
        await this.manageTagsTabs();
        this.acquireTagFilterElements();
        this.readTagFilters();
      }

      if (window.location.pathname.match(SALES_TAB_REGEX)) {
        await this.manageSalesTabs();
      }

      if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
        await this.managePlantTabs();
        this.acquirePlantFilterElements();

        // this.addPlantModalButtonToPlantsPage();
      }

      if (window.location.pathname.match(REPORTS_TAB_REGEX)) {
        // if (
        //   isIdentityEligibleForReports({
        //     identity: store.state.pluginAuth?.authState?.identity || null,
        //     hostname: window.location.hostname
        //   })
        // ) {
        //   this.addReportsButtonToReportsPage();
        // }
      }

      await this.modifyTransferModal();

      await this.setPagination();
    } finally {
      this.paused = false;

      this.cycleRefreshPromise();
    }
  }

  private async modifyPageOnDomChange() {
    this.modifyPageAtInterval();

    this.updatePromoModal();

    metrcModalManager.maybeAddWidgetsAndListenersToModal();
  }

  private isTabActive(tab: any) {
    return tab.getAttribute("aria-selected") === "true";
  }

  private activeTabOrNull(tabList: NodeList) {
    for (let i = 0; i < tabList.length; ++i) {
      const tab = tabList[i] as HTMLElement;

      if (this.isTabActive(tab)) {
        return tab;
      }
    }

    return null;
  }

  private suppressAnimationContainer() {
    this.suppressAnimationContainerTimeout && clearTimeout(this.suppressAnimationContainerTimeout);
    this.suppressAnimationContainerTimeout = null;

    document.body.classList.add("suppress-animation-container");

    this.suppressAnimationContainerTimeout = setTimeout(
      () => document.body.classList.remove("suppress-animation-container"),
      1000
    );
  }

  private async manageRecoveryLinks() {
    // If the page is 500 or 404, add a simple link to get them home

    // This needs to wait a bit for the toaster to initialize, otherwise the messages don't show
    await timer(1000);

    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");

    if (h1?.innerText.toUpperCase().includes("SERVER ERROR")) {
      if (h2?.innerText.toUpperCase().includes("404 - FILE OR DIRECTORY NOT FOUND")) {
        // 404
        toastManager.openToast(`Click here to go back to your Metrc homepage`, {
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
        toastManager.openToast(`Metrc might be down`, {
          title: "Server Error",
          autoHideDelay: 30000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        toastManager.openToast(`Click here to go back to your Metrc homepage`, {
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

  private async manageLoginRedirect() {
    // This method is just too prone to cause problems,
    // and doesn't provide enough of a benefit to the user.

    const currentPathname = window.location.pathname;

    if (store.state.navigateOnNextLoad) {
      // Redirect should not interfere with site use. Unset
      // in all situations, even if a redirect is not triggered.
      // This will protect against worst-case situations where
      // T3 attempts to redirect to invalid URLs, limiting it to
      // one redirect.
      store.commit(MutationType.SET_REDIRECT, false);

      // The previous page told us to redirect,
      // but we need to check that the login was successful
      const authState: IAuthState | null = await authManager.authStateOrNull();

      if (authState) {
        // A login just happened, so trigger a
        // redirect when the page loads
        let subpath = null;

        const match = currentPathname.match(METRC_INDUSTRY_LICENSE_PATH_REGEX);

        switch (store.state.settings?.landingPage) {
          case LandingPage.TRANSFERS:
            subpath = `/transfers/licensed`;
            break;
          case LandingPage.TRANSFER_HUB:
            subpath = `/transfers/hub`;
            break;
          case LandingPage.PACKAGES:
            subpath = `/packages`;
            break;
          case LandingPage.PLANTS:
            subpath = `/plants`;
            break;
          case LandingPage.DEFAULT:
            if (match) {
              subpath = match[2];
            }
            break;
          default:
            break;
        }

        let license: string | null = authState.license;

        let homeLicense: string | null;
        if (!!(homeLicense = store.state.settings?.homeLicenses[authState.identity] || null)) {
          const availableLicenses = await facilityManager.ownedFacilitiesOrError();

          debugLog(async () => ["Home license matched:", homeLicense]);

          try {
            // Ensure this facility is still available
            if (
              !!availableLicenses.find(
                (facility: IPageMetrcFacilityData) =>
                  homeLicense === getLicenseFromNameOrError(facility.name)
              )
            ) {
              license = homeLicense;

              debugLog(async () => ["Home license is eligible"]);
            }
          } catch (e) {}
        }

        let path: string | null = null;

        // Construct a new path if all the necessary pieces are available
        if (subpath && license) {
          path = `/industry/${license}${subpath}`;
        }

        // Only navigate if this is a new page
        if (path && window.location.pathname !== path) {
          debugLog(async () => ["Redirect path", path]);

          analyticsManager.track(MessageType.TTT_MANAGEMENT_EVENT, {
            description: `Redirected to ${path}`,
          });

          window.location.href = path;
        }
      }
    } else {
      if (currentPathname === "/log-in") {
        store.commit(MutationType.SET_REDIRECT, true);
      } else {
        store.commit(MutationType.SET_REDIRECT, false);
      }
    }
  }

  //   private async addTttNewPackageButtonToPackagesPage() {
  //     if (!this.tttNewPackageButton) {
  //       const plusIconUrl = await getUrl(require("@/assets/images/plus-solid.svg"));

  //       //     // This is a hacky way of doing it
  //       setTimeout(() => {
  //         if (!this.tttNewPackageButton) {
  //           const btns = document.querySelectorAll(".k-state-active .k-grid-toolbar .btn-group>.btn");
  //           for (let i = 0; i < btns.length; ++i) {
  //             // @ts-ignore
  //             if (btns[i].innerText.includes("New Packages")) {
  //               this.tttNewPackageButton = document.createElement("button");
  //               this.tttNewPackageButton.setAttribute("title", "NEW PACKAGES");
  //               this.tttNewPackageButton.innerHTML = `<img class="btn-svg-img" src="${plusIconUrl}" />`;
  //               this.tttNewPackageButton.setAttribute("type", "button");
  //               this.tttNewPackageButton.setAttribute("class", "btn shadow quick-action-button");
  //               this.tttNewPackageButton.addEventListener("click", () => {
  //                 modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
  //                   initialRoute: "/package/split-package"
  //                 });

  //                 analyticsManager.track(MessageType.STARTED_SPLIT_PACKAGE_FROM_INLINE_BUTTON, {
  //                   header: true
  //                 });

  //                 this.addSelectedPackagesToSplitPackageList();
  //               });
  //               btns[i].parentElement?.prepend(this.tttNewPackageButton);
  //               return;
  //             }
  //           }
  //         }
  //       }, 0);
  //     }
  //   }

  private async addTttTransferButtonToPackagesPage() {
    if (!this.tttTransferButton) {
      if (
        !isIdentityEligibleForTransferTools({
          identity: (await authManager.authStateOrNull())?.identity || null,
          hostname: window.location.hostname,
        })
      ) {
        return;
      }

      const truckIconUrl = await getUrl(require("@/assets/images/truck-solid.svg"));

      // This is a hacky way of doing it
      setTimeout(() => {
        if (!this.tttTransferButton) {
          const btns = document.querySelectorAll(".k-state-active .k-grid-toolbar .btn-group>.btn");
          for (let i = 0; i < btns.length; ++i) {
            // @ts-ignore
            if (btns[i].innerText.includes("New Transfer")) {
              this.tttTransferButton = document.createElement("button");
              this.tttTransferButton.setAttribute("title", "CREATE TRANSFER");
              this.tttTransferButton.innerHTML = `<img class="btn-svg-img" src="${truckIconUrl}" />`;
              this.tttTransferButton.setAttribute("type", "button");
              this.tttTransferButton.setAttribute("class", "btn shadow quick-action-button");
              this.tttTransferButton.addEventListener("click", () => {
                modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
                  initialRoute: "/transfer/create-transfer",
                });

                analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_INLINE_BUTTON, {
                  header: true,
                });

                this.addSelectedPackagesToTransferPackageList();
              });
              btns[i].parentElement?.prepend(this.tttTransferButton);
              return;
            }
          }
        }
      }, 0);
    }
  }

  //   private async addSelectedPackagesToSplitPackageList() {
  //     // NOTE: this will only select the first package since we only split 1
  //     const activePackageMap: Map<
  //       string,
  //       IPackageData
  //     > = await primaryDataLoader
  //       .activePackages()
  //       .then(activePackages => new Map(activePackages.map(pkg => [pkg.Label, pkg])));

  //     const rows = document.querySelectorAll(".k-master-row.k-state-selected");

  //     for (let i = 0; i < rows.length; ++i) {
  //       const row = rows[i];

  //       const targetCell = row.children[1];

  //       // @ts-ignore
  //       const packageTag = targetCell.innerText.trim();

  //       const pkg = activePackageMap.get(packageTag);

  //       if (!pkg) {
  //         continue;
  //       }

  //       store.dispatch(`splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`, {
  //         pkg
  //       });

  //       break;
  //     }
  //   }

  private async addSelectedPackagesToTransferPackageList() {
    // const activePackageMap: Map<
    //   string,
    //   IPackageData
    // > = await primaryDataLoader
    //   .activePackages()
    //   .then(activePackages => new Map(activePackages.map(pkg => [pkg.Label, pkg])));

    const rows = document.querySelectorAll(".k-master-row.k-state-selected");

    for (let i = 0; i < rows.length; ++i) {
      const row = rows[i];

      const targetCell = row.children[1];

      // @ts-ignore
      const packageTag = targetCell.innerText.trim();

      //   const pkg = activePackageMap.get(packageTag);
      const pkg = await primaryDataLoader.activePackage(packageTag);

      if (!pkg) {
        continue;
      }

      store.dispatch(`transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`, { pkg });
    }
  }

  private async addTttTransferButtonToTransferPage() {
    if (!this.tttTransferButton) {
      if (
        !isIdentityEligibleForTransferTools({
          identity: (await authManager.authStateOrNull())?.identity || null,
          hostname: window.location.hostname,
        })
      ) {
        return;
      }

      const truckIconUrl = await getUrl(require("@/assets/images/truck-solid.svg"));

      const btnGroup = document.querySelector(".btn-toolbar>.btn-group");
      if (btnGroup) {
        this.tttTransferButton = document.createElement("button");
        this.tttTransferButton.setAttribute("title", "CREATE TRANSFER");
        this.tttTransferButton.innerHTML = `<img class="btn-svg-img" src="${truckIconUrl}" />`;
        this.tttTransferButton.setAttribute("type", "button");
        this.tttTransferButton.setAttribute("class", "btn shadow quick-action-button");
        this.tttTransferButton.addEventListener("click", () => {
          modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
            initialRoute: "/transfer/create-transfer",
          });

          analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_INLINE_BUTTON, {
            header: true,
          });
        });
        btnGroup.prepend(this.tttTransferButton);
      }
    }
  }

  private async addPlantModalButtonToPlantsPage() {
    // This is a hacky way of doing it
    setTimeout(async () => {
      const toolsIconUrl = await getUrl(require("@/assets/images/tools-solid.svg"));

      if (!this.plantToolsButton) {
        const items = document.querySelectorAll(".k-tabstrip-items.k-reset>li");
        for (let i = items.length - 1; i > 0; --i) {
          this.plantToolsButton = document.createElement("button");
          // this.plantToolsButton.innerHTML = `<div class="button-inline-logo"><span>&#128736;</span></div>`
          this.plantToolsButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
          this.plantToolsButton.setAttribute("type", "button");
          this.plantToolsButton.setAttribute("title", "Cultivator Tools");
          this.plantToolsButton.setAttribute("class", "btn btn-primary");
          this.plantToolsButton.setAttribute(
            "style",
            "float:right; background-color: #49276a !important; background-image: none !important; font-size: 18px !important;"
          );
          this.plantToolsButton.addEventListener("click", () => {
            analyticsManager.track(MessageType.CLICKED_INLINE_TOOLS_BUTTON, {
              type: "Cultivator tools",
            });
            modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
              initialRoute: "/cultivator",
            });
          });
          items[i].parentElement?.append(this.plantToolsButton);
          return;
        }
      }
    }, 0);
  }

  private async addPackageModalButtonToPackagesPage() {
    // This is a hacky way of doing it
    setTimeout(async () => {
      const toolsIconUrl = await getUrl(require("@/assets/images/tools-solid.svg"));

      if (!this.packageToolsButton) {
        const items = document.querySelectorAll(".k-tabstrip-items.k-reset>li");
        for (let i = items.length - 1; i > 0; --i) {
          this.packageToolsButton = document.createElement("button");
          // this.packageToolsButton.innerHTML = `<div class="button-inline-logo"><span>&#128736;</span></div>`
          this.packageToolsButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
          this.packageToolsButton.setAttribute("type", "button");
          this.packageToolsButton.setAttribute("title", "Package Tools");
          this.packageToolsButton.setAttribute("class", "btn btn-primary");
          this.packageToolsButton.setAttribute(
            "style",
            "float:right; background-color: white !important; background-image: none !important; font-size: 18px !important;"
          );
          this.packageToolsButton.addEventListener("click", () => {
            analyticsManager.track(MessageType.CLICKED_INLINE_TOOLS_BUTTON, {
              type: "Package tools",
            });
            modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
              initialRoute: "/package",
            });
          });
          items[i].parentElement?.append(this.packageToolsButton);
          return;
        }
      }
    }, 0);
  }

  private async addTransferModalButtonToTransfersPage() {
    const authState = await authManager.authStateOrNull();

    if (!authState) {
      return;
    }

    if (
      !isIdentityEligibleForTransferTools({
        identity: authState?.identity,
        hostname: window.location.hostname,
      })
    ) {
      return;
    }

    // This is a hacky way of doing it
    setTimeout(async () => {
      const toolsIconUrl = await getUrl(require("@/assets/images/tools-solid.svg"));

      if (!this.transferToolsButton) {
        const items = document.querySelectorAll(".k-tabstrip-items.k-reset>li");
        for (let i = items.length - 1; i > 0; --i) {
          this.transferToolsButton = document.createElement("button");
          // this.packageToolsButton.innerHTML = `<div class="button-inline-logo"><span>&#128736;</span></div>`
          this.transferToolsButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
          this.transferToolsButton.setAttribute("type", "button");
          this.transferToolsButton.setAttribute("title", "Transfer Tools");
          this.transferToolsButton.setAttribute("class", "btn btn-primary");
          this.transferToolsButton.setAttribute(
            "style",
            "float:right; background-color: #49276a !important; background-image: none !important; font-size: 18px !important;"
          );
          this.transferToolsButton.addEventListener("click", () => {
            analyticsManager.track(MessageType.CLICKED_INLINE_TOOLS_BUTTON, {
              type: "Transfer tools",
            });
            modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
              initialRoute: "/transfer/create-transfer",
            });
          });
          items[i].parentElement?.append(this.transferToolsButton);
          return;
        }
      }
    }, 0);
  }

  private async addButtonsToPackageTable() {
    if (performance.now() - t0 < INLINE_TABLE_BUTTON_RENDER_DELAY) {
      return;
    }

    // const printIconUrl = await getUrl(require("@/assets/images/print-solid.svg"));
    // const fileIconUrl = await getUrl(require("@/assets/images/file-solid.svg"));
    // const downloadIconUrl = await getUrl(require("@/assets/images/file-download-solid.svg"));
    // const searchIconUrl = await getUrl(require("@/assets/images/search-solid.svg"));
    // const truckIconUrl = await getUrl(require("@/assets/images/truck-solid.svg"));
    // const plusIconUrl = await getUrl(require("@/assets/images/plus-solid.svg"));
    const barsIconUrl = await getUrl(require("@/assets/images/bars-solid.svg"));
    const toolsIconUrl = await getUrl(require("@/assets/images/tools-solid.svg"));

    // const rows = document.querySelectorAll('.k-master-row')[0].children[1].innerText.trim()
    // This selector is horrific
    const rows = document.querySelectorAll('.k-content .k-master-row:not([mesinline="1"])');

    if (rows.length === 0) {
      return;
    }

    // const activePackageMap: Promise<Map<string, IPackageData>> = primaryDataLoader.activePackages().then((activePackages) => new Map(activePackages.map((pkg) => [pkg.Label, pkg])));

    // const packageLabTestPdfEligible = !METRC_HOSTNAMES_LACKING_LAB_PDFS.includes(window.location.hostname);

    // const authState = await authManager.authStateOrError();

    for (let i = 0; i < rows.length; ++i) {
      const row = rows[i];

      row.setAttribute("mesinline", "1");

      const targetCell = row.children[1];

      // @ts-ignore
      const packageTag = targetCell.innerText.trim();

      if (!packageTag || !packageTag.match(METRC_TAG_REGEX)) {
        console.error("bad packageTag");
        continue;
      }

      const container = document.createElement("div");
      container.classList.add("inline-button-container", "btn-group");

      // const searchButton = document.createElement('button');
      // searchButton.setAttribute('title', 'SEARCH PACKAGE');
      // searchButton.onclick = (event: Event) => {
      //     event.stopPropagation();
      //     event.preventDefault();
      //     // This click will kill the open state if it's synchronous
      //     // timer(0).subscribe(() => {
      //     searchManager.setPackageSearchVisibility(true);
      //     searchManager.packageQueryString.next(packageTag);
      //     // })
      //     analyticsManager.track(MessageType.CLICKED_SEARCH_PACKAGE_BUTTON);
      // }
      // searchButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      // // searchButton.innerHTML = ARROW_ICON_MARKUP;
      // searchButton.innerHTML = `<img class="btn-svg-img" src="${searchIconUrl}" />`

      // container.appendChild(searchButton);
      targetCell.appendChild(container);

      const menuButton = document.createElement("button");
      menuButton.setAttribute("title", "PACKAGE MENU");
      menuButton.onclick = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const e = {
          // x: event.clientX,
          // y: event.clientY,
          x: event.pageX,
          y: event.pageY,
          packageTag,
        };

        analyticsManager.track(MessageType.OPENED_CONTEXT_MENU, e);
        modalManager.dispatchContextMenuEvent(e);
      };
      menuButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");
      menuButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
      container.appendChild(menuButton);

      // TODO this will show for all package types, filter!
      // const newPackagesButton = document.createElement('button');
      // newPackagesButton.setAttribute('title', 'NEW PACAKGES');
      // // @ts-ignore
      // newPackagesButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      // newPackagesButton.innerHTML = `<img class="btn-svg-img" src="${plusIconUrl}" />`

      // newPackagesButton.onclick = async () => {
      //     const pkg = await primaryDataLoader.activePackage(packageTag)

      //     store.dispatch(`splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`, { pkg });

      //     analyticsManager.track(
      //         MessageType.STARTED_SPLIT_PACKAGE_FROM_INLINE_BUTTON,
      //         {}
      //     );
      //     modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
      //         initialRoute: "/package/split-package",
      //     });

      //     this.addSelectedPackagesToSplitPackageList();
      // }

      // container.appendChild(newPackagesButton);

      // TODO nix this
      // activePackageMap.then(async (activePackageMap: Map<string, IPackageData>) => {
      //     const pkg = activePackageMap.get(packageTag);

      //     if (!pkg) {
      //         return;
      //     }

      //     if (
      //         isIdentityEligibleForTransferTools({
      //             identity: authState.identity,
      //             hostname: window.location.hostname,
      //         })) {

      //         const transferButton = document.createElement('button');
      //         transferButton.setAttribute('title', 'CREATE TRANSFER');
      //         // @ts-ignore
      //         transferButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      //         transferButton.innerHTML = `<img class="btn-svg-img" src="${truckIconUrl}" />`

      //         transferButton.onclick = () => {
      //             store.dispatch(`transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`, { pkg });

      //             analyticsManager.track(
      //                 MessageType.STARTED_TRANSFER_FROM_INLINE_BUTTON,
      //                 {}
      //             );
      //             modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
      //                 initialRoute: "/transfer/create-transfer",
      //             });

      //             this.addSelectedPackagesToTransferPackageList();
      //         }

      //         container.appendChild(transferButton);
      //     }

      //     if (packageLabTestPdfEligible) {
      //         const downloadButton = document.createElement('button');
      //         downloadButton.setAttribute('title', 'DOWNLOAD LAB TEST');
      //         // @ts-ignore
      //         downloadButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      //         // printButton.innerHTML = '<i class="fas fa-print"></i> PRINT';
      //         // printButton.innerHTML = 'DOWNLOAD LAB TEST';
      //         downloadButton.innerHTML = `<img class="btn-svg-img" src="${downloadIconUrl}" />`

      //         const viewButton = document.createElement('button');
      //         viewButton.setAttribute('title', 'VIEW LAB TEST');
      //         viewButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      //         // viewButton.innerHTML = ARROW_ICON_MARKUP;
      //         viewButton.innerHTML = `<img class="btn-svg-img" src="${fileIconUrl}" />`

      //         const printButton = document.createElement('button');
      //         printButton.setAttribute('title', 'PRINT LAB TEST');
      //         // @ts-ignore
      //         printButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn')
      //         printButton.innerHTML = `<img class="btn-svg-img" src="${printIconUrl}" />`
      //         // printButton.innerHTML = '<i class="fas fa-print"></i> PRINT';
      //         // printButton.innerHTML = 'PRINT';
      //         // printButton.innerHTML = '&#x1F5A8;'

      //         const getUrls = async () => {
      //             const urls = await getLabTestUrlsFromPackage({pkg});

      //             if (urls.length > 1) {
      //                 debugLog(async () => [urls, pkg.Label]);
      //             }

      //             return urls;
      //         }

      //         if (pkg.LabTestingStateName === 'TestPassed') {
      //             viewButton.onclick = async (event: Event) => {
      //                 const urls = await getUrls();

      //                 if (!urls[0]) {
      //                     return;
      //                 }

      //                 event.stopPropagation();
      //                 event.preventDefault();

      //                 modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, { documentUrls: urls })
      //                 analyticsManager.track(MessageType.CLICKED_VIEW_LAB_TEST_BUTTON);
      //             }

      //             printButton.onclick = async () => {
      //                 const urls = await getUrls();

      //                 if (!urls[0]) {
      //                     return;
      //                 }

      //                 printPdfFromUrl({ urls: urls, modal: true });

      //                 analyticsManager.track(MessageType.CLICKED_PRINT_LAB_TEST_BUTTON);
      //             }

      //             downloadButton.onclick = async () => {
      //                 downloadLabTests({pkg});

      //                 analyticsManager.track(MessageType.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
      //             }

      //             container.appendChild(viewButton);
      //             container.appendChild(printButton);
      //             container.appendChild(downloadButton);
      //         }
      //     }
      // })
    }
  }

  private async interceptViewManifestButton() {
    if (!store.state.settings?.enableManifestDocumentViewer) {
      return;
    }

    if (this.replacementManifestButton && this.viewManifestButton) {
      return;
    }

    // This will work on the main transfer page
    this.viewManifestButton = document.querySelector("#viewmanifest-btn");

    // This is the fallback, used in transfer hub
    if (!this.viewManifestButton) {
      const btns = document.querySelectorAll("button.btn.shadow");
      for (let i = 0; i < btns.length; ++i) {
        const btn = btns[i] as HTMLButtonElement;

        if (btn.innerText.includes("View Manifest")) {
          // @ts-ignore
          this.viewManifestButton = btns[i];
          break;
        }
      }
    }

    if (!this.viewManifestButton) {
      debugLog(async () => ["Could not locate view manifest button"]);
      // Couldn't find the button, no point in intercepting
      return;
    }

    // @ts-ignore
    this.viewManifestButton.style.display = "none";

    const button = document.createElement("button");
    button.classList.add("btn", "shadow");
    button.setAttribute("type", "button");
    button.innerText = "View Manifest";
    button.addEventListener("click", () => {
      try {
        let selectedRow = document.querySelector(
          ".k-content > * > * > * >.k-master-row.k-state-selected"
        );

        if (!selectedRow) {
          // Relax the selector
          selectedRow = document.querySelector(".k-master-row.k-state-selected");
        }

        const targetCell = selectedRow?.children[1];

        if (!targetCell) {
          debugLog(async () => ["Could not locate targetCell"]);

          // fall back to the original button
          this.viewManifestButton?.dispatchEvent(new Event("click"));
          return;
        }

        // @ts-ignore
        const manifestNumber = parseInt(targetCell.innerText.trim(), 10);

        if (!selectedRow || !manifestNumber) {
          debugLog(async () => ["Could not locate manifestNumber"]);

          // fall back to the original button
          console.error("manifestNumber fallback");
          this.viewManifestButton?.dispatchEvent(new Event("click"));
          return;
        }

        const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${manifestNumber}`;

        modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
          documentUrls: [manifestUrl],
        });
      } catch (e) {
        // Last-ditch fallback
        console.error("last ditch fallback", e);
        this.viewManifestButton?.dispatchEvent(new Event("click"));
      }
    });

    this.viewManifestButton.parentElement?.appendChild(button);

    if (button.parentElement) {
      this.replacementManifestButton = button;
    }
  }

  private async addButtonsToTransferTable() {
    if (performance.now() - t0 < INLINE_TABLE_BUTTON_RENDER_DELAY) {
      return;
    }

    // const printIconUrl = await getUrl(require("@/assets/images/print-solid.svg"));
    // const fileIconUrl = await getUrl(require("@/assets/images/file-solid.svg"));
    // const downloadIconUrl = await getUrl(require("@/assets/images/file-download-solid.svg"));
    // const searchIconUrl = await getUrl(require("@/assets/images/search-solid.svg"));
    const barsIconUrl = await getUrl(require("@/assets/images/bars-solid.svg"));
    const toolsIconUrl = await getUrl(require("@/assets/images/tools-solid.svg"));

    // const rows = document.querySelectorAll('.k-master-row')[0].children[1].innerText.trim()
    // This selector is horrific
    const rows = document.querySelectorAll(
      '.k-content > * > * > * >.k-master-row:not([mesinline="1"])'
    );

    if (rows.length === 0) {
      return;
    }

    for (let i = 0; i < rows.length; ++i) {
      const row = rows[i];

      row.setAttribute("mesinline", "1");

      const targetCell = row.children[1];

      // @ts-ignore
      const manifestNumber = parseInt(targetCell.innerText.trim(), 10);

      if (!manifestNumber) {
        console.error("bad manifestNumber");
        continue;
      }

      const container = document.createElement("div");
      container.classList.add("inline-button-container", "btn-group");
      // container.style.display = 'inline-block';

      const menuButton = document.createElement("button");
      menuButton.setAttribute("title", "TRANSFER MENU");
      menuButton.onclick = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const e = {
          // x: event.clientX,
          // y: event.clientY,
          x: event.pageX,
          y: event.pageY,
          manifestNumber: manifestNumber.toString(),
        };

        analyticsManager.track(MessageType.OPENED_CONTEXT_MENU, e);
        modalManager.dispatchContextMenuEvent(e);
      };
      menuButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");
      menuButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
      container.appendChild(menuButton);

      //   const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${manifestNumber}`;

      //   const searchButton = document.createElement("button");
      //   searchButton.setAttribute("title", "SEARCH TRANSFER");
      //   searchButton.onclick = (event: Event) => {
      //     event.stopPropagation();
      //     event.preventDefault();

      //     // This click will kill the open state if it's synchronous
      //     // timer(0).subscribe(() => {
      //     searchManager.setTransferSearchVisibility(true);
      //     searchManager.transferQueryString.next(manifestNumber.toString());
      //     // })
      //     analyticsManager.track(MessageType.CLICKED_SEARCH_TRANSFER_BUTTON);
      //   };
      //   searchButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");
      //   // searchButton.innerHTML = ARROW_ICON_MARKUP;
      //   searchButton.innerHTML = `<img class="btn-svg-img" src="${searchIconUrl}" />`;

      //   const viewButton = document.createElement("button");
      //   viewButton.setAttribute("title", "VIEW MANIFEST");
      //   viewButton.onclick = (event: Event) => {
      //     event.stopPropagation();
      //     event.preventDefault();

      //     modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
      //       documentUrls: [manifestUrl]
      //     });
      //     analyticsManager.track(MessageType.CLICKED_VIEW_MANIFEST_BUTTON);
      //   };
      //   viewButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");
      //   // viewButton.innerHTML = ARROW_ICON_MARKUP;
      //   viewButton.innerHTML = `<img class="btn-svg-img" src="${fileIconUrl}" />`;

      //   const printButton = document.createElement("button");
      //   printButton.setAttribute("title", "PRINT MANIFEST");
      //   // @ts-ignore
      //   printButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");
      //   printButton.innerHTML = `<img class="btn-svg-img" src="${printIconUrl}" />`;
      //   // printButton.innerHTML = '<i class="fas fa-print"></i> PRINT';
      //   // printButton.innerHTML = 'PRINT';
      //   // printButton.innerHTML = '&#x1F5A8;'

      //   printButton.onclick = () => {
      //     printPdfFromUrl({ urls: [manifestUrl], modal: true });

      //     analyticsManager.track(MessageType.CLICKED_PRINT_MANIFEST_BUTTON);
      //   };

      //   const downloadButton = document.createElement("button");
      //   downloadButton.setAttribute("title", "DOWNLOAD MANIFEST");
      //   // downloadButton.innerHTML = '<i class="fas fa-file-download"></i> DOWNLOAD';
      //   // downloadButton.innerHTML = 'DOWNLOAD';
      //   downloadButton.innerHTML = `<img class="btn-svg-img" src="${downloadIconUrl}" />`;

      //   downloadButton.onclick = () => {
      //     downloadFileFromUrl({ url: manifestUrl, filename: `Manifest_${manifestNumber}.pdf` });

      //     analyticsManager.track(MessageType.CLICKED_DOWNLOAD_MANIFEST_BUTTON);
      //   };
      //   downloadButton.classList.add("btn", "btn-default", "btn-small", "ttt-btn");

      //   container.appendChild(searchButton);
      //   container.appendChild(viewButton);
      //   container.appendChild(printButton);
      //   container.appendChild(downloadButton);
      targetCell.appendChild(container);
    }
  }

  modifyTransferModal() {
    if (!this.activeModal) {
      return;
    }

    const button = this.activeModal.querySelector("#ttt-fill-transfer");

    if (!button) {
    }

    // (packages)
    // Package #

    // this.

    // TODO

    // console.log(document.querySelector('div.k-widget.k-window'))
  }

  // enableQuickPackageButton() {
  //     if (this.quickPackageButton) {
  //         this.quickPackageButton.removeAttribute('disabled');
  //     }
  // }

  // enableQuickTransferButton() {
  //     if (this.quickTransferButton) {
  //         this.quickTransferButton.removeAttribute('disabled');
  //     }
  // }

  // enableQuickTransferTemplateButton() {
  //     if (this.quickTransferTemplateButton) {
  //         this.quickTransferTemplateButton.removeAttribute('disabled');
  //     }
  // }

  public async clickTabStartingWith(
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
    if (typeof previousTabTextOffset === "number" && !previousTabText) {
      throw new Error("Must provide previousTabText");
    }

    if (typeof previousTabTextOffset === "number" && previousTabTextOffset < 1) {
      throw new Error("previousTabTextOffset must be a positive integer");
    }

    let seenTabs: string[] = [];
    for (let i = 0; i < tabList.length; ++i) {
      const tab = tabList[i] as HTMLElement;

      if (
        tab &&
        // Check current match
        tab.innerText.startsWith(tabText) &&
        // Check if text was previously seen
        (!previousTabText || seenTabs.find((x: string) => x.includes(previousTabText))) &&
        // Check that offset matches
        (!previousTabTextOffset ||
          seenTabs[seenTabs.length - previousTabTextOffset] === previousTabText)
      ) {
        tab.click();
        await this.clickSettleDelay();
        return;
      }

      seenTabs.push(tab.innerText);
    }

    await pageManager.refresh;
  }

  private async acquirePlantFilterElements() {
    if (!this.plantClearFiltersButton) {
      const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

      if (btn) {
        btn.click();
        // @ts-ignore
        this.plantClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
        btn.click();
      }
    }

    // This is important, as otherwise click() calls will kill page usability
    if (
      atLeastOneIsTruthy(
        this.plantLabelFilterInput,
        this.plantLabelFilterSelect,
        this.plantLabelApplyFiltersButton,
        this.plantStrainNameFilterInput,
        this.plantStrainNameApplyFiltersButton,
        this.plantLocationNameFilterInput,
        this.plantLocationNameApplyFiltersButton
      )
    ) {
      return;
    }

    const plantFilterIdentifiers: PlantFilterIdentifiers[] = [
      PlantFilterIdentifiers.Label,
      PlantFilterIdentifiers.StrainName,
      PlantFilterIdentifiers.LocationName,
    ];

    let menuButton;

    for (let plantFilterIdentifier of plantFilterIdentifiers) {
      menuButton = document.querySelector(
        `.k-state-active th[data-field="${plantFilterIdentifier}"] .k-header-column-menu`
      ) as HTMLElement | null;

      if (menuButton) {
        this.suppressAnimationContainer();

        // This opens the menu and creates the form
        menuButton.click();

        let form = null;
        const animationContainer = this.getVisibleAnimationContainer("Sort Ascending");

        if (animationContainer) {
          form = animationContainer.querySelector(".k-popup form.k-filter-menu");
        }

        if (form) {
          const input = form.querySelector(
            'input[title="Filter Criteria"]'
          ) as HTMLInputElement | null;
          const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          const select = animationContainer?.querySelector(
            ".k-list-scroller ul"
          ) as HTMLElement | null;

          if (input) {
            switch (plantFilterIdentifier) {
              case PlantFilterIdentifiers.Label:
                this.plantLabelFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                    { plantSearchFilters: { label: e.target.value }, propagate: false }
                  )
                );
                this.plantLabelFilterSelect = select;
                this.plantLabelApplyFiltersButton = button;
                break;
              case PlantFilterIdentifiers.StrainName:
                this.plantStrainNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                    { plantSearchFilters: { strainName: e.target.value }, propagate: false }
                  )
                );
                this.plantStrainNameApplyFiltersButton = button;
                break;
              case PlantFilterIdentifiers.LocationName:
                this.plantLocationNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                    { plantSearchFilters: { locationName: e.target.value }, propagate: false }
                  )
                );
                this.plantLocationNameApplyFiltersButton = button;
                break;
              default:
                break;
            }
          }
        }

        // Close the menu
        if (menuButton) {
          menuButton.click();
        }
      } else {
        console.error("Menu button not found", plantFilterIdentifier);
      }
    }
  }

  private async acquirePackageFilterElements() {
    if (!this.packageClearFiltersButton) {
      const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

      if (btn) {
        btn.click();
        // @ts-ignore
        this.packageClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
        btn.click();
      }
    }

    // This is important, as otherwise click() calls will kill page usability
    if (
      atLeastOneIsTruthy(
        this.packageLabelFilterInput,
        this.packageLabelFilterSelect,
        this.packageLabelApplyFiltersButton,
        this.packageSourceHarvestNameFilterInput,
        this.packageSourceHarvestNameApplyFiltersButton,
        this.packageSourcePackageLabelFilterInput,
        this.packageSourcePackageLabelApplyFiltersButton,
        this.packageItemNameFilterInput,
        this.packageItemNameApplyFiltersButton,
        this.packageItemStrainNameFilterInput,
        this.packageItemStrainNameApplyFiltersButton,
        this.packageItemProductCategoryNameFilterInput,
        this.packageItemProductCategoryNameApplyFiltersButton,
        this.packageLocationNameFilterInput,
        this.packageLocationNameApplyFiltersButton
      )
    ) {
      return;
    }

    const packageFilterIdentifiers: PackageFilterIdentifiers[] = [
      PackageFilterIdentifiers.Label,
      PackageFilterIdentifiers.SourceHarvestNames,
      PackageFilterIdentifiers.SourcePackageLabels,
      PackageFilterIdentifiers.ItemName,
      PackageFilterIdentifiers.ItemStrainName,
      PackageFilterIdentifiers.ItemProductCategoryName,
      PackageFilterIdentifiers.LocationName,
    ];

    let menuButton;

    for (let packageFilterIdentifier of packageFilterIdentifiers) {
      menuButton = document.querySelector(
        `.k-state-active th[data-field="${packageFilterIdentifier}"] .k-header-column-menu`
      ) as HTMLElement | null;

      if (menuButton) {
        this.suppressAnimationContainer();

        // This opens the menu and creates the form
        menuButton.click();

        let form = null;
        const animationContainer = this.getVisibleAnimationContainer("Sort Ascending");

        if (animationContainer) {
          form = animationContainer.querySelector(".k-popup form.k-filter-menu");
        }

        if (form) {
          const input = form.querySelector(
            'input[title="Filter Criteria"]'
          ) as HTMLInputElement | null;
          const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          const select = animationContainer?.querySelector(
            ".k-list-scroller ul"
          ) as HTMLElement | null;

          if (input) {
            switch (packageFilterIdentifier) {
              case PackageFilterIdentifiers.Label:
                this.packageLabelFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    { packageSearchFilters: { label: e.target.value }, propagate: false }
                  )
                );
                this.packageLabelFilterSelect = select;
                this.packageLabelApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.SourceHarvestNames:
                this.packageSourceHarvestNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    {
                      packageSearchFilters: { sourceHarvestName: e.target.value },
                      propagate: false,
                    }
                  )
                );
                this.packageSourceHarvestNameApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.SourcePackageLabels:
                this.packageSourcePackageLabelFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    {
                      packageSearchFilters: { sourcePackageLabel: e.target.value },
                      propagate: false,
                    }
                  )
                );
                this.packageSourcePackageLabelApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.ItemName:
                this.packageItemNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    { packageSearchFilters: { itemName: e.target.value }, propagate: false }
                  )
                );
                this.packageItemNameApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.ItemStrainName:
                this.packageItemStrainNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    { packageSearchFilters: { itemStrainName: e.target.value }, propagate: false }
                  )
                );
                this.packageItemStrainNameApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.ItemProductCategoryName:
                this.packageItemProductCategoryNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    {
                      packageSearchFilters: { itemProductCategoryName: e.target.value },
                      propagate: false,
                    }
                  )
                );
                this.packageItemProductCategoryNameApplyFiltersButton = button;
                break;
              case PackageFilterIdentifiers.LocationName:
                this.packageLocationNameFilterInput = input;
                input.addEventListener("input", (e: any) =>
                  store.dispatch(
                    `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                    { packageSearchFilters: { locationName: e.target.value }, propagate: false }
                  )
                );
                this.packageLocationNameApplyFiltersButton = button;
                break;
              default:
                break;
            }
          }
        }

        // Close the menu
        if (menuButton) {
          menuButton.click();
        }
      } else {
        console.error("Menu button not found", packageFilterIdentifier);
      }
    }
  }

  private async acquireTransferFilterElements() {
    if (!this.transferClearFiltersButton) {
      const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

      if (btn) {
        btn.click();
        // @ts-ignore
        this.transferClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
        btn.click();
      }
    }

    // This is important, as otherwise click() calls will kill page usability
    if (
      atLeastOneIsTruthy(
        this.transferManifestNumberFilterInput,
        this.transferManifestNumberFilterSelect,
        this.transferManifestNumberApplyFiltersButton
      )
    ) {
      return;
    }

    const transferFilterIdentifiers: TransferFilterIdentifiers[] = [
      TransferFilterIdentifiers.ManifestNumber,
    ];

    let menuButton;

    for (let transferFilterIdentifier of transferFilterIdentifiers) {
      menuButton = document.querySelector(
        `.k-state-active th[data-field="${transferFilterIdentifier}"] .k-header-column-menu`
      ) as HTMLElement | null;

      if (menuButton) {
        this.suppressAnimationContainer();

        // This opens the menu and creates the form
        menuButton.click();

        let form = null;
        const animationContainer = this.getVisibleAnimationContainer("Sort Ascending");

        if (animationContainer) {
          form = animationContainer.querySelector(".k-popup form.k-filter-menu");
        }

        if (form) {
          const input = form.querySelector(
            'input[title="Filter Criteria"]'
          ) as HTMLInputElement | null;
          const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          const select = animationContainer?.querySelector(
            ".k-list-scroller ul"
          ) as HTMLElement | null;

          if (input) {
            switch (transferFilterIdentifier) {
              case TransferFilterIdentifiers.ManifestNumber:
                this.transferManifestNumberFilterInput = input;
                this.transferManifestNumberFilterSelect = select;
                this.transferManifestNumberApplyFiltersButton = button;
                break;
              default:
                break;
            }
          }
        }
      } else {
        console.error("Menu button not found", transferFilterIdentifier);
      }
    }

    // Close the menu
    if (menuButton) {
      menuButton.click();
    }
  }

  private async acquireTagFilterElements() {
    if (!this.tagClearFiltersButton) {
      const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

      if (btn) {
        btn.click();
        // @ts-ignore
        this.tagClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
        btn.click();
      }
    }

    // This is important, as otherwise click() calls will kill page usability
    if (
      atLeastOneIsTruthy(
        this.tagNumberFilterInput,
        this.tagNumberFilterSelect,
        this.tagNumberApplyFiltersButton
      )
    ) {
      return;
    }

    const tagFilterIdentifiers: TagFilterIdentifiers[] = [TagFilterIdentifiers.Label];

    let menuButton;

    for (let tagFilterIdentifier of tagFilterIdentifiers) {
      menuButton = document.querySelector(
        `.k-state-active th[data-field="${tagFilterIdentifier}"] .k-header-column-menu`
      ) as HTMLElement | null;

      if (menuButton) {
        this.suppressAnimationContainer();

        // This opens the menu and creates the form
        menuButton.click();

        let form = null;
        const animationContainer = this.getVisibleAnimationContainer("Sort Ascending");

        if (animationContainer) {
          form = animationContainer.querySelector(".k-popup form.k-filter-menu");
        }

        if (form) {
          const input = form.querySelector(
            'input[title="Filter Criteria"]'
          ) as HTMLInputElement | null;
          const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          const select = animationContainer?.querySelector(
            ".k-list-scroller ul"
          ) as HTMLElement | null;

          if (input) {
            switch (tagFilterIdentifier) {
              case TagFilterIdentifiers.Label:
                this.tagNumberFilterInput = input;
                this.tagNumberFilterSelect = select;
                this.tagNumberApplyFiltersButton = button;
                break;
              default:
                break;
            }
          }
        }
      } else {
        console.error("Menu button not found", tagFilterIdentifier);
      }
    }

    // Close the menu
    if (menuButton) {
      menuButton.click();
    }
  }

  readPackageFilters() {
    const filters: IPackageSearchFilters = {
      label: null,
      sourceHarvestName: null,
      sourcePackageLabel: null,
      itemName: null,
      itemStrainName: null,
      itemProductCategoryName: null,
      locationName: null,
    };

    filters.label = this.packageLabelFilterInput?.value || null;
    filters.sourceHarvestName = this.packageSourceHarvestNameFilterInput?.value || null;
    filters.sourcePackageLabel = this.packageSourcePackageLabelFilterInput?.value || null;
    filters.itemName = this.packageItemNameFilterInput?.value || null;
    filters.itemStrainName = this.packageItemStrainNameFilterInput?.value || null;
    filters.itemProductCategoryName = this.packageItemProductCategoryNameFilterInput?.value || null;
    filters.locationName = this.packageLocationNameFilterInput?.value || null;

    store.dispatch(`packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`, {
      packageSearchFilters: filters,
    });
  }

  readTransferFilters() {
    const filters: ITransferSearchFilters = {
      manifestNumber: null,
    };
    let updated = false;

    if (this.transferManifestNumberFilterInput) {
      filters.manifestNumber = this.transferManifestNumberFilterInput.value;
      updated = true;
    }

    if (updated) {
      store.commit(MutationType.SET_TRANSFER_SEARCH_FILTERS, filters);
    }
  }

  readTagFilters() {
    const filters: ITagSearchFilters = {
      label: null,
    };
    let updated = false;

    if (this.tagNumberFilterInput) {
      filters.label = this.tagNumberFilterInput.value;
      updated = true;
    }

    if (updated) {
      store.commit(MutationType.SET_TAG_SEARCH_FILTERS, filters);
    }
  }

  async setPlantFilter(plantFilterIdentifier: PlantFilterIdentifiers, value: string) {
    await this.refresh;

    analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
      plantFilterIdentifier,
      value,
    });

    let input: HTMLInputElement | null = null;

    switch (plantFilterIdentifier) {
      case PlantFilterIdentifiers.Label:
        input = this.plantLabelFilterInput;
        break;
      case PlantFilterIdentifiers.StrainName:
        input = this.plantStrainNameFilterInput;
        break;
      case PlantFilterIdentifiers.LocationName:
        input = this.plantLocationNameFilterInput;
        break;
      default:
        console.error("bad identifier:", plantFilterIdentifier);
        break;
    }

    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("change"));
    } else {
      console.log("bad input");
    }

    this.applyPlantFilter(plantFilterIdentifier);
  }

  async setPackageFilter(packageFilterIdentifier: PackageFilterIdentifiers, value: string) {
    await this.refresh;

    analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
      packageFilterIdentifier,
      value,
    });

    let input: HTMLInputElement | null = null;

    switch (packageFilterIdentifier) {
      case PackageFilterIdentifiers.Label:
        input = this.packageLabelFilterInput;
        break;
      case PackageFilterIdentifiers.SourceHarvestNames:
        input = this.packageSourceHarvestNameFilterInput;
        break;
      case PackageFilterIdentifiers.SourcePackageLabels:
        input = this.packageSourcePackageLabelFilterInput;
        break;
      case PackageFilterIdentifiers.ItemName:
        input = this.packageItemNameFilterInput;
        break;
      case PackageFilterIdentifiers.ItemStrainName:
        input = this.packageItemStrainNameFilterInput;
        break;
      case PackageFilterIdentifiers.ItemProductCategoryName:
        input = this.packageItemProductCategoryNameFilterInput;
        break;
      case PackageFilterIdentifiers.LocationName:
        input = this.packageLocationNameFilterInput;
        break;
      default:
        console.error("bad identifier:", packageFilterIdentifier);
        break;
    }

    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("change"));
    } else {
      console.log("bad input");
    }

    this.applyPackageFilter(packageFilterIdentifier);
  }

  async setTransferFilter(transferFilterIdentifier: TransferFilterIdentifiers, value: string) {
    await this.refresh;

    analyticsManager.track(MessageType.SELECTED_TRANSFER_FILTER, {
      transferFilterIdentifier,
      value,
    });

    let input: HTMLInputElement | null = null;

    switch (transferFilterIdentifier) {
      case TransferFilterIdentifiers.ManifestNumber:
        input = this.transferManifestNumberFilterInput;
        break;
      default:
        console.error("bad identifier:", transferFilterIdentifier);
        break;
    }

    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("change"));
    } else {
      console.log("bad input");
    }

    this.applyTransferFilter(transferFilterIdentifier);
  }

  async setTagFilter(tagFilterIdentifier: TagFilterIdentifiers, value: string) {
    await this.refresh;

    analyticsManager.track(MessageType.SELECTED_TAG_FILTER, {
      tagFilterIdentifier,
      value,
    });

    let input: HTMLInputElement | null = null;
    let select: HTMLElement | null = null;

    switch (tagFilterIdentifier) {
      case TagFilterIdentifiers.Label:
        input = this.tagNumberFilterInput;
        select = this.tagNumberFilterSelect;
        break;
      default:
        console.error("bad identifier:", tagFilterIdentifier);
        break;
    }

    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("change"));
    } else {
      console.log("bad input");
    }

    if (select) {
      for (let li of select.querySelectorAll("li")) {
        if (li.innerText.trim() === "Equal to") {
          li.click();
          break;
        }
      }
    } else {
      console.log("bad select");
    }

    this.applyTagFilter(tagFilterIdentifier);
  }
  applyPlantFilter(plantFilterIdentifier: PlantFilterIdentifiers) {
    let button: HTMLButtonElement | null = null;

    switch (plantFilterIdentifier) {
      case PlantFilterIdentifiers.Label:
        button = this.plantLabelApplyFiltersButton;
        break;
      case PlantFilterIdentifiers.StrainName:
        button = this.plantStrainNameApplyFiltersButton;
        break;
      case PlantFilterIdentifiers.LocationName:
        button = this.plantLocationNameApplyFiltersButton;
        break;
      default:
        console.error("bad identifier:", plantFilterIdentifier);
        break;
    }

    if (button) {
      button.click();
    } else {
      console.log("bad button");
    }
  }

  applyPackageFilter(packageFilterIdentifier: PackageFilterIdentifiers) {
    let button: HTMLButtonElement | null = null;

    switch (packageFilterIdentifier) {
      case PackageFilterIdentifiers.Label:
        button = this.packageLabelApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.SourceHarvestNames:
        button = this.packageSourceHarvestNameApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.SourcePackageLabels:
        button = this.packageSourcePackageLabelApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.ItemName:
        button = this.packageItemNameApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.ItemStrainName:
        button = this.packageItemStrainNameApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.ItemProductCategoryName:
        button = this.packageItemProductCategoryNameApplyFiltersButton;
        break;
      case PackageFilterIdentifiers.LocationName:
        button = this.packageLocationNameApplyFiltersButton;
        break;
      default:
        console.error("bad identifier:", packageFilterIdentifier);
        break;
    }

    if (button) {
      button.click();
    } else {
      console.log("bad button");
    }
  }

  applyTransferFilter(transferFilterIdentifier: TransferFilterIdentifiers) {
    let button: HTMLButtonElement | null = null;

    switch (transferFilterIdentifier) {
      case TransferFilterIdentifiers.ManifestNumber:
        button = this.transferManifestNumberApplyFiltersButton;
        break;
      default:
        console.error("bad identifier:", transferFilterIdentifier);
        break;
    }

    if (button) {
      button.click();
    } else {
      console.log("bad button");
    }
  }

  applyTagFilter(tagFilterIdentifier: TagFilterIdentifiers) {
    let button: HTMLButtonElement | null = null;

    switch (tagFilterIdentifier) {
      case TagFilterIdentifiers.Label:
        button = this.tagNumberApplyFiltersButton;
        break;
      default:
        console.error("bad identifier:", tagFilterIdentifier);
        break;
    }

    if (button) {
      button.click();
    } else {
      console.log("bad button");
    }
  }

  // Clicks the Metrc reset button - everything is wiped out
  async resetMetrcPlantFilters() {
    store.dispatch(`plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`, {
      plantSearchFilters: {},
    });
    if (this.plantClearFiltersButton) {
      this.plantClearFiltersButton.click();
      return;
    } else {
      console.log("Bad resetMetrcPlantFilters");
    }
  }

  // Clicks the Metrc reset button - everything is wiped out
  async resetMetrcPackageFilters() {
    store.dispatch(`packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`, {
      packageSearchFilters: {},
    });
    if (this.packageClearFiltersButton) {
      this.packageClearFiltersButton.click();
      return;
    } else {
      console.log("Bad resetMetrcPackageFilters");
    }
  }

  // Clicks the Metrc reset button - everything is wiped out
  async resetMetrcTransferFilters() {
    if (this.transferClearFiltersButton) {
      this.transferClearFiltersButton.click();
      return;
    } else {
      console.log("Bad resetMetrcTransferFilters");
    }
  }

  // Clicks the Metrc reset button - everything is wiped out
  async resetMetrcTagFilters() {
    if (this.tagClearFiltersButton) {
      this.tagClearFiltersButton.click();
      return;
    } else {
      console.log("Bad resetMetrcTagFilters");
    }
  }

  // When a tab changes, we need to wipe out the references and reacquire them
  async resetFilterElementReferences() {
    // Plant
    this.plantClearFiltersButton = null;

    this.plantLabelFilterInput = null;
    this.plantLabelFilterSelect = null;
    this.plantLabelApplyFiltersButton = null;

    this.plantStrainNameFilterInput = null;
    this.plantStrainNameApplyFiltersButton = null;

    this.plantLocationNameFilterInput = null;
    this.plantLocationNameApplyFiltersButton = null;

    // Package
    this.packageClearFiltersButton = null;

    this.packageLabelFilterInput = null;
    this.packageLabelFilterSelect = null;
    this.packageLabelApplyFiltersButton = null;

    this.packageSourceHarvestNameFilterInput = null;
    this.packageSourceHarvestNameApplyFiltersButton = null;

    this.packageSourcePackageLabelFilterInput = null;
    this.packageSourcePackageLabelApplyFiltersButton = null;

    this.packageItemNameFilterInput = null;
    this.packageItemNameApplyFiltersButton = null;

    this.packageItemStrainNameFilterInput = null;
    this.packageItemStrainNameApplyFiltersButton = null;

    this.packageItemProductCategoryNameFilterInput = null;
    this.packageItemProductCategoryNameApplyFiltersButton = null;

    this.packageLocationNameFilterInput = null;
    this.packageLocationNameApplyFiltersButton = null;

    // Transfer
    this.transferClearFiltersButton = null;

    this.transferManifestNumberFilterInput = null;
    this.transferManifestNumberFilterSelect = null;
    this.transferManifestNumberApplyFiltersButton = null;

    // Tag
    this.tagClearFiltersButton = null;

    this.tagNumberFilterInput = null;
    this.tagNumberFilterSelect = null;
    this.tagNumberApplyFiltersButton = null;
  }

  // This should be done exactly once per pageload, once the element is found
  private async setPagination() {
    if (!this.visiblePaginationSizeSelector) {
      // Dropdown value cannot be found
      return;
    }

    if (!!this.paginationOptions.length) {
      // Pagination has already been set
      return;
    }

    let expectedPagination: number | null = null;

    if (store.state.settings) {
      if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        expectedPagination = store.state.settings.packageDefaultPageSize;
      } else if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        expectedPagination = store.state.settings.transferDefaultPageSize;
      } else if (window.location.pathname.match(SALES_TAB_REGEX)) {
        expectedPagination = store.state.settings.salesDefaultPageSize;
      } else if (window.location.pathname.match(TAG_TAB_REGEX)) {
        expectedPagination = store.state.settings.tagDefaultPageSize;
      } else if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
        expectedPagination = store.state.settings.plantDefaultPageSize;
      }
    }

    if (!expectedPagination) {
      return;
    }

    // textContent includes hidden text, innerText ignores hidden text
    // @ts-ignore
    const currentPagination = parseInt(this.visiblePaginationSizeSelector.textContent, 10);

    const animationContainer = this.getVisibleAnimationContainer("500");

    if (animationContainer) {
      this.paginationOptions = animationContainer.querySelectorAll("ul.k-list li");
    }

    if (expectedPagination !== currentPagination) {
      this.suppressAnimationContainer();
      // The options are not rendered until a click occurrs
      this.visiblePaginationSizeSelector.click();

      for (let i = 0; i < this.paginationOptions.length; ++i) {
        const paginationOption = this.paginationOptions[i] as HTMLElement;

        // @ts-ignore
        const paginationValue = parseInt(paginationOption.textContent, 10);

        if (paginationValue === expectedPagination) {
          paginationOption.click();
          this.visiblePaginationSizeSelector.click();
          window.scrollTo(0, 0);
          break;
        }
      }

      return;
    }
  }

  private async clickLogoutDismiss() {
    if (
      this.extendButton &&
      this.sessionTimeoutAlert &&
      getComputedStyle(this.sessionTimeoutAlert).display !== "none"
    ) {
      this.extendButton.click();
      return;
    }
  }

  private controlSnowflakeAnimation(state: SnowflakeState) {
    if (this.snowflakeCanvas) {
      this.snowflakeCanvas.style.display = "block";
    }

    document.body.classList.remove(TTT_SNOWFLAKES);

    switch (state) {
      case SnowflakeState.ENABLED:
        break;
      case SnowflakeState.CSS:
        if (this.snowflakeCanvas) {
          this.snowflakeCanvas.style.display = "none";
        }
        document.body.classList.add(TTT_SNOWFLAKES);
        break;
      case SnowflakeState.DISABLED:
      default:
        if (this.snowflakeCanvas) {
          this.snowflakeCanvas.style.display = "none";
        }
        break;
    }
  }

  private controlDarkMode(state: DarkModeState) {
    document.body.classList.remove(TTT_DARK_MODE, TTT_LIGHT_MODE);

    switch (state) {
      case DarkModeState.ENABLED:
        document.body.classList.add(TTT_DARK_MODE);
        break;
      case DarkModeState.DISABLED:
      default:
        document.body.classList.add(TTT_LIGHT_MODE);
        break;
    }
  }

  private togglePageVisibilityClasses() {
    // if (store.state.settings?.hideQuickActionButtons) {
    //     document.body.classList.add('quick-action-hidden');
    // } else {
    //     document.body.classList.remove('quick-action-hidden');
    // }

    if (store.state.settings?.hidePackageSearch) {
      document.body.classList.add("package-search-hidden");
    } else {
      document.body.classList.remove("package-search-hidden");
    }

    if (store.state.settings?.hideTransferSearch) {
      document.body.classList.add("transfer-search-hidden");
    } else {
      document.body.classList.remove("transfer-search-hidden");
    }

    if (store.state.settings?.hideInlineTransferButtons) {
      document.body.classList.add("transfer-buttons-hidden");
    } else {
      document.body.classList.remove("transfer-buttons-hidden");
    }

    if (store.state.demoMode) {
      document.body.classList.add("demo-mode");
    } else {
      document.body.classList.remove("demo-mode");
    }
  }

  private controlLogoutBar(hide: boolean) {
    if (this.sessionTimeoutBar) {
      this.sessionTimeoutBar.style.display = hide ? "none" : "block";
    }
  }

  private async managePlantTabs() {
    const activeTab = this.activeTabOrNull(this.plantsTabs);

    if (activeTab) {
      // If we see the tab has changed, the current filters are
      // invalid and we need to reacquire the inputs
      if (!!this.selectedPlantTab && activeTab !== this.selectedPlantTab) {
        this.resetMetrcPlantFilters();
        // this.readPlantFilters();
        await this.clickSettleDelay();
        this.resetFilterElementReferences();
      }

      this.selectedPlantTab = activeTab;
      return;
    }

    let tabKey = hashObjectValueOrNull("tabKey");

    switch (tabKey) {
      case TabKey.PLANTS_PLANTBATCHES_ACTIVE:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.IMMATURE);
        return;
      case TabKey.PLANTS_PLANTBATCHES_INACTIVE:
        await this.clickTabStartingWith(
          this.plantsTabs,
          PlantsTabLabel.INACTIVE,
          PlantsTabLabel.IMMATURE
        );
        return;
      case TabKey.PlANTS_PLANTS_VEGETATIVE:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.VEGETATIVE);
        return;
      case TabKey.PlANTS_PLANTS_FLOWERING:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.FLOWERING);
        return;
      case TabKey.PlANTS_PLANTS_ONHOLD:
        await this.clickTabStartingWith(
          this.plantsTabs,
          PlantsTabLabel.ON_HOLD,
          PlantsTabLabel.FLOWERING
        );
        return;
      case TabKey.PlANTS_PLANTS_INACTIVE:
        await this.clickTabStartingWith(
          this.plantsTabs,
          PlantsTabLabel.INACTIVE,
          PlantsTabLabel.FLOWERING
        );
        return;
      case TabKey.PlANTS_PLANTS_ADDITIVE:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.ADDITIVE);
        return;
      case TabKey.PlANTS_PLANTS_WASTE:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.WASTE);
        return;
      case TabKey.PlANTS_HARVESTED_ACTIVE:
        await this.clickTabStartingWith(this.plantsTabs, PlantsTabLabel.HARVESTED);
        return;
      case TabKey.PlANTS_HARVESTED_ONHOLD:
        await this.clickTabStartingWith(
          this.plantsTabs,
          PlantsTabLabel.ON_HOLD,
          PlantsTabLabel.HARVESTED
        );
        return;
      case TabKey.PlANTS_HARVESTED_INACTIVE:
        await this.clickTabStartingWith(
          this.plantsTabs,
          PlantsTabLabel.INACTIVE,
          PlantsTabLabel.HARVESTED
        );
        return;
    }

    if (store.state.settings?.autoOpenFloweringPlants) {
      await this.clickTabStartingWith(this.plantsTabs, store.state.settings?.autoOpenPlantsTab);
    }
  }

  private async managePackageTabs() {
    const activeTab = this.activeTabOrNull(this.packageTabs);

    if (activeTab) {
      // If we see the tab has changed, the current filters are
      // invalid and we need to reacquire the inputs
      if (!!this.selectedPackageTab && activeTab !== this.selectedPackageTab) {
        this.resetMetrcPackageFilters();
        // this.readPackageFilters();
        await this.clickSettleDelay();
        this.resetFilterElementReferences();
      }

      this.selectedPackageTab = activeTab;
      return;
    }

    let tabKey = hashObjectValueOrNull("tabKey");

    switch (tabKey) {
      case TabKey.PACKAGES_ACTIVE:
        await this.clickTabStartingWith(this.packageTabs, PackageTabLabel.ACTIVE);
        return;
      case TabKey.PACKAGES_ONHOLD:
        await this.clickTabStartingWith(this.packageTabs, PackageTabLabel.ON_HOLD);
        return;
      case TabKey.PACKAGES_INACTIVE:
        await this.clickTabStartingWith(this.packageTabs, PackageTabLabel.INACTIVE);
        return;
      case TabKey.PACKAGES_INTRANSIT:
        await this.clickTabStartingWith(this.packageTabs, PackageTabLabel.IN_TRANSIT);
        return;
    }

    if (store.state.settings?.autoOpenActivePackages) {
      await this.clickTabStartingWith(this.packageTabs, store.state.settings?.autoOpenPackageTab);
    }
  }

  private async manageTransfersTabs() {
    const activeTab = this.activeTabOrNull(this.transferTabs);

    if (activeTab) {
      // If we see the tab has changed, the current filters are
      // invalid and we need to reacquire the inputs
      if (!!this.selectedTransferTab && activeTab !== this.selectedTransferTab) {
        this.resetMetrcTransferFilters();
        this.readTransferFilters();
        await this.clickSettleDelay();
        this.resetFilterElementReferences();
      }

      this.selectedTransferTab = activeTab;
      return;
    }

    let tabKey = hashObjectValueOrNull("tabKey");

    switch (tabKey) {
      case TabKey.TRANSFERS_INCOMING:
        await this.clickTabStartingWith(this.transferTabs, TransfersTabLabel.INCOMING);
        return;
      case TabKey.TRANSFERS_OUTGOING:
        await this.clickTabStartingWith(this.transferTabs, TransfersTabLabel.OUTGOING);
        return;
      case TabKey.TRANSFERS_REJECTED:
        await this.clickTabStartingWith(this.transferTabs, TransfersTabLabel.REJECTED);
        return;
    }

    if (store.state.settings?.autoOpenIncomingTransfers) {
      await this.clickTabStartingWith(
        this.transferTabs,
        store.state.settings?.autoOpenTransfersTab
      );
    }
  }

  private async manageSalesTabs() {
    if (this.activeTabOrNull(this.salesTabs)) {
      return;
    }

    if (store.state.settings?.autoOpenActiveSales) {
      await this.clickTabStartingWith(this.salesTabs, store.state.settings?.autoOpenSalesTab);
    }
  }

  private async manageTagsTabs() {
    const activeTab = this.activeTabOrNull(this.tagTabs);

    if (activeTab) {
      // If we see the tab has changed, the current filters are
      // invalid and we need to reacquire the inputs
      if (!!this.selectedTagTab && activeTab !== this.selectedTagTab) {
        this.resetMetrcTagFilters();
        this.readTagFilters();
        await this.clickSettleDelay();
        this.resetFilterElementReferences();
      }

      this.selectedTagTab = activeTab;
      return;
    }

    let tabKey = hashObjectValueOrNull("tabKey");

    switch (tabKey) {
      case TabKey.TAGS_AVAILABLE:
        await this.clickTabStartingWith(this.tagTabs, TagsTabLabel.AVAILABLE);
        return;
      case TabKey.TAGS_USED:
        await this.clickTabStartingWith(this.tagTabs, TagsTabLabel.USED);
        return;
      case TabKey.TAGS_VOIDED:
        await this.clickTabStartingWith(this.tagTabs, TagsTabLabel.VOIDED);
        return;
    }

    if (store.state.settings?.autoOpenAvailableTags) {
      await this.clickTabStartingWith(this.tagTabs, store.state.settings?.autoOpenTagsTab);
    }
  }

  setExpandedClass() {
    if (store.state.expanded) {
      document.body.classList.add("ttt-expanded");
    } else {
      document.body.classList.remove("ttt-expanded");
    }
  }

  clickRefreshLinks() {
    // This method must be an async failsafe method
    timer(0).subscribe(() => {
      this.suppressAnimationContainer();

      try {
        const refreshButtons = document.querySelectorAll(".k-pager-refresh");

        for (let i = 0; i < refreshButtons.length; ++i) {
          // @ts-ignore
          // scrollSafeClick(refreshButtons[i]);
          refreshButtons[i].click();
        }
      } catch (e) {}
    });
  }

  updatePromoModal() {
    if (document.querySelector("#spinnerBackground")) {
      modalManager.dispatchModalEvent(ModalType.PROMO, ModalAction.OPEN, {});
    } else {
      modalManager.dispatchModalEvent(ModalType.PROMO, ModalAction.CLOSE, {});
    }
  }

  // Moved to facilityManager
  // getActiveFacilityName(): string {
  //     // @ts-ignore
  //     return document.querySelector('.facilities-dropdown [data-toggle]')?.innerText.trim();
  // }

  // Moved to facilityManager
  // getFacilities(): IPageMetrcFacilityData[] {
  //     const facilityLinks = document.querySelectorAll('.facilities-dropdown ul.dropdown-menu li > a');

  //     const pairs: IPageMetrcFacilityData[] = [];

  //     for (let i = 0; i < facilityLinks.length; ++i) {
  //         const facilityLink = facilityLinks[i];

  //         pairs.push({
  //             link: facilityLink.getAttribute('href') as string,
  //             // @ts-ignore
  //             name: `${facilityLink.querySelector('strong').innerText.trim()} | ${facilityLink.querySelector('small').innerText.trim()}`
  //         })
  //     }

  //     return pairs;
  // }

  // openQuickTransfer() {
  //     this.handleQuickTransferClick();
  // }

  // private async handleQuickTransferClick() {
  //     analyticsManager.track(MessageType.CLICKED_QUICK_TRANSFER);

  //     const metrc = await scriptContextManager.metrc();

  //     if (!metrc) {
  //         return;
  //     }

  //     var $outgoingGrid = metrc.$('#outgoing-grid'),

  //         openManifests = (ids: any) => {
  //             for (let i = 0, icnt = ids.length; i < icnt; i++) {
  //                 // use a timeout to not overload the browser with too many windows/tabs
  //                 setTimeout(((id) => {
  //                     return () => {
  //                         window.open('/reports/transfers/manifest?id=' + id, '_blank');
  //                     };
  //                 })(ids[i]), i * 500);
  //             }
  //         };

  //     metrc.kendo.localModalForm(
  //         'New Licensed Transfer', // title
  //         await primaryDataLoader.transferModalHtml(),
  //         { // form query
  //             isModal: true,
  //             adding: true
  //         },
  //         null, // form element selector
  //         '/api/transfers/create', // submit URL
  //         $outgoingGrid, // $grid
  //         (response: any) => { // success event
  //             metrc.notificationAlert('Licensed Transfers', 'Registered # ' + response.Ids.join(', ') + '\n\n(click to view manifest)', {
  //                 onclick: (e: any) => {
  //                     e.preventDefault();
  //                     openManifests(response.Ids);
  //                 }
  //             });
  //         });
  // }

  // private async handleQuickPackageClick() {
  //     analyticsManager.track(MessageType.CLICKED_QUICK_PACKAGE);

  //     const metrc = await scriptContextManager.metrc();

  //     if (!metrc) {
  //         return;
  //     }

  //     let $activeGrid = metrc.$('#active-grid'),
  //         $inactiveGrid = metrc.$('#inactive-grid'),
  //         $inTransitGrid = metrc.$('#intransit-grid');

  //     // @ts-ignore
  //     // let selectedIds = $activeGrid.metrcGridIds('Id');
  //     // console.log(selectedIds);

  //     metrc.kendo.localModalForm(
  //         'New Packages', // title
  //         await primaryDataLoader.packageModalHtml(),
  //         { // form query
  //             isModal: true,
  //             // ids: selectedIds
  //         },
  //         null, // form element selector
  //         '/api/packages/create', // submit URL
  //         $activeGrid); // $grid
  // }

  // private async handleQuickTransferTemplateClick() {
  //     analyticsManager.track(MessageType.CLICKED_QUICK_TRANSFER_TEMPLATE);

  //     const metrc = await scriptContextManager.metrc();

  //     if (!metrc) {
  //         return;
  //     }

  //     let $templatesGrid = metrc.$('#templates-grid');

  //     metrc.kendo.localModalForm(
  //         'New Licensed Transfer Template', // title
  //         await primaryDataLoader.transferTemplateModalHtml(),
  //         { // form query
  //             isModal: true,
  //             adding: true
  //         },
  //         null, // form element selector
  //         '/api/transfers/create/template', // submit URL
  //         $templatesGrid, // $grid
  //         function (response: any) { // success event
  //             metrc.notificationAlert('Licensed Transfers Templates', 'Registered # ' + response.Ids.join(', '));
  //         });
  // }
}

export let pageManager = new PageManager();
