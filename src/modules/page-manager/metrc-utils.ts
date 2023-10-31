import { ModalAction, ModalType, TTT_SNOWFLAKES } from "@/consts";
import { SnowflakeState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { timer } from "rxjs";
import { modalManager } from "../modal-manager.module";
import {
  PACKAGE_TAB_REGEX,
  PLANTS_TAB_REGEX,
  SALES_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_TAB_REGEX,
} from "./consts";
import { pageManager } from "./page-manager.module";

export function getVisibleAnimationContainerImpl(expectedText: string) {
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

export function suppressAnimationContainerImpl() {
  pageManager.suppressAnimationContainerTimeout &&
    clearTimeout(pageManager.suppressAnimationContainerTimeout);
  pageManager.suppressAnimationContainerTimeout = null;

  document.body.classList.add("suppress-animation-container");

  pageManager.suppressAnimationContainerTimeout = setTimeout(
    () => document.body.classList.remove("suppress-animation-container"),
    1000
  );
}

export async function interceptViewManifestButtonImpl() {
  if (!store.state.settings?.enableManifestDocumentViewer) {
    return;
  }

  if (pageManager.replacementManifestButton && pageManager.viewManifestButton) {
    return;
  }

  // This will work on the main transfer page
  pageManager.viewManifestButton = document.querySelector("#viewmanifest-btn");

  // This is the fallback, used in transfer hub
  if (!pageManager.viewManifestButton) {
    const btns = document.querySelectorAll("button.btn.shadow");
    for (let i = 0; i < btns.length; ++i) {
      const btn = btns[i] as HTMLButtonElement;

      if (btn.innerText.includes("View Manifest")) {
        // @ts-ignore
        pageManager.viewManifestButton = btns[i];
        break;
      }
    }
  }

  if (!pageManager.viewManifestButton) {
    // Couldn't find the button, no point in intercepting
    return;
  }

  // @ts-ignore
  pageManager.viewManifestButton.style.display = "none";

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
        // fall back to the original button
        pageManager.viewManifestButton?.dispatchEvent(new Event("click"));
        return;
      }

      // @ts-ignore
      const manifestNumber = parseInt(targetCell.innerText.trim(), 10);

      if (!selectedRow || !manifestNumber) {
        // fall back to the original button
        console.error("manifestNumber fallback");
        pageManager.viewManifestButton?.dispatchEvent(new Event("click"));
        return;
      }

      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${manifestNumber}`;

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: [manifestUrl],
      });
    } catch (e) {
      // Last-ditch fallback
      console.error("last ditch fallback", e);
      pageManager.viewManifestButton?.dispatchEvent(new Event("click"));
    }
  });

  pageManager.viewManifestButton.parentElement?.appendChild(button);

  if (button.parentElement) {
    pageManager.replacementManifestButton = button;
  }
}

// This should be done exactly once per pageload, once the element is found
export async function setPaginationImpl() {
  if (!pageManager.visiblePaginationSizeSelector) {
    // Dropdown value cannot be found
    return;
  }

  if (pageManager.paginationOptions.length) {
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
  const currentPagination = parseInt(pageManager.visiblePaginationSizeSelector.textContent, 10);

  const animationContainer = pageManager.getVisibleAnimationContainer("500");

  if (animationContainer) {
    pageManager.paginationOptions = animationContainer.querySelectorAll("ul.k-list li");
  }

  if (expectedPagination !== currentPagination) {
    pageManager.suppressAnimationContainer();
    // The options are not rendered until a click occurrs
    pageManager.visiblePaginationSizeSelector.click();

    for (let i = 0; i < pageManager.paginationOptions.length; ++i) {
      const paginationOption = pageManager.paginationOptions[i] as HTMLElement;

      // @ts-ignore
      const paginationValue = parseInt(paginationOption.textContent, 10);

      if (paginationValue === expectedPagination) {
        paginationOption.click();
        pageManager.visiblePaginationSizeSelector.click();
        window.scrollTo(0, 0);
        break;
      }
    }
  }
}

export async function clickLogoutDismissImpl() {
  if (
    pageManager.extendButton &&
    pageManager.sessionTimeoutAlert &&
    getComputedStyle(pageManager.sessionTimeoutAlert).display !== "none"
  ) {
    pageManager.extendButton.click();
  }
}

export function controlSnowflakeAnimationImpl(state: SnowflakeState) {
  if (pageManager.snowflakeCanvas) {
    pageManager.snowflakeCanvas.style.display = "block";
  }

  document.body.classList.remove(TTT_SNOWFLAKES);

  switch (state) {
    case SnowflakeState.ENABLED:
      break;
    case SnowflakeState.CSS:
      if (pageManager.snowflakeCanvas) {
        pageManager.snowflakeCanvas.style.display = "none";
      }
      document.body.classList.add(TTT_SNOWFLAKES);
      break;
    case SnowflakeState.DISABLED:
    default:
      if (pageManager.snowflakeCanvas) {
        pageManager.snowflakeCanvas.style.display = "none";
      }
      break;
  }
}

export function clickRefreshLinksImpl() {
  // This method must be an async failsafe method
  timer(0).subscribe(() => {
    pageManager.suppressAnimationContainer();

    try {
      const refreshButtons = document.querySelectorAll(".k-pager-refresh");

      for (let i = 0; i < refreshButtons.length; ++i) {
        // @ts-ignore
        refreshButtons[i].click();
      }
    } catch (e) {}
  });
}
