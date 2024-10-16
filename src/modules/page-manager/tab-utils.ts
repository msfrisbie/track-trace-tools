import { MetrcGridId } from "@/consts";
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

export async function manageTabs() {
  if (await applyUrlGridState()) {
    return;
  }

  if (window.location.pathname.match(PLANTS_TAB_REGEX)) {
    if (store.state.settings?.autoOpenFloweringPlants) {
      await pageManager.clickTabWithGridId(MetrcGridId.PLANTS_FLOWERING);
    }
  }

  if (window.location.pathname.match(PACKAGE_TAB_REGEX)) {
    if (store.state.settings?.autoOpenActivePackages) {
      await pageManager.clickTabWithGridId(MetrcGridId.PACKAGES_ACTIVE);
    }
  }

  if (window.location.pathname.match(TRANSFER_TAB_REGEX)) {
    if (store.state.settings?.autoOpenIncomingTransfers) {
      await pageManager.clickTabWithGridId(MetrcGridId.TRANSFERS_INCOMING);
    }
  }

  if (window.location.pathname.match(SALES_TAB_REGEX)) {
    if (store.state.settings?.autoOpenActiveSales) {
      await pageManager.clickTabWithGridId(MetrcGridId.SALES_ACTIVE);
    }
  }

  if (window.location.pathname.match(TAG_TAB_REGEX)) {
    if (store.state.settings?.autoOpenAvailableTags) {
      await pageManager.clickTabWithGridId(MetrcGridId.TAGS_AVAILABLE);
    }
  }
}

// export async function managePlantTabs() {
//   const activeTab = pageManager.activeTabOrNull(pageManager.plantsTabs);

//   if (activeTab) {
//     // If we see the tab has changed, the current filters are
//     // invalid and we need to reacquire the inputs
//     if (!!pageManager.selectedPlantTab && activeTab !== pageManager.selectedPlantTab) {
//       // pageManager.resetMetrcPlantFilters();
//       // await pageManager.clickSettleDelay();
//       // pageManager.resetFilterElementReferences();
//     }

//     pageManager.selectedPlantTab = activeTab;
//     return;
//   }

//   applyUrlGridState();

//   if (store.state.settings?.autoOpenFloweringPlants) {
//     await pageManager.clickTabWithGridId(MetrcGridId.PLANTS_FLOWERING);
//   }
// }

// export async function managePackageTabs() {
//   const activeTab = pageManager.activeTabOrNull(pageManager.packageTabs);

//   if (activeTab) {
//     // If we see the tab has changed, the current filters are
//     // invalid and we need to reacquire the inputs
//     if (!!pageManager.selectedPackageTab && activeTab !== pageManager.selectedPackageTab) {
//       // pageManager.resetMetrcPackageFilters();
//       // await pageManager.clickSettleDelay();
//       // pageManager.resetFilterElementReferences();
//     }

//     pageManager.selectedPackageTab = activeTab;
//     return;
//   }

//   applyUrlGridState();

//   if (store.state.settings?.autoOpenActivePackages) {
//     await pageManager.clickTabWithGridId(MetrcGridId.PACKAGES_ACTIVE);
//   }
// }

// export async function manageTransfersTabs() {
//   const activeTab = pageManager.activeTabOrNull(pageManager.transferTabs);

//   if (activeTab) {
//     // If we see the tab has changed, the current filters are
//     // invalid and we need to reacquire the inputs
//     if (!!pageManager.selectedTransferTab && activeTab !== pageManager.selectedTransferTab) {
//       // pageManager.resetMetrcTransferFilters();
//       // await pageManager.clickSettleDelay();
//       // pageManager.resetFilterElementReferences();
//     }

//     pageManager.selectedTransferTab = activeTab;
//     return;
//   }

//   applyUrlGridState();

//   if (store.state.settings?.autoOpenIncomingTransfers) {
//     await pageManager.clickTabWithGridId(MetrcGridId.TRANSFERS_INCOMING);
//   }
// }

// export async function manageSalesTabs() {
//   if (pageManager.activeTabOrNull(pageManager.salesTabs)) {
//     return;
//   }

//   if (store.state.settings?.autoOpenActiveSales) {
//     await pageManager.clickTabWithGridId(MetrcGridId.SALES_ACTIVE);
//   }
// }

// export async function manageTagsTabs() {

//   if (await applyUrlGridState()) {
//     return;
//   }

//   // const activeTab = pageManager.activeTabOrNull(pageManager.tagTabs);

//   // if (activeTab) {
//   //   // If we see the tab has changed, the current filters are
//   //   // invalid and we need to reacquire the inputs
//   //   if (!!pageManager.selectedTagTab && activeTab !== pageManager.selectedTagTab) {
//   //     // pageManager.resetMetrcTagFilters();
//   //     // await pageManager.clickSettleDelay();
//   //     // pageManager.resetFilterElementReferences();
//   //   }

//   //   pageManager.selectedTagTab = activeTab;
//   //   return;
//   // }

//   // if (await applyUrlGridState()) {
//   //   return;
//   // }

//   if (store.state.settings?.autoOpenAvailableTags) {
//     await pageManager.clickTabWithGridId(MetrcGridId.TAGS_AVAILABLE);
//   }
// }

async function applyUrlGridState(): Promise<boolean> {
  const hashData: URLHashData = getHashData();

  if (!hashData.metrcGridId) {
    return false;
  }

  if (!(await pageManager.clickTabWithGridId(hashData.metrcGridId))) {
    return false;
  }

  return true;
}
