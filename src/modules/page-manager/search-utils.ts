import {
  HarvestState,
  MessageType,
  MetrcGridId,
  PackageFilterIdentifiers,
  PackageState,
  PlantBatchState,
  PlantFilterIdentifiers,
  PlantState,
  TagFilterIdentifiers,
  TagState,
  TransferFilterIdentifiers,
  TransferredPackageFilterIdentifiers,
  TransferState
} from "@/consts";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { ISearchResult } from "@/store/page-overlay/modules/search/interfaces";
import _ from "lodash-es";
import { analyticsManager } from "../analytics-manager.module";
import { pageManager } from "./page-manager.module";

const T3_METRC_GRID_ID_ATTRIBUTE = `t3-grid-id`;
const T3_SEARCH_FILTER_ATTRIBUTE = `t3-search-filter`;

export function generateSearchResultMetadata(partialResult: Partial<ISearchResult>): ISearchResult {
  let primaryIconName: string = "question-circle";
  let secondaryIconName: string | null = null;

  // Label, Manifest #, PB Name, etc
  let primaryTextualIdentifier: string = "";

  // 4 lbs OG Kush, 50 clones,
  let secondaryTextualIdentifier: string = "";

  // Plant, Incoming Transfer
  let primaryTextualDescriptor: string = "";

  // Cannabis Plant [Tag]
  let secondaryTextualDescriptor: string | null = null;

  // Active, Inactive
  let primaryStatusTextualDescriptor: string | null = null;

  let isActive: boolean = false;
  let isInactive: boolean = false;

  const score: number = 1;

  if (partialResult.incomingTransfer) {
    switch (partialResult.incomingTransfer.TransferState) {
      case TransferState.INCOMING_INACTIVE:
        primaryStatusTextualDescriptor = "Inactive";
        isInactive = true;
        break;
      case TransferState.INCOMING:
      default:
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
    }

    primaryIconName = "truck-loading";
    secondaryIconName = "arrow-left";
    primaryTextualDescriptor = "Incoming Transfer";
    primaryTextualIdentifier = partialResult.incomingTransfer.ManifestNumber;
    secondaryTextualIdentifier = `${partialResult.incomingTransfer.PackageCount} pkg transfer from ${partialResult.incomingTransfer.ShipperFacilityName}`;
  } else if (partialResult.outgoingTransfer) {
    switch (partialResult.outgoingTransfer.TransferState) {
      case TransferState.OUTGOING_INACTIVE:
        primaryStatusTextualDescriptor = "Inactive";
        isInactive = true;
        break;
      case TransferState.REJECTED:
        primaryStatusTextualDescriptor = "Rejected";
        break;
      case TransferState.OUTGOING:
      default:
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
    }

    primaryIconName = "truck-loading";
    secondaryIconName = "arrow-right";
    primaryTextualDescriptor = "Outgoing Transfer";
    primaryTextualIdentifier = partialResult.outgoingTransfer.ManifestNumber;
    secondaryTextualIdentifier = `${partialResult.outgoingTransfer.PackageCount} pkg transfer`;
  } else if (partialResult.pkg) {
    switch (partialResult.pkg.PackageState) {
      case PackageState.ACTIVE:
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case PackageState.INACTIVE:
        primaryStatusTextualDescriptor = "Inactive";
        isInactive = true;
        break;
      case PackageState.IN_TRANSIT:
        primaryStatusTextualDescriptor = "Added to Transfer";
        break;
      default:
        break;
    }

    primaryIconName = "box";
    secondaryIconName = null;
    primaryTextualDescriptor = "Package";
    secondaryTextualDescriptor = partialResult.pkg.Item.ProductCategoryName;
    primaryTextualIdentifier = partialResult.pkg.Label;
    secondaryTextualIdentifier = `${partialResult.pkg.Quantity} ${partialResult.pkg.UnitOfMeasureAbbreviation} ${partialResult.pkg.Item.Name}`;
  } else if (partialResult.tag) {
    switch (partialResult.tag.TagState) {
      case TagState.AVAILABLE:
        primaryStatusTextualDescriptor = `Available`;
        isActive = true;
        break;
      case TagState.USED:
        primaryStatusTextualDescriptor = `Used`;
        isInactive = true;
        break;
      case TagState.VOIDED:
        primaryStatusTextualDescriptor = `Voided`;
        isInactive = true;
        break;
      default:
        break;
    }

    primaryIconName = "tag";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.tag.Label;
    secondaryTextualDescriptor = ``;
    primaryTextualDescriptor = "Tag";
    secondaryTextualDescriptor = partialResult.tag.TagTypeName;
  } else if (partialResult.transferPkg) {
    switch (partialResult.transferPkg.PackageState) {
      case PackageState.TRANSFERRED:
        primaryStatusTextualDescriptor = "Transferred";
        isInactive = true;
        break;
      default:
        break;
    }

    primaryIconName = "box";
    secondaryIconName = "truck";
    primaryTextualIdentifier = partialResult.transferPkg.PackageLabel;
    secondaryTextualIdentifier = `${partialResult.transferPkg.ShippedQuantity} ${partialResult.transferPkg.ShippedUnitOfMeasureAbbreviation} ${partialResult.transferPkg.ProductName}`;
    primaryTextualDescriptor = `Package`;
  } else if (partialResult.plant) {
    switch (partialResult.plant.PlantState) {
      case PlantState.FLOWERING:
        primaryStatusTextualDescriptor = 'Flowering';
        isActive = true;
        break;
      case PlantState.VEGETATIVE:
        primaryStatusTextualDescriptor = 'Vegetative';
        isActive = true;
        break;
      case PlantState.INACTIVE:
        primaryStatusTextualDescriptor = 'Inactive';
        isInactive = true;
        break;
      default:
        break;
    }

    primaryIconName = "leaf";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.plant.Label;
    secondaryTextualIdentifier = `${partialResult.plant.StrainName} Plant`;
    primaryTextualDescriptor = 'Plant';
    secondaryTextualDescriptor = partialResult.plant.StrainName;
  } else if (partialResult.plantBatch) {
    switch (partialResult.plantBatch.PlantBatchState) {
      case PlantBatchState.ACTIVE:
        primaryStatusTextualDescriptor = 'Active';
        isActive = true;
        break;
      case PlantBatchState.INACTIVE:
        primaryStatusTextualDescriptor = 'Inactive';
        isInactive = true;
        break;
      default:
        break;
    }

    primaryIconName = "seedling";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.plantBatch.Name;
    secondaryTextualIdentifier = `${partialResult.plantBatch.UntrackedCount} ${partialResult.plantBatch.StrainName} ${partialResult.plantBatch.TypeName}s`;
    primaryTextualDescriptor = 'Plant Batch';
    secondaryTextualDescriptor = partialResult.plantBatch.TypeName;
  } else if (partialResult.harvest) {
    switch (partialResult.harvest.HarvestState) {
      case HarvestState.ACTIVE:
        primaryStatusTextualDescriptor = 'Active';
        isActive = true;
        break;
      case HarvestState.INACTIVE:
        primaryStatusTextualDescriptor = 'Inactive';
        isInactive = true;
        break;
      default:
        break;
    }

    primaryIconName = "cannabis";
    secondaryIconName = "cut";
    primaryTextualIdentifier = partialResult.harvest.Name;
    secondaryTextualIdentifier = `${partialResult.harvest.CurrentWeight} ${partialResult.harvest.UnitOfWeightAbbreviation} ${partialResult.harvest.HarvestTypeName} - ${partialResult.harvest.HarvestStartDate}`;
    primaryTextualDescriptor = 'Harvest';
    secondaryTextualDescriptor = partialResult.harvest.HarvestTypeName;
  } else if (partialResult.item) {
    primaryIconName = "box";
    secondaryIconName = "clipboard-list";
    primaryTextualIdentifier = partialResult.item.Name;
    primaryTextualDescriptor = 'Item';
    secondaryTextualDescriptor = partialResult.item.ProductCategoryName;
    isActive = true;
  } else if (partialResult.strain) {
    primaryIconName = "cannabis";
    secondaryIconName = "clipboard-list";
    primaryTextualIdentifier = partialResult.strain.Name;
    primaryTextualDescriptor = 'Strain';
    isActive = true;
  } // else if (partialResult.salesReceipt) {
  //   switch (partialResult.salesReceipt.SalesReceiptState) {

  //   }

  //   primaryIconName = "file-invoice-dollar";
  //   secondaryIconName = null;
  // }

  return {
    ...partialResult,
    score,
    primaryIconName,
    secondaryIconName,
    primaryTextualIdentifier,
    secondaryTextualIdentifier,
    primaryTextualDescriptor,
    secondaryTextualDescriptor,
    primaryStatusTextualDescriptor,
    isInactive,
    isActive
  };
}

export function getActiveMetrcGridIdOrNull(): MetrcGridId | null {
  return (
    (document
      .querySelector(`[data-grid-selector].k-state-active`)
      ?.getAttribute("data-grid-selector")
      ?.replace("#", "") as MetrcGridId) ?? null
  );
}

export function getAllMetrcGridIds(): MetrcGridId[] {
  return [...document.querySelectorAll(`[data-grid-selector]`)].map((x) => (x.getAttribute("data-grid-selector")!.replace("#", "") as MetrcGridId));
}

export const mirrorMetrcSearchStateImpl = _.debounce(async () => {
  const metrcGridId = getActiveMetrcGridIdOrNull();

  store.dispatch(`search/${SearchActions.SET_ACTIVE_METRC_GRID_ID}`, { metrcGridId });

  const inputs: HTMLInputElement[] = [
    ...document.querySelectorAll(
      `input[${T3_METRC_GRID_ID_ATTRIBUTE}="${metrcGridId}"][${T3_SEARCH_FILTER_ATTRIBUTE}]`
    ),
  ] as HTMLInputElement[];

  const searchFilters: { [key: string]: string } = {};

  for (const input of inputs) {
    if (!input.value) {
      continue;
    }

    searchFilters[input.getAttribute(T3_SEARCH_FILTER_ATTRIBUTE)!] = input.value;
  }

  store.dispatch(`search/${SearchActions.SET_METRC_SEARCH_FILTERS}`, {
    metrcGridId,
    searchFilters,
  });
}, 100);

export async function initializeFilterButtonsImpl() {
  const allGrids = [...document.querySelectorAll(`div[data-role="grid"]`)];

  for (const grid of allGrids) {
    const metrcGridId = grid.getAttribute("id");

    if (!metrcGridId) {
      console.error(`Missing grid ID`);
      continue;
    }

    const untaggedMenuButtons = [
      ...grid.querySelectorAll(
        `th[data-field] .k-header-column-menu:not([${T3_METRC_GRID_ID_ATTRIBUTE}])`
      ),
    ];

    for (const menuButton of untaggedMenuButtons) {
      const searchFilter: string | null = menuButton.parentElement!.getAttribute("data-field");

      if (!searchFilter) {
        console.error(`Missing searchFilter`);
        continue;
      }

      menuButton.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, metrcGridId);
      menuButton.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);

      menuButton.addEventListener("click", async () => {
        await pageManager.clickSettleDelay();

        // If an animation container is created, it will be last
        const filterMenuForms = [...document.querySelectorAll(`form.k-filter-menu`)];
        const lastFilterMenuForm = filterMenuForms[filterMenuForms.length - 1];

        if (!lastFilterMenuForm.hasAttribute(T3_SEARCH_FILTER_ATTRIBUTE)) {
          lastFilterMenuForm.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, metrcGridId);
          lastFilterMenuForm.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);

          const input = lastFilterMenuForm.querySelector("input")!;

          input.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, metrcGridId);
          input.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);
        }
      });
    }
  }
}

export async function getFilterFormOrError(
  metrcGridId: MetrcGridId,
  searchFilter: string
): Promise<HTMLFormElement> {
  let mappedFilterForm: HTMLFormElement | null = document.querySelector(
    `form.k-filter-menu[${T3_SEARCH_FILTER_ATTRIBUTE}="${searchFilter}"][${T3_METRC_GRID_ID_ATTRIBUTE}="${metrcGridId}"]`
  );

  if (!mappedFilterForm) {
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

    const untaggedForm: HTMLFormElement | null = document.querySelector(
      `.form.k-filter-menu:not([${T3_SEARCH_FILTER_ATTRIBUTE}])`
    );

    if (!untaggedForm) {
      throw new Error(`Could not initialize animation container for filter: ${searchFilter}`);
    }

    untaggedForm.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, metrcGridId);
    untaggedForm.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);

    mappedFilterForm = untaggedForm;
  }

  return mappedFilterForm!;
}

export async function setFilterImpl(metrcGridId: MetrcGridId, searchFilter: string, value: string) {
  await pageManager.refresh;

  await pageManager.clickTabWithGridId(metrcGridId);

  const form = await getFilterFormOrError(metrcGridId, searchFilter);

  const input = form.querySelector(`input[title="Filter Criteria"]`)! as HTMLElement;
  const button = form.querySelector(`button[type="submit"]`)! as HTMLElement;
  input.dispatchEvent(new Event("change"));
  button.click();
}

export async function setPlantFilterImpl(
  metrcGridId: MetrcGridId,
  plantFilterIdentifier: PlantFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    plantFilterIdentifier,
    value,
  });

  await setFilterImpl(metrcGridId, plantFilterIdentifier, value);
}

export async function setPackageFilterImpl(
  metrcGridId: MetrcGridId,
  packageFilterIdentifier: PackageFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    packageFilterIdentifier,
    value,
  });

  await setFilterImpl(metrcGridId, packageFilterIdentifier, value);
}

export async function setDestinationPackageFilterImpl(
  metrcGridId: MetrcGridId,
  destinationPackageFilterIdentifier: TransferredPackageFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_PACKAGE_FILTER, {
    destinationPackageFilterIdentifier,
    value,
  });

  await setFilterImpl(metrcGridId, destinationPackageFilterIdentifier, value);
}

export async function setTransferFilterImpl(
  metrcGridId: MetrcGridId,
  transferFilterIdentifier: TransferFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TRANSFER_FILTER, {
    transferFilterIdentifier,
    value,
  });

  await setFilterImpl(metrcGridId, transferFilterIdentifier, value);
}

export async function setTagFilterImpl(
  metrcGridId: MetrcGridId,
  tagFilterIdentifier: TagFilterIdentifiers,
  value: string
) {
  await pageManager.refresh;

  analyticsManager.track(MessageType.SELECTED_TAG_FILTER, {
    tagFilterIdentifier,
    value,
  });

  await setFilterImpl(metrcGridId, tagFilterIdentifier, value);

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
  // let button: HTMLButtonElement | null = null;
  // switch (plantFilterIdentifier) {
  //   case PlantFilterIdentifiers.Label:
  //     button = pageManager.plantLabelApplyFiltersButton;
  //     break;
  //   case PlantFilterIdentifiers.StrainName:
  //     button = pageManager.plantStrainNameApplyFiltersButton;
  //     break;
  //   case PlantFilterIdentifiers.LocationName:
  //     button = pageManager.plantLocationNameApplyFiltersButton;
  //     break;
  //   default:
  //     console.error("bad identifier:", plantFilterIdentifier);
  //     break;
  // }
  // if (button) {
  //   button.click();
  // } else {
  //   console.log("bad button");
  // }
}

export function applyPackageFilterImpl(packageFilterIdentifier: PackageFilterIdentifiers) {
  // let button: HTMLButtonElement | null = null;
  // switch (packageFilterIdentifier) {
  //   case PackageFilterIdentifiers.Label:
  //     button = pageManager.packageLabelApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.SourceHarvestNames:
  //     button = pageManager.packageSourceHarvestNameApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.SourcePackageLabels:
  //     button = pageManager.packageSourcePackageLabelApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.ProductionBatchNumber:
  //     button = pageManager.packageProductionBatchNumberApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.SourceProductionBatchNumbers:
  //     button = pageManager.packageSourceProductionBatchNumbersApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.ItemName:
  //     button = pageManager.packageItemNameApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.ItemStrainName:
  //     button = pageManager.packageItemStrainNameApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.ItemProductCategoryName:
  //     button = pageManager.packageItemProductCategoryNameApplyFiltersButton;
  //     break;
  //   case PackageFilterIdentifiers.LocationName:
  //     button = pageManager.packageLocationNameApplyFiltersButton;
  //     break;
  //   default:
  //     console.error("bad identifier:", packageFilterIdentifier);
  //     break;
  // }
  // if (button) {
  //   button.click();
  // } else {
  //   console.log("bad button");
  // }
}

export function applyDestinationPackageFilterImpl(
  destinationPackageFilterIdentifier: TransferredPackageFilterIdentifiers
) {
  // let button: HTMLButtonElement | null = null;
  // switch (destinationPackageFilterIdentifier) {
  //   case TransferredPackageFilterIdentifiers.PackageLabel:
  //     button = pageManager.destinationPackageLabelApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.SourceHarvestNames:
  //     button = pageManager.destinationPackageSourceHarvestNameApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.SourcePackageLabels:
  //     button = pageManager.destinationPackageSourcePackageLabelApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.ProductName:
  //     button = pageManager.destinationPackageProductNameApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.ItemStrainName:
  //     button = pageManager.destinationPackageItemStrainNameApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.ProductCategoryName:
  //     button = pageManager.destinationPackageItemProductCategoryNameApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.ManifestNumber:
  //     button = pageManager.destinationPackageManifestNumberApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.DestinationFacilityName:
  //     button = pageManager.destinationPackageDestinationFacilityNameApplyFiltersButton;
  //     break;
  //   case TransferredPackageFilterIdentifiers.DestinationLicenseNumber:
  //     button = pageManager.destinationPackageDestinationLicenseNumberApplyFiltersButton;
  //     break;
  //   default:
  //     console.error("bad identifier:", destinationPackageFilterIdentifier);
  //     break;
  // }
  // if (button) {
  //   button.click();
  // } else {
  //   console.log("bad button");
  // }
}

export function applyTransferFilterImpl(transferFilterIdentifier: TransferFilterIdentifiers) {
  // let button: HTMLButtonElement | null = null;
  // switch (transferFilterIdentifier) {
  //   case TransferFilterIdentifiers.ManifestNumber:
  //     button = pageManager.transferManifestNumberApplyFiltersButton;
  //     break;
  //   case TransferFilterIdentifiers.DeliveryFacilities:
  //     button = pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton;
  //     break;
  //   case TransferFilterIdentifiers.ShipperFacilityInfo:
  //     button = pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton;
  //     break;
  //   default:
  //     console.error("bad identifier:", transferFilterIdentifier);
  //     break;
  // }
  // if (button) {
  //   button.click();
  // } else {
  //   console.log("bad button");
  // }
}

export function applyTagFilterImpl(tagFilterIdentifier: TagFilterIdentifiers) {
  // let button: HTMLButtonElement | null = null;
  // switch (tagFilterIdentifier) {
  //   case TagFilterIdentifiers.Label:
  //     button = pageManager.tagNumberApplyFiltersButton;
  //     break;
  //   default:
  //     console.error("bad identifier:", tagFilterIdentifier);
  //     break;
  // }
  // if (button) {
  //   button.click();
  // } else {
  //   console.log("bad button");
  // }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcPlantFiltersImpl() {
  // store.dispatch(`plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`, {
  //   plantSearchFilters: {},
  // });
  // if (pageManager.plantClearFiltersButton) {
  //   pageManager.plantClearFiltersButton.click();
  // } else {
  //   console.log("Bad resetMetrcPlantFilters");
  // }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcPackageFiltersImpl() {
  // store.dispatch(`packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`, {
  //   packageSearchFilters: {},
  // });
  // if (pageManager.packageClearFiltersButton) {
  //   pageManager.packageClearFiltersButton.click();
  // } else {
  //   console.log("Bad resetMetrcPackageFilters");
  // }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcTransferFiltersImpl() {
  // if (pageManager.transferClearFiltersButton) {
  //   pageManager.transferClearFiltersButton.click();
  // } else {
  //   console.log("Bad resetMetrcTransferFilters");
  // }
}

// Clicks the Metrc reset button - everything is wiped out
export async function resetMetrcTagFiltersImpl() {
  // if (pageManager.tagClearFiltersButton) {
  //   pageManager.tagClearFiltersButton.click();
  // } else {
  //   console.log("Bad resetMetrcTagFilters");
  // }
}

export async function resetFilterElementReferencesImpl() {
  // Plant
  // pageManager.plantClearFiltersButton = null;
  // pageManager.plantLabelFilterInput = null;
  // pageManager.plantLabelFilterSelect = null;
  // pageManager.plantLabelApplyFiltersButton = null;
  // pageManager.plantStrainNameFilterInput = null;
  // pageManager.plantStrainNameApplyFiltersButton = null;
  // pageManager.plantLocationNameFilterInput = null;
  // pageManager.plantLocationNameApplyFiltersButton = null;
  // // Package
  // pageManager.packageClearFiltersButton = null;
  // pageManager.packageLabelFilterInput = null;
  // pageManager.packageLabelFilterSelect = null;
  // pageManager.packageLabelApplyFiltersButton = null;
  // pageManager.packageSourceHarvestNameFilterInput = null;
  // pageManager.packageSourceHarvestNameApplyFiltersButton = null;
  // pageManager.packageSourcePackageLabelFilterInput = null;
  // pageManager.packageSourcePackageLabelApplyFiltersButton = null;
  // pageManager.packageItemNameFilterInput = null;
  // pageManager.packageItemNameApplyFiltersButton = null;
  // pageManager.packageItemStrainNameFilterInput = null;
  // pageManager.packageItemStrainNameApplyFiltersButton = null;
  // pageManager.packageItemProductCategoryNameFilterInput = null;
  // pageManager.packageItemProductCategoryNameApplyFiltersButton = null;
  // pageManager.packageLocationNameFilterInput = null;
  // pageManager.packageLocationNameApplyFiltersButton = null;
  // // Transfer
  // pageManager.transferClearFiltersButton = null;
  // pageManager.transferManifestNumberFilterInput = null;
  // pageManager.transferManifestNumberFilterSelect = null;
  // pageManager.transferManifestNumberApplyFiltersButton = null;
  // pageManager.transferOutgoingDeliveryFacilitiesFilterInput = null;
  // pageManager.transferOutgoingDeliveryFacilitiesApplyFiltersButton = null;
  // pageManager.transferIncomingShipperFacilityInfoFilterInput = null;
  // pageManager.transferIncomingShipperFacilityInfoApplyFiltersButton = null;
  // // Tag
  // pageManager.tagClearFiltersButton = null;
  // pageManager.tagNumberFilterInput = null;
  // pageManager.tagNumberFilterSelect = null;
  // pageManager.tagNumberApplyFiltersButton = null;
}
