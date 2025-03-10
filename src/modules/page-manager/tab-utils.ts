import store from "@/store/page-overlay/index";
// import { readHashValueOrNull } from "@/utils/url";
import { URLHashData } from "@/interfaces";
import { getHashData } from "@/utils/url";
import {
  PACKAGE_TAB_REGEX,
  PLANTS_TAB_REGEX,
  SALES_TAB_REGEX,
  TAG_TAB_REGEX,
  TRANSFER_TAB_REGEX,
} from "./consts";
import { pageManager } from "./page-manager.module";
import { applyGridState, getActiveUniqueMetrcGridIdOrNull } from "./search-utils";

export function isTabActiveImpl(tab: any) {
  return tab.getAttribute("aria-selected") === "true";
}

export function activeTabOrNullImpl(tabList: NodeList) {
  for (let i = 0; i < tabList.length; ++i) {
    const tab = tabList[i] as HTMLElement;

    if (pageManager.isTabActive(tab)) {
      return tab;
    }
  }

  return null;
}

export async function clickTabStartingWithImpl(
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

  const seenTabs: string[] = [];
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
      await pageManager.clickSettleDelay();
      return;
    }

    seenTabs.push(tab.innerText);
  }

  await pageManager.refresh;
}

export async function applyDefaultTabs() {
  // If the grid state sets an active tab, don't use the defaults
  if (await getActiveUniqueMetrcGridIdOrNull()) {
    return;
  }

  if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
    if (store.state.settings?.autoOpenPlantsGrid) {
      await pageManager.clickTabWithGridIdIfExists(store.state.settings?.autoOpenPlantsGrid);
    }
  }

  if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
    if (store.state.settings?.autoOpenPackagesGrid) {
      await pageManager.clickTabWithGridIdIfExists(store.state.settings?.autoOpenPackagesGrid);
    }
  }

  if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
    if (store.state.settings?.autoOpenTransfersGrid) {
      await pageManager.clickTabWithGridIdIfExists(store.state.settings?.autoOpenTransfersGrid);
    }
  }

  if (window.location.pathname.match(SALES_TAB_REGEX)) {
    if (store.state.settings?.autoOpenSalesGrid) {
      await pageManager.clickTabWithGridIdIfExists(store.state.settings?.autoOpenSalesGrid);
    }
  }

  if (window.location.pathname.match(TAG_TAB_REGEX)) {
    if (store.state.settings?.autoOpenTagsGrid) {
      await pageManager.clickTabWithGridIdIfExists(store.state.settings?.autoOpenTagsGrid);
    }
  }
}

export async function applyUrlGridState() {
  const hashData: URLHashData = getHashData();

  if (!hashData) {
    return;
  }

  await applyGridState(hashData.activeUniqueMetrcGridId ?? null, hashData.metrcGridFilters ?? {});
}
