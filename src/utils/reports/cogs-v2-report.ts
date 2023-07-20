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
import { extractInitialPackageQuantityAndUnitFromHistoryOrError } from "../history";
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

  worksheetMatrix.push([
    "Manifest #",
    "Package Label",
    "Package Unit",
    "Source Packages",
    "Matched src packages",
    "Matched src package count",
    "Matched src package units",
    "Unmatched src packages",
    "Unmatched src package count",
    "Source Production Batches",
    "Matched production batches",
    "Matched production batch count",
    "Matched produciton batch units",
    "Unmatched production batches",
    "Unmatched production batch count",
  ]);

  const productionBatchPackages: Set<IIndexedPackageData> = new Set();

  for (const transfer of richOutgoingTransfers) {
    const manifestNumber = transfer.ManifestNumber;

    for (const destination of transfer.outgoingDestinations || []) {
      for (const pkg of destination.packages || []) {
        const sourcePackageLabels: string[] = pkg.SourcePackageLabels.split(",");

        const matchedSourcePackages: IIndexedPackageData[] = sourcePackageLabels
          .filter((x) => packageLabelMap.has(x))
          .map((x) => packageLabelMap.get(x)!);
        const matchedSourcePackageLabels: string = matchedSourcePackages
          .map((x) => x.Label)
          .join(",");
        const unmatchedSourcePackages: string = sourcePackageLabels
          .filter((x) => !packageLabelMap.has(x))
          .join(",");
        const matchedSourcePackageUnits: string = matchedSourcePackages
          .map((pkg) => pkg.UnitOfMeasureAbbreviation)
          .join(",");

        const sourceProductionBatchNumbers: string[] = matchedSourcePackages.map(
          (pkg) => pkg.SourceProductionBatchNumbers || pkg.ProductionBatchNumber
        );
        const sourceProductionBatches: string = sourceProductionBatchNumbers.join(",");

        const matchedSourceProductionBatchPackages: IIndexedPackageData[] =
          sourceProductionBatchNumbers
            .filter((x) => productionBatchMap.has(x))
            .map((x) => productionBatchMap.get(x)!);

        for (const pkg of matchedSourceProductionBatchPackages) {
          productionBatchPackages.add(pkg);
        }

        const matchedSourceProductionBatchNumbers: string = matchedSourceProductionBatchPackages
          .map((x) => x.ProductionBatchNumber)
          .join(",");
        const matchedSourceProductionBatchUnits: string = matchedSourceProductionBatchPackages
          .map((pkg) => pkg.UnitOfMeasureAbbreviation)
          .join(",");
        const unmatchedSourceProductionBatchNumbers: string = sourceProductionBatchNumbers
          .filter((x) => !productionBatchMap.has(x))
          .join(",");

        const row: string[] = [
          //   "Manifest #",
          manifestNumber,
          //   "Package Label",
          pkg.PackageLabel,
          //   "Package Unit",
          pkg.ShippedUnitOfMeasureAbbreviation,
          //   "Source Packages",
          pkg.SourcePackageLabels,
          //   "Matched src packages",
          matchedSourcePackageLabels,
          //   "Matched src package count",
          matchedSourcePackageLabels
            .split(",")
            .filter((x) => x.length > 0)
            .length.toString(),
          //   "Matched src package units",
          matchedSourcePackageUnits,
          //   "Unmatched src packages",
          unmatchedSourcePackages,
          //   "Unmatched src package count",
          unmatchedSourcePackages
            .split(",")
            .filter((x) => x.length > 0)
            .length.toString(),
          //   "Source Production Batches",
          sourceProductionBatches,
          //   "Matched production batches",
          matchedSourceProductionBatchNumbers,
          //   "Matched production batch count",
          matchedSourceProductionBatchNumbers
            .split(",")
            .filter((x) => x.length > 0)
            .length.toString(),
          //   "Matched produciton batch units",
          matchedSourceProductionBatchUnits,
          //   "Unmatched production batches",
          unmatchedSourceProductionBatchNumbers,
          //   "Unmatched production batch count",
          unmatchedSourceProductionBatchNumbers
            .split(",")
            .filter((x) => x.length > 0)
            .length.toString(),
        ];

        if (row.length !== 15) {
          console.error(row);
          throw new Error("Bad row length");
        }

        worksheetMatrix.push(row);
      }
    }
  }

  for (const pkg of productionBatchPackages) {
    const dataLoader = await getDataLoaderByLicense(pkg.LicenseNumber);

    pkg.history = await dataLoader.packageHistoryByPackageId(pkg.Id);

    const initialQuantity = extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history);

    cogsMatrix.push([
      pkg.LicenseNumber,
      pkg.Label,
      pkg.ProductionBatchNumber,
      pkg.Item.Name,
      ...initialQuantity,
      pkg.PackagedDate,
    ]);
  }

  console.log({ worksheetMatrix });

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
