import {
  PackageTabLabel, PlantsTabLabel, TabKey, TagsTabLabel, TransfersTabLabel
} from "@/consts";
import store from "@/store/page-overlay/index";
import { hashObjectValueOrNull } from "@/utils/url";
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

export async function managePlantTabsImpl() {
  const activeTab = pageManager.activeTabOrNull(pageManager.plantsTabs);

  if (activeTab) {
    // If we see the tab has changed, the current filters are
    // invalid and we need to reacquire the inputs
    if (!!pageManager.selectedPlantTab && activeTab !== pageManager.selectedPlantTab) {
      pageManager.resetMetrcPlantFilters();
      await pageManager.clickSettleDelay();
      pageManager.resetFilterElementReferences();
    }

    pageManager.selectedPlantTab = activeTab;
    return;
  }

  const tabKey = hashObjectValueOrNull("tabKey");

  switch (tabKey) {
    case TabKey.PLANTS_PLANTBATCHES_ACTIVE:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.IMMATURE);
      return;
    case TabKey.PLANTS_PLANTBATCHES_INACTIVE:
      await pageManager.clickTabStartingWith(
        pageManager.plantsTabs,
        PlantsTabLabel.INACTIVE,
        PlantsTabLabel.IMMATURE
      );
      return;
    case TabKey.PlANTS_PLANTS_VEGETATIVE:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.VEGETATIVE);
      return;
    case TabKey.PlANTS_PLANTS_FLOWERING:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.FLOWERING);
      return;
    case TabKey.PlANTS_PLANTS_ONHOLD:
      await pageManager.clickTabStartingWith(
        pageManager.plantsTabs,
        PlantsTabLabel.ON_HOLD,
        PlantsTabLabel.FLOWERING
      );
      return;
    case TabKey.PlANTS_PLANTS_INACTIVE:
      await pageManager.clickTabStartingWith(
        pageManager.plantsTabs,
        PlantsTabLabel.INACTIVE,
        PlantsTabLabel.FLOWERING
      );
      return;
    case TabKey.PlANTS_PLANTS_ADDITIVE:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.ADDITIVE);
      return;
    case TabKey.PlANTS_PLANTS_WASTE:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.WASTE);
      return;
    case TabKey.PlANTS_HARVESTED_ACTIVE:
      await pageManager.clickTabStartingWith(pageManager.plantsTabs, PlantsTabLabel.HARVESTED);
      return;
    case TabKey.PlANTS_HARVESTED_ONHOLD:
      await pageManager.clickTabStartingWith(
        pageManager.plantsTabs,
        PlantsTabLabel.ON_HOLD,
        PlantsTabLabel.HARVESTED
      );
      return;
    case TabKey.PlANTS_HARVESTED_INACTIVE:
      await pageManager.clickTabStartingWith(
        pageManager.plantsTabs,
        PlantsTabLabel.INACTIVE,
        PlantsTabLabel.HARVESTED
      );
      return;
  }

  if (store.state.settings?.autoOpenFloweringPlants) {
    await pageManager.clickTabStartingWith(
      pageManager.plantsTabs,
      store.state.settings?.autoOpenPlantsTab
    );
  }
}

export async function managePackageTabsImpl() {
  const activeTab = pageManager.activeTabOrNull(pageManager.packageTabs);

  if (activeTab) {
    // If we see the tab has changed, the current filters are
    // invalid and we need to reacquire the inputs
    if (!!pageManager.selectedPackageTab && activeTab !== pageManager.selectedPackageTab) {
      pageManager.resetMetrcPackageFilters();
      await pageManager.clickSettleDelay();
      pageManager.resetFilterElementReferences();
    }

    pageManager.selectedPackageTab = activeTab;
    return;
  }

  const tabKey = hashObjectValueOrNull("tabKey");

  switch (tabKey) {
    case TabKey.PACKAGES_ACTIVE:
      await pageManager.clickTabStartingWith(pageManager.packageTabs, PackageTabLabel.ACTIVE);
      return;
    case TabKey.PACKAGES_ONHOLD:
      await pageManager.clickTabStartingWith(pageManager.packageTabs, PackageTabLabel.ON_HOLD);
      return;
    case TabKey.PACKAGES_INACTIVE:
      await pageManager.clickTabStartingWith(pageManager.packageTabs, PackageTabLabel.INACTIVE);
      return;
    case TabKey.PACKAGES_INTRANSIT:
      await pageManager.clickTabStartingWith(pageManager.packageTabs, PackageTabLabel.IN_TRANSIT);
      return;
  }

  if (store.state.settings?.autoOpenActivePackages) {
    await pageManager.clickTabStartingWith(
      pageManager.packageTabs,
      store.state.settings?.autoOpenPackageTab
    );
  }
}

export async function manageTransfersTabsImpl() {
  const activeTab = pageManager.activeTabOrNull(pageManager.transferTabs);

  if (activeTab) {
    // If we see the tab has changed, the current filters are
    // invalid and we need to reacquire the inputs
    if (!!pageManager.selectedTransferTab && activeTab !== pageManager.selectedTransferTab) {
      pageManager.resetMetrcTransferFilters();
      await pageManager.clickSettleDelay();
      pageManager.resetFilterElementReferences();
    }

    pageManager.selectedTransferTab = activeTab;
    return;
  }

  const tabKey = hashObjectValueOrNull("tabKey");

  switch (tabKey) {
    case TabKey.TRANSFERS_INCOMING:
      await pageManager.clickTabStartingWith(pageManager.transferTabs, TransfersTabLabel.INCOMING);
      return;
    case TabKey.TRANSFERS_OUTGOING:
      await pageManager.clickTabStartingWith(pageManager.transferTabs, TransfersTabLabel.OUTGOING);
      return;
    case TabKey.TRANSFERS_REJECTED:
      await pageManager.clickTabStartingWith(pageManager.transferTabs, TransfersTabLabel.REJECTED);
      return;
  }

  if (store.state.settings?.autoOpenIncomingTransfers) {
    await pageManager.clickTabStartingWith(
      pageManager.transferTabs,
      store.state.settings?.autoOpenTransfersTab
    );
  }
}

export async function manageSalesTabsImpl() {
  if (pageManager.activeTabOrNull(pageManager.salesTabs)) {
    return;
  }

  if (store.state.settings?.autoOpenActiveSales) {
    await pageManager.clickTabStartingWith(
      pageManager.salesTabs,
      store.state.settings?.autoOpenSalesTab
    );
  }
}

export async function manageTagsTabsImpl() {
  const activeTab = pageManager.activeTabOrNull(pageManager.tagTabs);

  if (activeTab) {
    // If we see the tab has changed, the current filters are
    // invalid and we need to reacquire the inputs
    if (!!pageManager.selectedTagTab && activeTab !== pageManager.selectedTagTab) {
      pageManager.resetMetrcTagFilters();
      await pageManager.clickSettleDelay();
      pageManager.resetFilterElementReferences();
    }

    pageManager.selectedTagTab = activeTab;
    return;
  }

  const tabKey = hashObjectValueOrNull("tabKey");

  switch (tabKey) {
    case TabKey.TAGS_AVAILABLE:
      await pageManager.clickTabStartingWith(pageManager.tagTabs, TagsTabLabel.AVAILABLE);
      return;
    case TabKey.TAGS_USED:
      await pageManager.clickTabStartingWith(pageManager.tagTabs, TagsTabLabel.USED);
      return;
    case TabKey.TAGS_VOIDED:
      await pageManager.clickTabStartingWith(pageManager.tagTabs, TagsTabLabel.VOIDED);
      return;
  }

  if (store.state.settings?.autoOpenAvailableTags) {
    await pageManager.clickTabStartingWith(
      pageManager.tagTabs,
      store.state.settings?.autoOpenTagsTab
    );
  }
}
