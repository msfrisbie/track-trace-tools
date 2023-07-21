import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IPackageFilter,
  IPluginState,
  IRichDestinationData,
  ISpreadsheet,
  ITransferFilter,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { getIsoDateFromOffset, todayIsodate } from "../date";
import {
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
} from "../history";
import { getLabelOrError } from "../package";
import {
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  freezeTopRowRequestFactory,
  styleTopRowRequestFactory,
} from "../sheets";
import { writeDataSheet } from "../sheets-export";

interface ICogsReportFormFilters {
  cogsDateGt: string;
  cogsDateLt: string;
  licenseOptions: string[];
  licenses: string[];
}

export const cogsV2FormFiltersFactory: () => ICogsReportFormFilters = () => ({
  cogsDateGt: todayIsodate(),
  cogsDateLt: todayIsodate(),
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
});

export function addCogsV2Report({
  reportConfig,
  cogsV2FormFilters,
}: {
  reportConfig: IReportConfig;
  cogsV2FormFilters: ICogsReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};
  const transferFilter: ITransferFilter = {};

  const licenses: string[] = cogsV2FormFilters.licenses;

  packageFilter.packagedDateGt = cogsV2FormFilters.cogsDateGt;
  packageFilter.packagedDateLt = cogsV2FormFilters.cogsDateLt;

  transferFilter.estimatedDepartureDateGt = cogsV2FormFilters.cogsDateGt;
  transferFilter.estimatedDepartureDateLt = cogsV2FormFilters.cogsDateLt;

  reportConfig[ReportType.COGS_V2] = {
    packageFilter,
    transferFilter,
    licenses,
    fields: null,
  };
}

export async function maybeLoadCogsV2ReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.COGS_V2]) {
    return;
  }

  // packageFilter and transferFilter will have identical dates
  const { transferFilter, licenses } = reportConfig[ReportType.COGS_V2]!;

  // Load all packages

  let packages: IIndexedPackageData[] = [];

  let dataLoader: DataLoader | null = null;

  for (const license of licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);

    await dataLoader.activePackages().then(
      (pkgs) => (packages = packages.concat(pkgs)),
      (e) => {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Failed to load active packages. (${license})`,
            level: "warning",
          },
        });
      }
    );

    await dataLoader.onHoldPackages().then(
      (pkgs) => (packages = packages.concat(pkgs)),
      (e) => {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Failed to load on hold packages. (${license})`,
            level: "warning",
          },
        });
      }
    );

    await dataLoader.inactivePackages().then(
      (pkgs) => (packages = packages.concat(pkgs)),
      (e) => {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Failed to load inactive packages. (${license})`,
            level: "warning",
          },
        });
      }
    );

    await dataLoader.inTransitPackages().then(
      (pkgs) => (packages = packages.concat(pkgs)),
      (e) => {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Failed to load in transit packages. (${license})`,
            level: "warning",
          },
        });
      }
    );
  }

  const packageLabelMap = new Map<string, IIndexedPackageData>(
    packages.map((pkg) => [pkg.Label, pkg])
  );
  const productionBatchMap = new Map<string, IIndexedPackageData>(
    packages
      .filter((pkg) => !!pkg.ProductionBatchNumber)
      .map((pkg) => [pkg.ProductionBatchNumber, pkg])
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: `Loaded ${packages.length} total packages`, level: "success" },
  });

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} transfers...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);
    try {
      const outgoingTransfers = await dataLoader.outgoingTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing transfers.", level: "warning" },
      });
    }

    try {
      const rejectedTransfers = await dataLoader.rejectedTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...rejectedTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load rejected transfers.", level: "warning" },
      });
    }

    try {
      const outgoingInactiveTransfers = await dataLoader.outgoingInactiveTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingInactiveTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing inactive transfers.", level: "warning" },
      });
    }
  }

  const [departureDateGt] = transferFilter.estimatedDepartureDateGt!.split("T");
  const [departureDateLt] = getIsoDateFromOffset(1, transferFilter.estimatedDepartureDateLt!).split(
    "T"
  );

  let filter1initial = richOutgoingTransfers.length;

  // Apply wide filter to transfers before loading destinations
  // createdAt < LT, and lastModified > GT
  richOutgoingTransfers = richOutgoingTransfers.filter(
    (x) => x.LastModified > departureDateGt && x.CreatedDateTime < departureDateLt
  );

  console.log(
    `Filtered out ${filter1initial - richOutgoingTransfers.length} transfers on first filter`
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading destinations....", level: "success" },
  });

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  for (const transfer of richOutgoingTransfers) {
    richOutgoingTransferDestinationRequests.push(
      getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
        dataLoader.transferDestinations(transfer.Id).then((destinations) => {
          transfer.outgoingDestinations = destinations;
        })
      )
    );

    if (richOutgoingTransferDestinationRequests.length % 250 === 0) {
      await Promise.allSettled(richOutgoingTransferDestinationRequests);

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations....`,
          level: "success",
        },
        prependMessage: false,
      });
    }
  }

  await Promise.allSettled(richOutgoingTransferDestinationRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations`,
      level: "success",
    },
    prependMessage: false,
  });

  let filter2initial = richOutgoingTransfers.length;
  let filter2initialSubcount = richOutgoingTransfers
    .map((x) => (x.outgoingDestinations || []).length)
    .reduce((a, b) => a + b, 0);

  // Apply rough filter again to destinations based on ETD
  // etd < LT, and etd > GT
  richOutgoingTransfers = richOutgoingTransfers
    .map((x) => {
      x.outgoingDestinations = (x.outgoingDestinations || []).filter(
        (y) =>
          y.ShipmentTypeName.includes("Wholesale") &&
          y.EstimatedArrivalDateTime >= departureDateGt &&
          y.EstimatedArrivalDateTime <= departureDateLt
      );

      return x;
    })
    .filter((z) => (z.outgoingDestinations || []).length > 0);

  console.log(
    `Filtered out ${filter2initial - richOutgoingTransfers.length} transfers and ${
      filter2initialSubcount -
      richOutgoingTransfers
        .map((x) => (x.outgoingDestinations || []).length)
        .reduce((a, b) => a + b, 0)
    } destinations on second filter`
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading manifest packages...", level: "success" },
  });

  const packageRequests: Promise<any>[] = [];

  // Load manifest packages for all transfers
  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations || ([] as IRichDestinationData[])) {
      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destination.packages = destinationPackages;
          })
        )
      );

      if (packageRequests.length % 50 === 0) {
        await Promise.allSettled(packageRequests);

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Loaded ${packageRequests.length} manifests....`,
            level: "success",
          },
          prependMessage: false,
        });
      }
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${packageRequests.length} manifests containing ${richOutgoingTransfers
        .map((x) =>
          (x.outgoingDestinations || [])
            .map((x) => x.packages?.length || 0)
            .reduce((a, b) => a + b, 0)
        )
        .flat()
        .reduce((a, b) => a + b, 0)} packages`,
      level: "success",
    },
  });

  const auditData = {};
  const worksheetMatrix: any[][] = [];
  const cogsMatrix: any[][] = [];

  // Keyed by label
  const ancestorPackages: Map<string, IIndexedPackageData> = new Map();

  // Keyed by production batch
  const productionBatchPackages: Map<string, IIndexedPackageData> = new Map();

  //   function recursiveSourcePackageMatch(label: string) {
  //     const pkg = packageLabelMap.get(label);

  //     if (!pkg) {
  //       throw new Error(`Unmatched package: ${label}`);
  //     }

  //     ancestorPackages.set(pkg.Label, pkg);

  //     if (pkg.ProductionBatchNumber.length === 0) {
  //       // This is not a PB, recurse
  //       console.log(pkg);
  //       pkg.SourcePackageLabels.split(",")
  //         .map((x) => x.trim())
  //         .map((label) => recursiveSourcePackageMatch(label));
  //     } else {
  //       // This is a PB, add to PB map and return
  //       productionBatchPackages.set(pkg.ProductionBatchNumber, pkg);
  //     }
  //   }

  for (const transfer of richOutgoingTransfers) {
    const manifestNumber = transfer.ManifestNumber;

    for (const destination of transfer.outgoingDestinations || []) {
      for (const pkg of destination.packages || []) {
        const sourcePackageLabels: string[] = pkg.SourcePackageLabels.split(",").map((x) =>
          x.trim()
        );

        const matchedSourcePackages: IIndexedPackageData[] = sourcePackageLabels
          .filter((x) => packageLabelMap.has(x))
          .map((x) => packageLabelMap.get(x)!);

        if (matchedSourcePackages.length !== sourcePackageLabels.length) {
          console.error("Unable to match one or more source packages");
        }

        matchedSourcePackages.map((pkg) => ancestorPackages.set(pkg.Label, pkg));

        for (const pkg of matchedSourcePackages) {
        }

        const sourceProductionBatchNumbers: string[] = matchedSourcePackages.map(
          (pkg) => pkg.SourceProductionBatchNumbers || pkg.ProductionBatchNumber
        );

        const sourceProductionBatchPackages: IIndexedPackageData[] = sourceProductionBatchNumbers
          .filter((x) => productionBatchMap.has(x))
          .map((x) => productionBatchMap.get(x)!);

        // Add to both maps
        sourceProductionBatchPackages.map((pkg) => ancestorPackages.set(pkg.Label, pkg));
        sourceProductionBatchPackages.map((pkg) =>
          productionBatchPackages.set(pkg.ProductionBatchNumber, pkg)
        );
      }
    }
  }

  const historyPromises: Promise<any>[] = [];

  for (const pkg of ancestorPackages.values()) {
    const dataLoader = await getDataLoaderByLicense(pkg.LicenseNumber);

    historyPromises.push(
      dataLoader.packageHistoryByPackageId(pkg.Id).then((result) => {
        pkg.history = result;
      })
    );

    if (historyPromises.length % 100 === 0) {
      await Promise.allSettled(historyPromises);
    }
  }

  await Promise.allSettled(historyPromises);

  worksheetMatrix.push(["Package Tag", "Production Batch #", "Cost"]);

  for (const [label, pkg] of ancestorPackages) {
    if (pkg.ProductionBatchNumber.length > 0) {
      worksheetMatrix.push([pkg.Label, pkg.ProductionBatchNumber, 0]);
    }
  }

  cogsMatrix.push([
    "License",
    "Manifest #",
    "Package Tag",
    "Source Production Batch",
    "Item",
    "Quantity",
    "Units",
    "Multiplier",
    "Package COGS",
    "Unit COGS",
    "Note",
  ]);

  for (const transfer of richOutgoingTransfers) {
    const manifestNumber = transfer.ManifestNumber;

    for (const destination of transfer.outgoingDestinations || []) {
      for (const pkg of destination.packages || []) {
        const sourcePackageLabels: string[] = pkg.SourcePackageLabels.split(",").map((x) =>
          x.trim()
        );

        if (sourcePackageLabels.length !== 1) {
          cogsMatrix.push([
            getLabelOrError(pkg),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            `Invalid src package count: ${sourcePackageLabels.length}`,
          ]);
          continue;
        }

        const [sourcePackageLabel] = sourcePackageLabels;

        if (!ancestorPackages.has(sourcePackageLabel)) {
          cogsMatrix.push([
            getLabelOrError(pkg),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            `Missing src package: ${sourcePackageLabel}`,
          ]);
          continue;
        }

        const sourcePackage: IIndexedPackageData = ancestorPackages.get(sourcePackageLabel)!;

        // This is the source PB.
        const tagQuantityUnitSets = extractChildPackageTagQuantityUnitSetsFromHistory(
          sourcePackage.history!
        );

        const childPackageQuantity = tagQuantityUnitSets.find(
          (x) => x[0] === getLabelOrError(pkg)
        )!;

        const initialQuantity = extractInitialPackageQuantityAndUnitFromHistoryOrError(
          sourcePackage.history!
        );

        const sourcePackageMultiplier = childPackageQuantity[1] / initialQuantity[0];

        if (sourcePackage.ProductionBatchNumber.length > 0) {
          // "License",
          // "Manifest #",
          // "Package Tag",
          // "Source Production Batch",
          // "Item",
          // "Quantity",
          // "Units",
          // "Multiplier",
          // "Package COGS",
          // "Unit COGS",
          // "Note",
          cogsMatrix.push([
            pkg.LicenseNumber,
            manifestNumber,
            getLabelOrError(pkg),
            sourcePackage.ProductionBatchNumber,
            pkg.ProductName,
            pkg.ShippedQuantity,
            pkg.ShippedUnitOfMeasureAbbreviation,
            `=${sourcePackageMultiplier}`,
            `=INDIRECT(ADDRESS(ROW(), COLUMN()-1)) * VLOOKUP("${getLabelOrError(
              sourcePackage
            )}", Worksheet!A:C, 3, FALSE)`,
            `=INDIRECT(ADDRESS(ROW(), COLUMN()-1)) / ${pkg.ShippedQuantity}`,
            null,
          ]);
        } else {
          // One more hop to the source PB

          const sourceProductionBatchNames: string[] =
            sourcePackage.SourceProductionBatchNumbers.split(",").map((x) => x.trim());

          if (sourceProductionBatchNames.length !== 1) {
            cogsMatrix.push([
              getLabelOrError(pkg),
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              `Invalid pb count: ${sourceProductionBatchNames.length}`,
            ]);
            continue;
          }

          const [sourceProductionBatchName] = sourceProductionBatchNames;

          const pbPackage = productionBatchMap.get(sourceProductionBatchName)!;

          if (!pbPackage) {
            cogsMatrix.push([
              getLabelOrError(pkg),
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              `Missing pb package: ${sourceProductionBatchName}`,
            ]);
            continue;
          }

          let note = "";

          if (pbPackage.Item.Name !== sourcePackage.Item.Name) {
            note = `Source Production Batch item mismatch: ${pbPackage.Item.Name} / ${sourcePackage.Item.Name}`;
          }

          const initialSourceQuantity = extractInitialPackageQuantityAndUnitFromHistoryOrError(
            sourcePackage.history!
          );

          const initialPbQuantity = extractInitialPackageQuantityAndUnitFromHistoryOrError(
            pbPackage.history!
          );

          const pbPackageMultiplier = initialSourceQuantity[0] / initialPbQuantity[0];

          // "License",
          // "Manifest #",
          // "Package Tag",
          // "Source Production Batch",
          // "Item",
          // "Quantity",
          // "Units",
          // "Multiplier",
          // "Package COGS",
          // "Unit COGS",
          // "Note",
          cogsMatrix.push([
            pkg.LicenseNumber,
            manifestNumber,
            getLabelOrError(pkg),
            pbPackage.ProductionBatchNumber,
            pkg.ProductName,
            pkg.ShippedQuantity,
            pkg.ShippedUnitOfMeasureAbbreviation,
            `=${sourcePackageMultiplier} * ${pbPackageMultiplier}`,
            `=INDIRECT(ADDRESS(ROW(), COLUMN()-1)) * VLOOKUP("${getLabelOrError(
              pbPackage
            )}", Worksheet!A:C, 3, FALSE)`,
            `=INDIRECT(ADDRESS(ROW(), COLUMN()-1)) / ${pkg.ShippedQuantity}`,
            note,
          ]);
        }
      }
    }
  }

  reportData[ReportType.COGS_V2] = {
    auditData,
    worksheetMatrix,
    cogsMatrix,
  };
}

export async function createCogsV2SpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.COGS_V2]) {
    throw new Error("Missing COGS data");
  }

  const sheetTitles = [SheetTitles.OVERVIEW, SheetTitles.WORKSHEET, SheetTitles.MANIFEST_COGS];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `COGS - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  if (!response.data.success) {
    throw new Error("Unable to create COGS sheet");
  }

  let formattingRequests: any = [
    addRowsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      length: 20,
    }),
    styleTopRowRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
    }),
  ];

  const { worksheetMatrix, cogsMatrix, auditData } = reportData[ReportType.COGS_V2]!;

  const worksheetSheetId = sheetTitles.indexOf(SheetTitles.WORKSHEET);
  const manifestSheetId = sheetTitles.indexOf(SheetTitles.MANIFEST_COGS);

  formattingRequests = [
    ...formattingRequests,
    // Worksheet
    addRowsRequestFactory({ sheetId: worksheetSheetId, length: worksheetMatrix.length }),
    styleTopRowRequestFactory({ sheetId: worksheetSheetId }),
    freezeTopRowRequestFactory({ sheetId: worksheetSheetId }),
    // Manifest COGS
    addRowsRequestFactory({ sheetId: manifestSheetId, length: cogsMatrix.length }),
    styleTopRowRequestFactory({ sheetId: manifestSheetId }),
    freezeTopRowRequestFactory({ sheetId: manifestSheetId }),
  ];

  await messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: formattingRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [
        [],
        [],
        ...Object.entries(auditData).map(([key, value]) => ["", key, JSON.stringify(value)]),
      ],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Writing worksheet data...`, level: "success" },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.WORKSHEET,
    data: worksheetMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 1,
    },
  });

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Writing manifest data...`, level: "success" },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.MANIFEST_COGS,
    data: cogsMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 1,
    },
  });

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Resizing sheets...`, level: "success" },
  });

  let resizeRequests: any[] = [
    autoResizeDimensionsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      dimension: "COLUMNS",
    }),
  ];

  resizeRequests = [
    ...resizeRequests,
    autoResizeDimensionsRequestFactory({
      sheetId: worksheetSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: manifestSheetId,
    }),
  ];

  // This is incredibly slow for huge sheets, don't wait for it to finish
  messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: resizeRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  return response.data.result;
}
