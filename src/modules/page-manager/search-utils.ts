import {
  MessageType,
  PackageFilterIdentifiers,
  PlantFilterIdentifiers,
  TagFilterIdentifiers,
  TransferFilterIdentifiers,
} from "@/consts";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { analyticsManager } from "../analytics-manager.module";
import { pageManager } from "./page-manager.module";
import { atLeastOneIsTruthy } from "./utils";

export async function acquirePlantFilterElementsImpl() {
  if (!pageManager.plantClearFiltersButton) {
    const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

    if (btn) {
      btn.click();
      // @ts-ignore
      pageManager.plantClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
      btn.click();
    }
  }

  // This is important, as otherwise click() calls will kill page usability
  if (
    atLeastOneIsTruthy(
      pageManager.plantLabelFilterInput,
      pageManager.plantLabelFilterSelect,
      pageManager.plantLabelApplyFiltersButton,
      pageManager.plantStrainNameFilterInput,
      pageManager.plantStrainNameApplyFiltersButton,
      pageManager.plantLocationNameFilterInput,
      pageManager.plantLocationNameApplyFiltersButton
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

  for (const plantFilterIdentifier of plantFilterIdentifiers) {
    menuButton = document.querySelector(
      `.k-state-active th[data-field="${plantFilterIdentifier}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

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
              pageManager.plantLabelFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                  { plantSearchFilters: { label: e.target.value }, propagate: false }
                ));
              pageManager.plantLabelFilterSelect = select;
              pageManager.plantLabelApplyFiltersButton = button;
              break;
            case PlantFilterIdentifiers.StrainName:
              pageManager.plantStrainNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                  { plantSearchFilters: { strainName: e.target.value }, propagate: false }
                ));
              pageManager.plantStrainNameApplyFiltersButton = button;
              break;
            case PlantFilterIdentifiers.LocationName:
              pageManager.plantLocationNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
                  { plantSearchFilters: { locationName: e.target.value }, propagate: false }
                ));
              pageManager.plantLocationNameApplyFiltersButton = button;
              break;
            default:
              break;
          }
        }
      }

      // Close the menu
      menuButton.click();
    } else {
      console.error("Menu button not found", plantFilterIdentifier);
    }
  }
}

export async function acquirePackageFilterElementsImpl() {
  if (!pageManager.packageClearFiltersButton) {
    const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

    if (btn) {
      btn.click();
      // @ts-ignore
      pageManager.packageClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
      btn.click();
    }
  }

  // This is important, as otherwise click() calls will kill page usability
  if (
    atLeastOneIsTruthy(
      pageManager.packageLabelFilterInput,
      pageManager.packageLabelFilterSelect,
      pageManager.packageLabelApplyFiltersButton,
      pageManager.packageSourceHarvestNameFilterInput,
      pageManager.packageSourceHarvestNameApplyFiltersButton,
      pageManager.packageSourcePackageLabelFilterInput,
      pageManager.packageSourcePackageLabelApplyFiltersButton,
      pageManager.packageItemNameFilterInput,
      pageManager.packageItemNameApplyFiltersButton,
      pageManager.packageItemStrainNameFilterInput,
      pageManager.packageItemStrainNameApplyFiltersButton,
      pageManager.packageItemProductCategoryNameFilterInput,
      pageManager.packageItemProductCategoryNameApplyFiltersButton,
      pageManager.packageLocationNameFilterInput,
      pageManager.packageLocationNameApplyFiltersButton
    )
  ) {
    return;
  }

  const packageFilterIdentifiers: PackageFilterIdentifiers[] = [
    PackageFilterIdentifiers.Label,
    PackageFilterIdentifiers.SourceHarvestNames,
    PackageFilterIdentifiers.SourcePackageLabels,
    PackageFilterIdentifiers.ProductionBatchNumber,
    PackageFilterIdentifiers.SourceProductionBatchNumbers,
    PackageFilterIdentifiers.ItemName,
    PackageFilterIdentifiers.ItemStrainName,
    PackageFilterIdentifiers.ItemProductCategoryName,
    PackageFilterIdentifiers.LocationName,
  ];

  let menuButton;

  for (const packageFilterIdentifier of packageFilterIdentifiers) {
    menuButton = document.querySelector(
      `.k-state-active th[data-field="${packageFilterIdentifier}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

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
              pageManager.packageLabelFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  { packageSearchFilters: { label: e.target.value }, propagate: false }
                ));
              pageManager.packageLabelFilterSelect = select;
              pageManager.packageLabelApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.SourceHarvestNames:
              pageManager.packageSourceHarvestNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  {
                    packageSearchFilters: { sourceHarvestName: e.target.value },
                    propagate: false,
                  }
                ));
              pageManager.packageSourceHarvestNameApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.SourcePackageLabels:
              pageManager.packageSourcePackageLabelFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  {
                    packageSearchFilters: { sourcePackageLabel: e.target.value },
                    propagate: false,
                  }
                ));
              pageManager.packageSourcePackageLabelApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.ProductionBatchNumber:
              pageManager.packageProductionBatchNumberFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  {
                    packageSearchFilters: { productionBatchNumber: e.target.value },
                    propagate: false,
                  }
                ));
              pageManager.packageProductionBatchNumberApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.SourceProductionBatchNumbers:
              pageManager.packageSourceProductionBatchNumbersFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  {
                    packageSearchFilters: { sourceProductionBatchNumbers: e.target.value },
                    propagate: false,
                  }
                ));
              pageManager.packageSourceProductionBatchNumbersApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.ItemName:
              pageManager.packageItemNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  { packageSearchFilters: { itemName: e.target.value }, propagate: false }
                ));
              pageManager.packageItemNameApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.ItemStrainName:
              pageManager.packageItemStrainNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  { packageSearchFilters: { itemStrainName: e.target.value }, propagate: false }
                ));
              pageManager.packageItemStrainNameApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.ItemProductCategoryName:
              pageManager.packageItemProductCategoryNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  {
                    packageSearchFilters: { itemProductCategoryName: e.target.value },
                    propagate: false,
                  }
                ));
              pageManager.packageItemProductCategoryNameApplyFiltersButton = button;
              break;
            case PackageFilterIdentifiers.LocationName:
              pageManager.packageLocationNameFilterInput = input;
              input.addEventListener("input", (e: any) =>
                store.dispatch(
                  `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
                  { packageSearchFilters: { locationName: e.target.value }, propagate: false }
                ));
              pageManager.packageLocationNameApplyFiltersButton = button;
              break;
            default:
              break;
          }
        }
      }

      // Close the menu
      menuButton.click();
    } else {
      console.error("Menu button not found", packageFilterIdentifier);
    }
  }
}

export async function acquireTransferFilterElementsImpl() {
  if (!pageManager.transferClearFiltersButton) {
    const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

    if (btn) {
      btn.click();
      // @ts-ignore
      pageManager.transferClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
      btn.click();
    }
  }

  // This is important, as otherwise click() calls will kill page usability
  if (
    atLeastOneIsTruthy(
      pageManager.transferManifestNumberFilterInput,
      pageManager.transferManifestNumberFilterSelect,
      pageManager.transferManifestNumberApplyFiltersButton,
      pageManager.transferOutgoingDeliveryFacilitiesFilterInput,
      pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton,
      pageManager.transferIncomingShipperFacilityInfoFilterInput,
      pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton
    )
  ) {
    return;
  }

  const transferFilterIdentifiers: TransferFilterIdentifiers[] = [
    TransferFilterIdentifiers.ManifestNumber,
    TransferFilterIdentifiers.DeliveryFacilities,
    TransferFilterIdentifiers.ShipperFacilityInfo,
  ];

  let menuButton;

  for (const transferFilterIdentifier of transferFilterIdentifiers) {
    menuButton = document.querySelector(
      `.k-state-active th[data-field="${transferFilterIdentifier}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

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
              pageManager.transferManifestNumberFilterInput = input;
              pageManager.transferManifestNumberFilterSelect = select;
              pageManager.transferManifestNumberApplyFiltersButton = button;
              break;
            case TransferFilterIdentifiers.DeliveryFacilities:
              pageManager.transferOutgoingDeliveryFacilitiesFilterInput = input;
              pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton = button;
              break;
            case TransferFilterIdentifiers.ShipperFacilityInfo:
              pageManager.transferIncomingShipperFacilityInfoFilterInput = input;
              pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton = button;
              break;
            default:
              break;
          }
        }
      }

      // Close the menu
      menuButton.click();
    } else {
      console.error("Menu button not found", transferFilterIdentifier);
    }
  }
}

export async function acquireTagFilterElementsImpl() {
  if (!pageManager.tagClearFiltersButton) {
    const btn = document.querySelector(".k-state-active span.icon-filter") as HTMLElement;

    if (btn) {
      btn.click();
      // @ts-ignore
      pageManager.tagClearFiltersButton = btn.parentElement?.parentElement?.querySelector("a");
      btn.click();
    }
  }

  // This is important, as otherwise click() calls will kill page usability
  if (
    atLeastOneIsTruthy(
      pageManager.tagNumberFilterInput,
      pageManager.tagNumberFilterSelect,
      pageManager.tagNumberApplyFiltersButton
    )
  ) {
    return;
  }

  const tagFilterIdentifiers: TagFilterIdentifiers[] = [TagFilterIdentifiers.Label];

  let menuButton;

  for (const tagFilterIdentifier of tagFilterIdentifiers) {
    menuButton = document.querySelector(
      `.k-state-active th[data-field="${tagFilterIdentifier}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

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
              pageManager.tagNumberFilterInput = input;
              pageManager.tagNumberFilterSelect = select;
              pageManager.tagNumberApplyFiltersButton = button;
              break;
            default:
              break;
          }
        }
      }

      // Close the menu
      menuButton.click();
    } else {
      console.error("Menu button not found", tagFilterIdentifier);
    }
  }
}

export async function setPlantFilterImpl(
  plantFilterIdentifier: PlantFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    plantFilterIdentifier,
    value,
  });

  let input: HTMLInputElement | null = null;

  switch (plantFilterIdentifier) {
    case PlantFilterIdentifiers.Label:
      input = pageManager.plantLabelFilterInput;
      break;
    case PlantFilterIdentifiers.StrainName:
      input = pageManager.plantStrainNameFilterInput;
      break;
    case PlantFilterIdentifiers.LocationName:
      input = pageManager.plantLocationNameFilterInput;
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

  pageManager.applyPlantFilter(plantFilterIdentifier);
}

export async function setPackageFilterImpl(
  packageFilterIdentifier: PackageFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    packageFilterIdentifier,
    value,
  });

  let input: HTMLInputElement | null = null;

  switch (packageFilterIdentifier) {
    case PackageFilterIdentifiers.Label:
      input = pageManager.packageLabelFilterInput;
      break;
    case PackageFilterIdentifiers.SourceHarvestNames:
      input = pageManager.packageSourceHarvestNameFilterInput;
      break;
    case PackageFilterIdentifiers.SourcePackageLabels:
      input = pageManager.packageSourcePackageLabelFilterInput;
      break;
    case PackageFilterIdentifiers.ProductionBatchNumber:
      input = pageManager.packageProductionBatchNumberFilterInput;
      break;
    case PackageFilterIdentifiers.SourceProductionBatchNumbers:
      input = pageManager.packageSourceProductionBatchNumbersFilterInput;
      break;
    case PackageFilterIdentifiers.ItemName:
      input = pageManager.packageItemNameFilterInput;
      break;
    case PackageFilterIdentifiers.ItemStrainName:
      input = pageManager.packageItemStrainNameFilterInput;
      break;
    case PackageFilterIdentifiers.ItemProductCategoryName:
      input = pageManager.packageItemProductCategoryNameFilterInput;
      break;
    case PackageFilterIdentifiers.LocationName:
      input = pageManager.packageLocationNameFilterInput;
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

  pageManager.applyPackageFilter(packageFilterIdentifier);
}

export async function setTransferFilterImpl(
  transferFilterIdentifier: TransferFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TRANSFER_FILTER, {
    transferFilterIdentifier,
    value,
  });

  let input: HTMLInputElement | null = null;

  switch (transferFilterIdentifier) {
    case TransferFilterIdentifiers.ManifestNumber:
      input = pageManager.transferManifestNumberFilterInput;
      break;
    case TransferFilterIdentifiers.DeliveryFacilities:
      input = pageManager.transferOutgoingDeliveryFacilitiesFilterInput;
      break;
    case TransferFilterIdentifiers.ShipperFacilityInfo:
      input = pageManager.transferIncomingShipperFacilityInfoFilterInput;
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

  pageManager.applyTransferFilter(transferFilterIdentifier);
}

export async function setTagFilterImpl(tagFilterIdentifier: TagFilterIdentifiers, value: string) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TAG_FILTER, {
    tagFilterIdentifier,
    value,
  });

  let input: HTMLInputElement | null = null;
  let select: HTMLElement | null = null;

  switch (tagFilterIdentifier) {
    case TagFilterIdentifiers.Label:
      input = pageManager.tagNumberFilterInput;
      select = pageManager.tagNumberFilterSelect;
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
    for (const li of select.querySelectorAll("li")) {
      if (li.innerText.trim() === "Equal to") {
        li.click();
        break;
      }
    }
  } else {
    console.log("bad select");
  }

  pageManager.applyTagFilter(tagFilterIdentifier);
}

export function applyPlantFilterImpl(plantFilterIdentifier: PlantFilterIdentifiers) {
  let button: HTMLButtonElement | null = null;

  switch (plantFilterIdentifier) {
    case PlantFilterIdentifiers.Label:
      button = pageManager.plantLabelApplyFiltersButton;
      break;
    case PlantFilterIdentifiers.StrainName:
      button = pageManager.plantStrainNameApplyFiltersButton;
      break;
    case PlantFilterIdentifiers.LocationName:
      button = pageManager.plantLocationNameApplyFiltersButton;
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

export function applyPackageFilterImpl(packageFilterIdentifier: PackageFilterIdentifiers) {
  let button: HTMLButtonElement | null = null;

  switch (packageFilterIdentifier) {
    case PackageFilterIdentifiers.Label:
      button = pageManager.packageLabelApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.SourceHarvestNames:
      button = pageManager.packageSourceHarvestNameApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.SourcePackageLabels:
      button = pageManager.packageSourcePackageLabelApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.ProductionBatchNumber:
      button = pageManager.packageProductionBatchNumberApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.SourceProductionBatchNumbers:
      button = pageManager.packageSourceProductionBatchNumbersApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.ItemName:
      button = pageManager.packageItemNameApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.ItemStrainName:
      button = pageManager.packageItemStrainNameApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.ItemProductCategoryName:
      button = pageManager.packageItemProductCategoryNameApplyFiltersButton;
      break;
    case PackageFilterIdentifiers.LocationName:
      button = pageManager.packageLocationNameApplyFiltersButton;
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

export function applyTransferFilterImpl(transferFilterIdentifier: TransferFilterIdentifiers) {
  let button: HTMLButtonElement | null = null;

  switch (transferFilterIdentifier) {
    case TransferFilterIdentifiers.ManifestNumber:
      button = pageManager.transferManifestNumberApplyFiltersButton;
      break;
    case TransferFilterIdentifiers.DeliveryFacilities:
      button = pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton;
      break;
    case TransferFilterIdentifiers.ShipperFacilityInfo:
      button = pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton;
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

export function applyTagFilterImpl(tagFilterIdentifier: TagFilterIdentifiers) {
  let button: HTMLButtonElement | null = null;

  switch (tagFilterIdentifier) {
    case TagFilterIdentifiers.Label:
      button = pageManager.tagNumberApplyFiltersButton;
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
export async function resetMetrcPlantFiltersImpl() {
  store.dispatch(`plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`, {
    plantSearchFilters: {},
  });
  if (pageManager.plantClearFiltersButton) {
    pageManager.plantClearFiltersButton.click();
  } else {
    console.log("Bad resetMetrcPlantFilters");
  }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcPackageFiltersImpl() {
  store.dispatch(`packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`, {
    packageSearchFilters: {},
  });
  if (pageManager.packageClearFiltersButton) {
    pageManager.packageClearFiltersButton.click();
  } else {
    console.log("Bad resetMetrcPackageFilters");
  }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcTransferFiltersImpl() {
  if (pageManager.transferClearFiltersButton) {
    pageManager.transferClearFiltersButton.click();
  } else {
    console.log("Bad resetMetrcTransferFilters");
  }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcTagFiltersImpl() {
  if (pageManager.tagClearFiltersButton) {
    pageManager.tagClearFiltersButton.click();
  } else {
    console.log("Bad resetMetrcTagFilters");
  }
}

export async function resetFilterElementReferencesImpl() {
  // Plant
  pageManager.plantClearFiltersButton = null;

  pageManager.plantLabelFilterInput = null;
  pageManager.plantLabelFilterSelect = null;
  pageManager.plantLabelApplyFiltersButton = null;

  pageManager.plantStrainNameFilterInput = null;
  pageManager.plantStrainNameApplyFiltersButton = null;

  pageManager.plantLocationNameFilterInput = null;
  pageManager.plantLocationNameApplyFiltersButton = null;

  // Package
  pageManager.packageClearFiltersButton = null;

  pageManager.packageLabelFilterInput = null;
  pageManager.packageLabelFilterSelect = null;
  pageManager.packageLabelApplyFiltersButton = null;

  pageManager.packageSourceHarvestNameFilterInput = null;
  pageManager.packageSourceHarvestNameApplyFiltersButton = null;

  pageManager.packageSourcePackageLabelFilterInput = null;
  pageManager.packageSourcePackageLabelApplyFiltersButton = null;

  pageManager.packageItemNameFilterInput = null;
  pageManager.packageItemNameApplyFiltersButton = null;

  pageManager.packageItemStrainNameFilterInput = null;
  pageManager.packageItemStrainNameApplyFiltersButton = null;

  pageManager.packageItemProductCategoryNameFilterInput = null;
  pageManager.packageItemProductCategoryNameApplyFiltersButton = null;

  pageManager.packageLocationNameFilterInput = null;
  pageManager.packageLocationNameApplyFiltersButton = null;

  // Transfer
  pageManager.transferClearFiltersButton = null;

  pageManager.transferManifestNumberFilterInput = null;
  pageManager.transferManifestNumberFilterSelect = null;
  pageManager.transferManifestNumberApplyFiltersButton = null;

  pageManager.transferOutgoingDeliveryFacilitiesFilterInput = null;
  pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton = null;

  pageManager.transferIncomingShipperFacilityInfoFilterInput = null;
  pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton = null;

  // Tag
  pageManager.tagClearFiltersButton = null;

  pageManager.tagNumberFilterInput = null;
  pageManager.tagNumberFilterSelect = null;
  pageManager.tagNumberApplyFiltersButton = null;
}
