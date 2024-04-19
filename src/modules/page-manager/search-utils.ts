import {
  MessageType,
  MetrcGridId,
  PackageFilterIdentifiers,
  PlantFilterIdentifiers,
  TagFilterIdentifiers,
  TransferFilterIdentifiers,
  TransferredPackageFilterIdentifiers,
} from "@/consts";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { analyticsManager } from "../analytics-manager.module";
import { pageManager } from "./page-manager.module";

const T3_SEARCH_MENU_ATTRIBUTE = `t3-search-menu`;
const T3_GRID_ID_ATTRIBUTE = `t3-grid-id`;
const T3_SEARCH_FIELD_ATTRIBUTE = `t3-search-field`;

export async function initializeFilterButtonsImpl() {
  const menuButtons = [
    ...document.querySelectorAll(
      `th[data-field]:not([${T3_SEARCH_MENU_ATTRIBUTE}]) .k-header-column-menu`
    ),
  ];

  for (const menuButton of menuButtons) {
    menuButton.parentElement!.setAttribute(T3_SEARCH_MENU_ATTRIBUTE, "1");
  }
}

export async function getFilterFormOrError(
  gridId: MetrcGridId,
  searchFilter: string
): Promise<HTMLFormElement> {
  let mappedAnimationContainer = document.querySelector(
    `.k-animation-container[${T3_SEARCH_FIELD_ATTRIBUTE}="${searchFilter}"][${T3_GRID_ID_ATTRIBUTE}="${gridId}"]`
  );

  if (!mappedAnimationContainer) {
    const menuButton = document.querySelector(
      `th[data-field="${searchFilter}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (!menuButton) {
      throw new Error(`Cannot find menu button for filter: ${searchFilter}`);
    }

    pageManager.suppressAnimationContainer();

    menuButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    menuButton.click();

    const untaggedAnimationContainer = document.querySelector(
      `.k-animation-container:not([${T3_SEARCH_FIELD_ATTRIBUTE}]) .k-column-menu`
    )?.parentElement;

    if (!untaggedAnimationContainer) {
      throw new Error(`Could not initialize animation container for filter: ${searchFilter}`);
    }

    untaggedAnimationContainer.setAttribute(T3_GRID_ID_ATTRIBUTE, gridId);
    untaggedAnimationContainer.setAttribute(T3_SEARCH_FIELD_ATTRIBUTE, searchFilter);

    mappedAnimationContainer = untaggedAnimationContainer;
  }

  return mappedAnimationContainer.querySelector("form")!;
}

export async function setFilterImpl(gridId: MetrcGridId, searchFilter: string, value: string) {
  await pageManager.refresh;

  const form = await getFilterFormOrError(gridId, searchFilter);

  const input = form.querySelector(`input[title="Filter Criteria"]`)! as HTMLElement;
  const button = form.querySelector(`button[type="submit"]`)! as HTMLElement;
  input.dispatchEvent(new Event("change"));
  button.click();
}

export async function setPlantFilterImpl(
  gridId: MetrcGridId,
  plantFilterIdentifier: PlantFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    plantFilterIdentifier,
    value,
  });

  await setFilterImpl(gridId, plantFilterIdentifier, value);
}

export async function setPackageFilterImpl(
  gridId: MetrcGridId,
  packageFilterIdentifier: PackageFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    packageFilterIdentifier,
    value,
  });

  await setFilterImpl(gridId, packageFilterIdentifier, value);
}

export async function setDestinationPackageFilterImpl(
  gridId: MetrcGridId,
  destinationPackageFilterIdentifier: TransferredPackageFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    destinationPackageFilterIdentifier,
    value,
  });

  await setFilterImpl(gridId, destinationPackageFilterIdentifier, value);
}

export async function setTransferFilterImpl(
  gridId: MetrcGridId,
  transferFilterIdentifier: TransferFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TRANSFER_FILTER, {
    transferFilterIdentifier,
    value,
  });

  await setFilterImpl(gridId, transferFilterIdentifier, value);
}

export async function setTagFilterImpl(
  gridId: MetrcGridId,
  tagFilterIdentifier: TagFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TAG_FILTER, {
    tagFilterIdentifier,
    value,
  });

  await setFilterImpl(gridId, tagFilterIdentifier, value);

  // let input: HTMLInputElement | null = null;
  // let select: HTMLElement | null = null;

  // switch (tagFilterIdentifier) {
  //   case TagFilterIdentifiers.Label:
  //     input = pageManager.tagNumberFilterInput;
  //     select = pageManager.tagNumberFilterSelect;
  //     break;
  //   default:
  //     console.error("bad identifier:", tagFilterIdentifier);
  //     break;
  // }

  // if (input) {
  //   input.value = value;
  //   input.dispatchEvent(new Event("change"));
  // } else {
  //   console.log("bad input");
  // }

  // if (select) {
  //   for (const li of select.querySelectorAll("li")) {
  //     if (li.innerText.trim() === "Equal to") {
  //       li.click();
  //       break;
  //     }
  //   }
  // } else {
  //   console.log("bad select");
  // }

  // pageManager.applyTagFilter(tagFilterIdentifier);
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

export function applyDestinationPackageFilterImpl(
  destinationPackageFilterIdentifier: TransferredPackageFilterIdentifiers
) {
  let button: HTMLButtonElement | null = null;

  switch (destinationPackageFilterIdentifier) {
    case TransferredPackageFilterIdentifiers.PackageLabel:
      button = pageManager.destinationPackageLabelApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.SourceHarvestNames:
      button = pageManager.destinationPackageSourceHarvestNameApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.SourcePackageLabels:
      button = pageManager.destinationPackageSourcePackageLabelApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.ProductName:
      button = pageManager.destinationPackageProductNameApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.ItemStrainName:
      button = pageManager.destinationPackageItemStrainNameApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.ProductCategoryName:
      button = pageManager.destinationPackageItemProductCategoryNameApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.ManifestNumber:
      button = pageManager.destinationPackageManifestNumberApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.DestinationFacilityName:
      button = pageManager.destinationPackageDestinationFacilityNameApplyFiltersButton;
      break;
    case TransferredPackageFilterIdentifiers.DestinationLicenseNumber:
      button = pageManager.destinationPackageDestinationLicenseNumberApplyFiltersButton;
      break;
    default:
      console.error("bad identifier:", destinationPackageFilterIdentifier);
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
