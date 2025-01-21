import {
  IDestinationPackageData,
  IIndexedIncomingTransferData,
  IIndexedPackageData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTagData,
  IIndexedTransferData,
  ILicenseFormFilters,
  IPluginState,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import {
  getIsoDateFromOffset,
  isCustodiedDatetimeOrError,
  isoDatetimeToLocalDate,
  todayIsodate,
} from "../date";
import { extractInitialPackageQuantityAndUnitFromHistoryOrError } from "../history";
import { getItemNameOrError, getLabelOrError } from "../package";
import { extractLicenseFields, licenseFilterFactory } from "./reports-shared";

export enum InventoryStrategy {
  SLICE_START_OF_DAY = "Only include inventory that was in custody at the start of the day",
  SLICE_END_OF_DAY = "Only include inventory that was in custody at the end of the day",
  FULL_DAY = "Only include inventory that was in custody for the full day",
  PARTIAL_DAY = "Only include inventory that was in custody at any point on this day",
}

export interface IExampleReportFormFilters extends ILicenseFormFilters {
  targetDate: string;
  useRestrictedWindowOptimization: boolean;
  restrictedWindowDays: number;
  restrictedWindowDaysOptions: { value: number; text: string }[];
  showDebugColumns: boolean;
  inventoryStrategy: InventoryStrategy;
}

export interface IPackageDateMetadata {
  pkg: IIndexedPackageData | null;
  incomingTransferPackages: IDestinationPackageData[];
  outgoingDestinationPackages: IDestinationPackageData[];
  shipmentPackageState: string | null;
  itemName: string | null;
  quantity: number | null;
  unitOfMeasure: string | null;
  tagUsedDate: string | null;
  packagedDate: string | null;
  packagedBy: string | null;
  archivedDate: string | null;
  finishedDate: string | null;
  receivedDate: string | null;
  incomingManifests: string[];
  outgoingManifests: string[];
  arrivalDatetimes: string[];
  departureDatetimes: string[];
  eligible: boolean;
  message: string;
  debugMessage: string;
}

export const exampleFormFiltersFactory: () => IExampleReportFormFilters =
  () => ({
    targetDate: todayIsodate(),
    useRestrictedWindowOptimization: true,
    restrictedWindowDays: 365,
    restrictedWindowDaysOptions: [
      { value: Math.floor(365 / 2), text: "Within 6 months" },
      { value: 365, text: "Within 1 year" },
      { value: Math.floor(365 * 1.5), text: "Within 18 months" },
      { value: 365 * 2, text: "Within 2 years" },
    ],
    showDebugColumns: false,
    inventoryStrategy: InventoryStrategy.SLICE_START_OF_DAY,
    ...licenseFilterFactory(),
  });

export function addExampleReport({
  reportConfig,
  exampleFormFilters,
}: {
  reportConfig: IReportConfig;
  exampleFormFilters: IExampleReportFormFilters;
}) {
  reportConfig[ReportType.EXAMPLE] = {
    targetDate: exampleFormFilters.targetDate,
    inventoryStrategy: exampleFormFilters.inventoryStrategy,
    useRestrictedWindowOptimization:
      exampleFormFilters.useRestrictedWindowOptimization,
    restrictedWindowDays: exampleFormFilters.restrictedWindowDays,
    showDebugColumns: exampleFormFilters.showDebugColumns,
    ...extractLicenseFields(exampleFormFilters),
    fields: null,
  };
}

export async function maybeLoadExampleReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const exampleReportConfig = reportConfig[ReportType.EXAMPLE];

  if (!exampleReportConfig) {
    return;
  }

  if (!exampleReportConfig?.targetDate) {
    throw new Error("Must provide target date");
  }

  if (exampleReportConfig?.targetDate > todayIsodate()) {
    throw new Error("Cannot select a date in the future");
  }

  for (const license of exampleReportConfig.licenses) {
    const dataLoader: DataLoader = await getDataLoaderByLicense(license);

    if ((await dataLoader.activePackageCount()) === null) {
      throw new Error(`This report type requires package permissions for ${license}`);
    }

    if ((await dataLoader.outgoingTransferCount()) === null) {
      throw new Error(`This report type requires transfer permissions for ${license}`);
    }

    if ((await dataLoader.availableTagCount()) === null) {
      throw new Error(`This report type requires tag permissions for ${license}`);
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading package data...", level: "success" },
  });

  const packageMetadataMap: Map<string, IPackageDateMetadata> = new Map();

  const promises: Promise<any>[] = [];

  // All packages that are currently in the custody of the parent license
  let allPackages: IIndexedPackageData[] = [];
  let allUsedTags: IIndexedTagData[] = [];
  let allInactiveIncomingTransfers: IIndexedIncomingTransferData[] = [];
  let allInactiveOutgoingTransfers: IIndexedTransferData[] = [];

  for (const license of exampleReportConfig.licenses) {
    const dataLoader: DataLoader = await getDataLoaderByLicense(license);

    promises.push(
      dataLoader.activePackages().then((result) => {
        allPackages = [...allPackages, ...result];

        // Backwards compat - possibly redundant
        return allPackages;
      }),
      dataLoader.onHoldPackages().then((result) => {
        allPackages = [...allPackages, ...result];

        // Backwards compat - possibly redundant
        return allPackages;
      }),
      dataLoader.inactivePackages().then((result) => {
        allPackages = [...allPackages, ...result];

        // Backwards compat - possibly redundant
        return allPackages;
      }),
      dataLoader.inTransitPackages().then((result) => {
        allPackages = [...allPackages, ...result];

        // Backwards compat - possibly redundant
        return allPackages;
      }),
      dataLoader.usedTags().then((result) => {
        allUsedTags = [...allUsedTags, ...result];
      }),
      dataLoader.incomingInactiveTransfers().then((result) => {
        allInactiveIncomingTransfers = [...allInactiveIncomingTransfers, ...result];
      }),
      dataLoader.outgoingInactiveTransfers().then((result) => {
        allInactiveOutgoingTransfers = [...allInactiveOutgoingTransfers, ...result];
      })
    );

    await Promise.allSettled(promises);
  }

  function metadataFactory(): IPackageDateMetadata {
    return {
      pkg: null,
      incomingTransferPackages: [],
      outgoingDestinationPackages: [],
      itemName: null,
      quantity: null,
      unitOfMeasure: null,
      tagUsedDate: null,
      packagedBy: null,
      packagedDate: null,
      archivedDate: null,
      finishedDate: null,
      receivedDate: null,
      shipmentPackageState: null,
      incomingManifests: [],
      outgoingManifests: [],
      arrivalDatetimes: [],
      departureDatetimes: [],
      eligible: false,
      message: "",
      debugMessage: "",
    };
  }

  const days = exampleReportConfig.useRestrictedWindowOptimization ? 365 : 5000;
  const minDate = getIsoDateFromOffset(-days, exampleReportConfig.targetDate);
  const maxDate = getIsoDateFromOffset(days, exampleReportConfig.targetDate);

  for (const pkg of allPackages) {
    const label = getLabelOrError(pkg);

    if (!packageMetadataMap.has(label)) {
      packageMetadataMap.set(label, metadataFactory());
    }

    const metadata = packageMetadataMap.get(label)!;

    metadata.itemName = getItemNameOrError(pkg);
    metadata.pkg = pkg;
    metadata.packagedBy = pkg.PackagedByFacilityLicenseNumber ?? null;
    metadata.packagedDate = pkg.PackagedDate ?? null;
    metadata.archivedDate = pkg.ArchivedDate ?? null;
    metadata.finishedDate = pkg.FinishedDate ?? null;
    metadata.receivedDate = pkg.ReceivedDateTime
      ? isoDatetimeToLocalDate(pkg.ReceivedDateTime)
      : null;
  }

  const filteredIncomingTransfers: IIndexedRichIncomingTransferData[] =
    allInactiveIncomingTransfers.filter((transfer) => {
      if (transfer.LastModified < minDate) {
        return false;
      }

      if (transfer.CreatedDateTime > maxDate) {
        return false;
      }

      return true;
    });

  // Load incoming packages in parallel
  for (const incomingTransfer of filteredIncomingTransfers) {
    const dataLoader = await getDataLoaderByLicense(incomingTransfer.LicenseNumber);

    promises.push(
      dataLoader.destinationPackages(incomingTransfer.DeliveryId).then((packages) => {
        incomingTransfer.incomingPackages = packages;

        // Backwards compat - possibly redundant
        return packages;
      })
    );

    if (promises.length % 100 === 0) {
      await Promise.allSettled(promises);
    }
  }

  const filteredOutgoingTransfers: IIndexedRichOutgoingTransferData[] =
    allInactiveOutgoingTransfers.filter((transfer) => {
      if (transfer.LastModified < minDate) {
        return false;
      }

      if (transfer.CreatedDateTime > maxDate) {
        return false;
      }

      return true;
    });

  // Load destinations in parallel
  for (const outgoingTransfer of filteredOutgoingTransfers) {
    const dataLoader = await getDataLoaderByLicense(outgoingTransfer.LicenseNumber);

    promises.push(
      dataLoader.transferDestinations(outgoingTransfer.Id).then((destinations) => {
        outgoingTransfer.outgoingDestinations = destinations;

        // Backwards compat - possibly redundant
        return destinations;
      })
    );

    if (promises.length % 100 === 0) {
      await Promise.allSettled(promises);
    }
  }

  await Promise.allSettled(promises);

  // Load packages in parallel
  for (const outgoingTransfer of filteredOutgoingTransfers) {
    const dataLoader = await getDataLoaderByLicense(outgoingTransfer.LicenseNumber);

    for (const destination of outgoingTransfer.outgoingDestinations!) {
      promises.push(
        dataLoader.destinationPackages(destination.Id).then((packages) => {
          destination.packages = packages;

          // Backwards compat - possibly redundant
          return packages;
        })
      );
    }

    if (promises.length % 100 === 0) {
      await Promise.allSettled(promises);
    }
  }

  await Promise.allSettled(promises);

  for (const incomingTransfer of filteredIncomingTransfers) {
    for (const pkg of incomingTransfer.incomingPackages!) {
      const label = getLabelOrError(pkg);
      if (!packageMetadataMap.has(label)) {
        packageMetadataMap.set(label, metadataFactory());
      }

      const metadata = packageMetadataMap.get(label)!;

      metadata.incomingTransferPackages.push(pkg);

      metadata.shipmentPackageState = pkg.ShipmentPackageState;
      metadata.incomingManifests.push(incomingTransfer.ManifestNumber);
      // metadata.arrivalDatetimes.push(isoDatetimeToLocalDate(incomingTransfer.ReceivedDateTime!));
      metadata.arrivalDatetimes.push(incomingTransfer.ReceivedDateTime!);
      metadata.itemName = getItemNameOrError(pkg);
      metadata.quantity = pkg.ShippedQuantity;
      metadata.unitOfMeasure = pkg.ShippedUnitOfMeasureAbbreviation;
    }
  }

  for (const outgoingTransfer of filteredOutgoingTransfers) {
    for (const destination of outgoingTransfer.outgoingDestinations!) {
      for (const pkg of destination.packages!) {
        const label = getLabelOrError(pkg);
        if (!packageMetadataMap.has(label)) {
          packageMetadataMap.set(label, metadataFactory());
        }

        const metadata = packageMetadataMap.get(label)!;

        metadata.outgoingDestinationPackages.push(pkg);

        metadata.outgoingManifests.push(outgoingTransfer.ManifestNumber);
        // metadata.departureDatetimes.push(isoDatetimeToLocalDate(destination.ReceivedDateTime!));
        metadata.departureDatetimes.push(destination.ReceivedDateTime!);
        metadata.itemName = getItemNameOrError(pkg);
        metadata.quantity = pkg.ShippedQuantity;
        metadata.unitOfMeasure = pkg.ShippedUnitOfMeasureAbbreviation;
      }
    }
  }

  // Fold in tag info to existing packagess
  for (const tag of allUsedTags) {
    const label = tag.Label;

    if (!tag.UsedDateTime) {
      continue;
    }

    const usedDate = isoDatetimeToLocalDate(tag.UsedDateTime);

    // Don't add new rows
    if (!packageMetadataMap.has(label)) {
      continue;
    }

    const metadata = packageMetadataMap.get(label)!;

    metadata.tagUsedDate = usedDate;
  }

  // Evaluate eligibility
  for (const [label, metadata] of packageMetadataMap.entries()) {
    // Ineligible if packaged after target date
    if (
      metadata.packagedDate &&
      metadata.packagedDate > exampleReportConfig.targetDate
    ) {
      continue;
    }

    // Ineligible if archived before target date
    if (
      metadata.archivedDate &&
      metadata.archivedDate < exampleReportConfig.targetDate
    ) {
      continue;
    }

    // Ineligible if finished before target date
    if (
      metadata.finishedDate &&
      metadata.finishedDate < exampleReportConfig.targetDate
    ) {
      continue;
    }

    // Ineligible if tag used date after target date
    if (
      metadata.tagUsedDate &&
      metadata.tagUsedDate > exampleReportConfig.targetDate
    ) {
      continue;
    }

    // Record received date
    if (
      metadata.receivedDate &&
      metadata.receivedDate > exampleReportConfig.targetDate
    ) {
      continue;
    }

    try {
      const isCustodied = isCustodiedDatetimeOrError({
        arrivalDatetimes: metadata.arrivalDatetimes,
        departureDatetimes: metadata.departureDatetimes,
        targetDatetime: exampleReportConfig.targetDate,
      });

      if (!isCustodied) {
        continue;
      }
    } catch {
      metadata.message += "Unable to determine if this package was in custody.";
      metadata.debugMessage += `Transfer datetimes could not be parsed. arrival:${metadata.arrivalDatetimes.join()}/departure:${metadata.departureDatetimes.join()}`;
    }

    if (metadata.shipmentPackageState === "Returned") {
      // Only 'Accepted' is allowed
      continue;
    }

    metadata.eligible = true;
  }

  for (const [label, metadata] of packageMetadataMap.entries()) {
    if (!metadata.eligible) {
      continue;
    }

    if (!metadata.pkg) {
      continue;
    }

    const dataLoader = await getDataLoaderByLicense(metadata.pkg.LicenseNumber);

    promises.push(
      dataLoader.packageHistoryByPackageId(metadata.pkg.Id).then((history) => {
        metadata.pkg!.history = history;
      })
    );

    if (promises.length % 100 === 0) {
      await Promise.allSettled(promises);
    }
  }

  await Promise.allSettled(promises);

  for (const [label, metadata] of packageMetadataMap.entries()) {
    if (!metadata.pkg?.history) {
      continue;
    }

    const [quantity, unitOfMeasure] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
      metadata.pkg!.history!,
      getLabelOrError(metadata.pkg)
    );

    metadata.quantity = quantity;
    metadata.unitOfMeasure = unitOfMeasure;
  }

  reportData[ReportType.EXAMPLE] = {
    packageMetadataPairs: [...packageMetadataMap.entries()],
  };
}

export function extractExampleData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const matrix: any[][] = [];

  const headers = [
    "Current License",
    "Tag",
    "Item",
    "Quantity (estimated)",
    "Unit of Measure",
    "Note",
  ];

  if (reportConfig[ReportType.EXAMPLE]!.showDebugColumns) {
    headers.push(
      "Debug Message",
      "Incoming Manifests",
      "Outgoing Manifests",
      "Tag Used Date",
      "Packaged Date",
      "Archived Date",
      "Finished Date",
      "Received Date",
      "Arrival Dates",
      "Departure Dates",
      "Eligible?",
      "Has Package",
      "Incomging Package Count",
      "Outgoing Package Count"
    );
  }

  matrix.push(headers);

  const pairs = reportData[ReportType.EXAMPLE]!.packageMetadataPairs;

  for (const [label, metadata] of pairs) {
    if (metadata.eligible) {
      const row: any[] = [
        metadata.pkg?.LicenseNumber,
        label,
        metadata.itemName,
        metadata.quantity,
        metadata.unitOfMeasure,
        metadata.message,
      ];

      if (reportConfig[ReportType.EXAMPLE]!.showDebugColumns) {
        row.push(
          metadata.debugMessage,
          metadata.incomingManifests.join("|"),
          metadata.outgoingManifests.join("|"),
          metadata.tagUsedDate,
          metadata.packagedDate,
          metadata.archivedDate,
          metadata.finishedDate,
          metadata.receivedDate,
          metadata.arrivalDatetimes.join("|"),
          metadata.departureDatetimes.join("|"),
          metadata.eligible,
          !!metadata.pkg,
          metadata.incomingTransferPackages.length,
          metadata.outgoingDestinationPackages.length
        );
      }

      matrix.push(row);
    }
  }

  return matrix;
}
