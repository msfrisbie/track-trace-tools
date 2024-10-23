import {
  HarvestState,
  METRC_GRID_METADATA,
  METRC_TAG_REGEX,
  NativeMetrcGridId,
  PackageState,
  PlantBatchState,
  PlantState,
  SalesReceiptState,
  TagState,
  TransferState,
  UniqueMetrcGridId,
} from "@/consts";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import {
  IMatchedFieldMetadata,
  ISearchResult,
} from "@/store/page-overlay/modules/search/interfaces";
import _ from "lodash-es";
import { pageManager } from "./page-manager.module";
import { uniqueMetrcGridIdFromNativeMetrcGridIdAndPathnameOrNull } from "./utils";

const T3_METRC_GRID_ID_ATTRIBUTE = `t3-grid-id`;
const T3_SEARCH_FILTER_ATTRIBUTE = `t3-search-filter`;

const IGNORE_FIELDS = new Set(["Id"]);

export function extractMatchedFields(
  primaryField: string,
  queryString: string,
  o: { [key: string]: any }
): IMatchedFieldMetadata[] {
  const normalizedQueryString = queryString.toLocaleLowerCase();

  const matchedFields: IMatchedFieldMetadata[] = [];

  if (!o) {
    return matchedFields; // return an empty array if the object is null or undefined
  }

  for (const [k, v] of Object.entries(o)) {
    if (IGNORE_FIELDS.has(k)) {
      continue;
    }

    if (typeof v === "object" && v !== null) {
      matchedFields.push(
        ...extractMatchedFields(primaryField, queryString, v).map((x) => ({
          ...x,
          field: `${k}.${x.field}`,
          isPrimaryField: `${k}.${x.field}` === primaryField,
        }))
      );
      continue;
    }

    if (typeof v === "string" && v.toLocaleLowerCase().includes(normalizedQueryString)) {
      matchedFields.push({
        field: k,
        value: v,
        subscore: generateScoreFromMatch({
          primaryField,
          matchedField: k,
          queryString: normalizedQueryString,
          value: v,
        }),
        isPrimaryField: k === primaryField,
      });
    }
  }

  matchedFields.sort((a, b) => (a.subscore < b.subscore ? 1 : -1));

  return matchedFields;
}

export function generateSearchResultMetadata(
  queryString: string,
  partialResult: Partial<ISearchResult>
): ISearchResult {
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

  let isActive: boolean;

  let matchedFields: IMatchedFieldMetadata[] = [];

  let score: number = 1;

  let enablePackageScoreBoost = false;
  let enablePlantScoreBoost = false;
  let enablePlantBatchScoreBoost = false;

  let path: string;
  let uniqueMetrcGridId: UniqueMetrcGridId;
  let colorClassName: string;
  let primaryField: string;
  let isPrimaryIdentifierMetrcTag: boolean = false;

  if (partialResult.incomingTransfer) {
    switch (partialResult.incomingTransfer.TransferState) {
      case TransferState.INCOMING:
        uniqueMetrcGridId = UniqueMetrcGridId.TRANSFERS_INCOMING;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case TransferState.INCOMING_INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.TRANSFERS_INCOMING_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "truck-loading";
    secondaryIconName = "arrow-left";
    primaryTextualDescriptor = "Incoming Transfer";
    primaryTextualIdentifier = partialResult.incomingTransfer.ManifestNumber;
    secondaryTextualIdentifier = `${partialResult.incomingTransfer.PackageCount} package incoming transfer from ${partialResult.incomingTransfer.ShipperFacilityName}`;
    path = `/industry/${partialResult.incomingTransfer.LicenseNumber}/transfers/licensed`;
    colorClassName = "yellow";
    primaryField = "ManifestNumber";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.incomingTransfer);
  } else if (partialResult.outgoingTransfer) {
    switch (partialResult.outgoingTransfer.TransferState) {
      case TransferState.OUTGOING:
        uniqueMetrcGridId = UniqueMetrcGridId.TRANSFERS_OUTGOING;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case TransferState.REJECTED:
        primaryStatusTextualDescriptor = "Rejected";
        isActive = true;
        uniqueMetrcGridId = UniqueMetrcGridId.TRANSFERS_REJECTED;
        break;
      case TransferState.OUTGOING_INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.TRANSFERS_OUTGOING_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "truck-loading";
    secondaryIconName = "arrow-right";
    primaryTextualDescriptor = "Outgoing Transfer";
    primaryTextualIdentifier = partialResult.outgoingTransfer.ManifestNumber;
    secondaryTextualIdentifier = `${partialResult.outgoingTransfer.PackageCount} package outgoing transfer`;
    path = `/industry/${partialResult.outgoingTransfer.LicenseNumber}/transfers/licensed`;
    colorClassName = "yellow";
    primaryField = "ManifestNumber";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.outgoingTransfer);
  } else if (partialResult.pkg) {
    enablePackageScoreBoost = true;

    switch (partialResult.pkg.PackageState) {
      case PackageState.ACTIVE:
        uniqueMetrcGridId = UniqueMetrcGridId.PACKAGES_ACTIVE;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case PackageState.IN_TRANSIT:
        uniqueMetrcGridId = UniqueMetrcGridId.PACKAGES_IN_TRANSIT;
        primaryStatusTextualDescriptor = "Added to Transfer";
        isActive = true;
        break;
      case PackageState.INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.PACKAGES_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "box";
    secondaryIconName = null;
    primaryTextualDescriptor = "Package";
    secondaryTextualDescriptor = partialResult.pkg.Item.ProductCategoryName;
    primaryTextualIdentifier = partialResult.pkg.Label;
    secondaryTextualIdentifier = `${partialResult.pkg.Quantity} ${partialResult.pkg.UnitOfMeasureAbbreviation} package of ${partialResult.pkg.Item.Name}`;
    path = `/industry/${partialResult.pkg.LicenseNumber}/packages`;
    colorClassName = "purple";
    primaryField = "Label";
    isPrimaryIdentifierMetrcTag = true;

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.pkg);
  } else if (partialResult.tag) {
    switch (partialResult.tag.TagState) {
      case TagState.AVAILABLE:
        uniqueMetrcGridId = UniqueMetrcGridId.TAGS_AVAILABLE;
        primaryStatusTextualDescriptor = `Available`;
        isActive = true;
        break;
      case TagState.USED:
        uniqueMetrcGridId = UniqueMetrcGridId.TAGS_USED;
        primaryStatusTextualDescriptor = `Used`;
        isActive = false;
        break;
      case TagState.VOIDED:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.TAGS_VOIDED;
        primaryStatusTextualDescriptor = `Voided`;
        isActive = false;
        break;
    }

    primaryIconName = "tag";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.tag.Label;
    secondaryTextualDescriptor = ``;
    primaryTextualDescriptor = "Tag";
    secondaryTextualDescriptor = partialResult.tag.TagTypeName;
    path = `/industry/${partialResult.tag.LicenseNumber}/admin/tags`;
    colorClassName = "blue";
    primaryField = "Label";
    isPrimaryIdentifierMetrcTag = true;

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.tag);
  } else if (partialResult.transferPkg) {
    enablePackageScoreBoost = true;

    uniqueMetrcGridId = UniqueMetrcGridId.PACKAGES_TRANSFERRED;
    primaryStatusTextualDescriptor = "Transferred";
    isActive = false;

    primaryIconName = "box";
    secondaryIconName = "truck";
    primaryTextualIdentifier = partialResult.transferPkg.PackageLabel;
    secondaryTextualIdentifier = `${partialResult.transferPkg.ShippedQuantity} ${partialResult.transferPkg.ShippedUnitOfMeasureAbbreviation} ${partialResult.transferPkg.ProductName}`;
    primaryTextualDescriptor = "Package";
    path = `/industry/${partialResult.transferPkg.LicenseNumber}/packages`;
    colorClassName = "purple";
    primaryField = "PackageLabel";
    isPrimaryIdentifierMetrcTag = true;

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.transferPkg);
  } else if (partialResult.plant) {
    enablePlantScoreBoost = true;

    switch (partialResult.plant.PlantState) {
      case PlantState.FLOWERING:
        uniqueMetrcGridId = UniqueMetrcGridId.PLANTS_FLOWERING;
        primaryStatusTextualDescriptor = "Flowering";
        isActive = true;
        break;
      case PlantState.VEGETATIVE:
        uniqueMetrcGridId = UniqueMetrcGridId.PLANTS_VEGETATIVE;
        primaryStatusTextualDescriptor = "Vegetative";
        isActive = true;
        break;
      case PlantState.INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.PLANTS_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "leaf";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.plant.Label;
    secondaryTextualIdentifier = `${partialResult.plant.StrainName} Plant`;
    primaryTextualDescriptor = "Plant";
    secondaryTextualDescriptor = partialResult.plant.StrainName;
    path = `/industry/${partialResult.plant.LicenseNumber}/plants`;
    colorClassName = "green";
    primaryField = "Label";
    isPrimaryIdentifierMetrcTag = true;

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.plant);
  } else if (partialResult.plantBatch) {
    enablePlantBatchScoreBoost = true;

    switch (partialResult.plantBatch.PlantBatchState) {
      case PlantBatchState.ACTIVE:
        uniqueMetrcGridId = UniqueMetrcGridId.PLANT_BATCHES;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case PlantBatchState.INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.PLANT_BATCHES_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "seedling";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.plantBatch.Name;
    secondaryTextualIdentifier = `${partialResult.plantBatch.UntrackedCount} ${partialResult.plantBatch.StrainName} ${partialResult.plantBatch.PlantBatchTypeName}s`;
    primaryTextualDescriptor = "Plant Batch";
    secondaryTextualDescriptor = partialResult.plantBatch.PlantBatchTypeName;
    path = `/industry/${partialResult.plantBatch.LicenseNumber}/plants`;
    colorClassName = "green";
    primaryField = "Name";
    isPrimaryIdentifierMetrcTag = !!partialResult.plantBatch.Name.match(METRC_TAG_REGEX);

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.plantBatch);
  } else if (partialResult.harvest) {
    switch (partialResult.harvest.HarvestState) {
      case HarvestState.ACTIVE:
        uniqueMetrcGridId = UniqueMetrcGridId.HARVESTS_HARVESTED;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case HarvestState.INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.HARVESTS_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "cannabis";
    secondaryIconName = "cut";
    primaryTextualIdentifier = partialResult.harvest.Name;
    secondaryTextualIdentifier = `${partialResult.harvest.CurrentWeight} ${partialResult.harvest.UnitOfWeightAbbreviation} ${partialResult.harvest.HarvestTypeName} - ${partialResult.harvest.HarvestStartDate}`;
    primaryTextualDescriptor = "Harvest";
    secondaryTextualDescriptor = partialResult.harvest.HarvestTypeName;
    path = `/industry/${partialResult.harvest.LicenseNumber}/plants`;
    colorClassName = "red";
    primaryField = "Name";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.harvest);
  } else if (partialResult.item) {
    primaryStatusTextualDescriptor = "Active";
    primaryIconName = "box";
    secondaryIconName = "clipboard-list";
    primaryTextualIdentifier = partialResult.item.Name;
    primaryTextualDescriptor = "Item";
    secondaryTextualDescriptor = partialResult.item.ProductCategoryName;
    isActive = true;
    uniqueMetrcGridId = UniqueMetrcGridId.ITEMS_GRID;
    path = `/industry/${partialResult.item.LicenseNumber}/admin/items`;
    colorClassName = "gray";
    primaryField = "Name";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.item);
  } else if (partialResult.salesReceipt) {
    switch (partialResult.salesReceipt.SalesReceiptState) {
      case SalesReceiptState.ACTIVE:
        uniqueMetrcGridId = UniqueMetrcGridId.SALES_ACTIVE;
        primaryStatusTextualDescriptor = "Active";
        isActive = true;
        break;
      case SalesReceiptState.INACTIVE:
      default:
        uniqueMetrcGridId = UniqueMetrcGridId.SALES_INACTIVE;
        primaryStatusTextualDescriptor = "Inactive";
        isActive = false;
        break;
    }

    primaryIconName = "file-invoice-dollar";
    secondaryIconName = null;
    primaryTextualIdentifier = partialResult.salesReceipt.ReceiptNumber;
    primaryTextualDescriptor = "Sales Receipt";
    path = `/industry/${partialResult.salesReceipt.LicenseNumber}/sales/receipts`;
    colorClassName = "gray";
    primaryField = "ReceiptNumber";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.salesReceipt);
  } else if (partialResult.strain) {
    primaryIconName = "cannabis";
    secondaryIconName = "clipboard-list";
    primaryTextualIdentifier = partialResult.strain.Name;
    primaryStatusTextualDescriptor = "Active";
    primaryTextualDescriptor = "Strain";
    isActive = true;
    uniqueMetrcGridId = UniqueMetrcGridId.STRAIN_GRID;
    path = `/industry/${partialResult.strain.LicenseNumber}/admin/strains`;
    colorClassName = "gray";
    primaryField = "Name";

    matchedFields = extractMatchedFields(primaryField, queryString, partialResult.strain);
  } else {
    console.error("no match");
    throw new Error("Unable to match datatype for partial result");
  }

  score = matchedFields.reduce((maxObj, currentObj) => {
    if (currentObj.subscore > maxObj.subscore) {
      // If the subscore of the current object is greater than the subscore of the max object,
      // update the max object to be the current object.
      return currentObj;
    }

    // Otherwise, keep the max object as it is.
    return maxObj;
  }, matchedFields[0]).subscore;

  if (enablePackageScoreBoost) {
    score *= 1.1;
  }

  if (enablePlantScoreBoost) {
    score *= 1.1;
  }

  if (enablePlantBatchScoreBoost) {
    score *= 1.1;
  }

  if (!isActive) {
    score *= 0.2;
  }

  const result = {
    ...partialResult,
    path,
    colorClassName,
    uniqueMetrcGridId,
    primaryField,
    isPrimaryIdentifierMetrcTag,
    score,
    primaryIconName,
    secondaryIconName,
    primaryTextualIdentifier,
    secondaryTextualIdentifier,
    primaryTextualDescriptor,
    secondaryTextualDescriptor,
    primaryStatusTextualDescriptor,
    matchedFields,
    isActive,
  };

  return result;
}

export function generateScoreFromMatch({
  primaryField,
  matchedField,
  queryString,
  value,
}: {
  primaryField: string;
  matchedField: string;
  queryString: string;
  value: string;
}): number {
  // If either the query or body is empty, return 0
  if (!queryString || !value) return 0;

  const queryLength = queryString.length;
  const bodyLength = value.length;

  // Find the index of the query in the body
  const startIndex = value.indexOf(queryString);

  // If the query is not found in the body, return 0
  if (startIndex === -1) return 0;

  // Calculate proximity score based on how close the match is to the start or end of the body
  const proximityToStart = 1 - startIndex / bodyLength;
  const proximityToEnd = 1 - (bodyLength - (startIndex + queryLength)) / bodyLength;

  const proximityScore = Math.max(proximityToStart, proximityToEnd);

  // Calculate the percentage of the body string that the query string matches
  const matchPercentage = Math.sqrt(queryLength / bodyLength);

  // Final score is the product of the proximity score and the match percentage
  let score = proximityScore * matchPercentage;

  // Modifiers
  // If not primary field, reduce match score by 80%
  if (primaryField !== matchedField) {
    score *= 0.2;
  }

  return score;
}

function getTabs() {}

export function getActiveUniqueMetrcGridIdOrNull(): UniqueMetrcGridId | null {
  const pageHasTabs = !!document.querySelector(`li[data-grid-selector]`);

  let activeNativeMetrcGridId: NativeMetrcGridId | null =
    (document
      .querySelector(`[data-grid-selector].k-state-active`)
      ?.getAttribute("data-grid-selector")
      ?.replace("#", "") as NativeMetrcGridId) ?? null;

  if (!activeNativeMetrcGridId && !pageHasTabs) {
    // Might be on a page with no tabs (items, strains)
    activeNativeMetrcGridId =
      (document
        .querySelector(`[data-role="grid"].k-grid.k-widget.k-display-block`)
        ?.getAttribute("id") as NativeMetrcGridId) ?? null;
  }

  if (!activeNativeMetrcGridId) {
    return null;
  }

  return uniqueMetrcGridIdFromNativeMetrcGridIdAndPathnameOrNull(
    activeNativeMetrcGridId,
    window.location.pathname
  );
}

export function getAllUniqueMetrcGridIds(): UniqueMetrcGridId[] {
  const pageHasTabs = !!document.querySelector(`li[data-grid-selector]`);

  let nativeMetrcGridIds: NativeMetrcGridId[] = [
    ...document.querySelectorAll(`[data-grid-selector]`),
  ].map((x) => x.getAttribute("data-grid-selector")!.replace("#", "") as NativeMetrcGridId);

  if (!nativeMetrcGridIds.length && !pageHasTabs) {
    nativeMetrcGridIds = [
      ...document.querySelectorAll(`[data-role="grid"].k-grid.k-widget.k-display-block`),
    ].map((x) => x.getAttribute("id") as NativeMetrcGridId);
  }

  const uniqueMetrcGridIds: UniqueMetrcGridId[] = [];

  for (const nativeMetrcGridId of nativeMetrcGridIds) {
    if (nativeMetrcGridId.startsWith(".js-")) {
      // This is a nested grid, ignore
      continue;
    }

    const match = uniqueMetrcGridIdFromNativeMetrcGridIdAndPathnameOrNull(
      nativeMetrcGridId,
      window.location.pathname
    );

    if (match) {
      uniqueMetrcGridIds.push(match);
      continue;
    }

    console.error(`Bad Metrc Grid Id: ${nativeMetrcGridId}`);
  }

  return uniqueMetrcGridIds;
}

export const mirrorMetrcTableState = _.debounce(
  async () => {
    const activeUniqueMetrcGridId = getActiveUniqueMetrcGridIdOrNull();

    store.dispatch(`search/${SearchActions.SET_ACTIVE_METRC_GRID_ID}`, {
      activeUniqueMetrcGridId,
    });

    for (const uniqueMetrcGridId of getAllUniqueMetrcGridIds()) {
      const inputs: HTMLInputElement[] = [
        ...document.querySelectorAll(
          `input[${T3_METRC_GRID_ID_ATTRIBUTE}="${uniqueMetrcGridId}"][${T3_SEARCH_FILTER_ATTRIBUTE}]`
        ),
      ] as HTMLInputElement[];

      const searchFilters: { [key: string]: string } = {};

      for (const input of inputs) {
        if (!input.value) {
          continue;
        }

        searchFilters[input.getAttribute(T3_SEARCH_FILTER_ATTRIBUTE)!] = input.value;
      }

      await store.dispatch(`search/${SearchActions.MIRROR_METRC_SEARCH_FILTERS}`, {
        uniqueMetrcGridId,
        searchFilters,
      });
    }
  },
  100,
  { leading: true }
);

export async function initializeFilterButtons() {
  const allGrids = [...document.querySelectorAll(`div[data-role="grid"]`)];

  for (const grid of allGrids) {
    const nativeMetrcGridId: string | null = grid.getAttribute("id");

    if (!nativeMetrcGridId) {
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

      const uniqueMetrcGridId: UniqueMetrcGridId | null =
        uniqueMetrcGridIdFromNativeMetrcGridIdAndPathnameOrNull(
          nativeMetrcGridId as NativeMetrcGridId,
          window.location.pathname
        );

      if (!uniqueMetrcGridId) {
        console.error(`Bad native ID: ${nativeMetrcGridId}`);
        continue;
      }

      menuButton.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, uniqueMetrcGridId!);
      menuButton.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);

      menuButton.addEventListener("click", async () => {
        await pageManager.clickSettleDelay();

        // If an animation container is created, it will be last
        const filterMenuForms = [...document.querySelectorAll(`form.k-filter-menu`)];
        const lastFilterMenuForm = filterMenuForms[filterMenuForms.length - 1];

        if (!lastFilterMenuForm.hasAttribute(T3_SEARCH_FILTER_ATTRIBUTE)) {
          lastFilterMenuForm.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, uniqueMetrcGridId!);
          lastFilterMenuForm.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);

          const input = lastFilterMenuForm.querySelector("input")!;

          input.setAttribute(T3_METRC_GRID_ID_ATTRIBUTE, uniqueMetrcGridId!);
          input.setAttribute(T3_SEARCH_FILTER_ATTRIBUTE, searchFilter);
        }
      });
    }
  }
}

export async function getFilterFormOrError(
  uniqueMetrcGridId: UniqueMetrcGridId,
  searchFilter: string
): Promise<HTMLFormElement> {
  const nativeMetrcGridId = METRC_GRID_METADATA[uniqueMetrcGridId].nativeMetrcGridId;

  await pageManager.refresh;

  const mappedFilterFormSelector: string = `form.k-filter-menu[${T3_METRC_GRID_ID_ATTRIBUTE}="${uniqueMetrcGridId}"][${T3_SEARCH_FILTER_ATTRIBUTE}="${searchFilter}"]`;

  let mappedFilterForm: HTMLFormElement | null = document.querySelector(mappedFilterFormSelector);

  if (!mappedFilterForm) {
    const menuButton = document.querySelector(
      `#${nativeMetrcGridId} th[data-field="${searchFilter}"] .k-header-column-menu`
    ) as HTMLElement | null;

    if (!menuButton) {
      throw new Error(`Cannot find menu button for filter: ${searchFilter}`);
    }

    pageManager.suppressAnimationContainer();

    menuButton.click();
    // attributes are set in initializeFilterButtons during the event loop turn
    await pageManager.clickSettleDelay();
    menuButton.click();

    mappedFilterForm = document.querySelector(mappedFilterFormSelector);

    if (!mappedFilterForm) {
      throw new Error(`Form query selector failed: ${mappedFilterFormSelector}`);
    }
  }

  return mappedFilterForm!;
}

export async function setFilter(
  uniqueMetrcGridId: UniqueMetrcGridId,
  searchFilter: string,
  value: string
) {
  const form = await getFilterFormOrError(uniqueMetrcGridId, searchFilter);

  const input = form.querySelector(`input[title="Filter Criteria"]`)! as HTMLInputElement;
  input.value = value;
  const button = form.querySelector(`button[type="submit"]`)! as HTMLButtonElement;
  input.dispatchEvent(new Event("change"));
  button.click();
  await pageManager.clickSettleDelay();
}

export async function applyGridState(
  activeUniqueMetrcGridId: UniqueMetrcGridId | null,
  metrcGridFilters: { [key: string]: { [key: string]: string } }
) {
  if (activeUniqueMetrcGridId) {
    await pageManager.clickTabWithGridIdIfExists(activeUniqueMetrcGridId);
  }

  for (const [uniqueMetrcGridId, metrcGridData] of Object.entries(metrcGridFilters)) {
    for (const [field, value] of Object.entries(metrcGridData)) {
      setFilter(uniqueMetrcGridId as UniqueMetrcGridId, field, value);
    }
  }
}

export async function clearGridFilters(uniqueMetrcGridId: UniqueMetrcGridId) {
  const nativeMetrcGridId: NativeMetrcGridId =
    METRC_GRID_METADATA[uniqueMetrcGridId].nativeMetrcGridId;

  const anchors = [
    ...document.querySelectorAll(`#${nativeMetrcGridId} .dropdown-menu.pull-right a`),
  ];

  for (const anchor of anchors) {
    if (anchor.textContent?.includes("Clear Filters")) {
      // @ts-ignore
      anchor.click();
      await pageManager.clickSettleDelay();
      return;
    }
  }
}
