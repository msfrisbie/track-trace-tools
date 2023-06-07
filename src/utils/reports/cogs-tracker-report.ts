import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import {
  IIndexedPackageData,
  IPackageFilter,
  IPluginState,
  ISpreadsheet,
  ITransferFilter,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { isodateToSlashDate, todayIsodate } from "../date";
import {
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractParentPackageTagQuantityUnitItemSetsFromHistory,
  extractTestSamplePackageLabelsFromHistory,
} from "../history";
import {
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  freezeTopRowRequestFactory,
  styleTopRowRequestFactory,
} from "../sheets";
import { writeDataSheet } from "../sheets-export";

interface ICogsTrackerReportFormFilters {
  cogsTrackerDateGt: string;
  cogsTrackerDateLt: string;
}

export const cogsTrackerFormFiltersFactory: () => ICogsTrackerReportFormFilters = () => ({
  cogsTrackerDateGt: todayIsodate(),
  cogsTrackerDateLt: todayIsodate(),
});

export function addCogsTrackerReport({
  reportConfig,
  cogsTrackerFormFilters,
}: {
  reportConfig: IReportConfig;
  cogsTrackerFormFilters: ICogsTrackerReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};
  const transferFilter: ITransferFilter = {};

  packageFilter.packagedDateGt = cogsTrackerFormFilters.cogsTrackerDateGt;
  packageFilter.packagedDateLt = cogsTrackerFormFilters.cogsTrackerDateLt;

  reportConfig[ReportType.COGS_TRACKER] = {
    packageFilter,
    fields: null,
  };
}

export async function maybeLoadCogsTrackerReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.COGS_TRACKER]) {
    return;
  }

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Loading package data...`, level: "success" },
  });

  let allPackages: IIndexedPackageData[] = [];

  const promises: Promise<any>[] = [
    primaryDataLoader
      .activePackages()
      .then((result) => (allPackages = [...allPackages, ...result])),
    primaryDataLoader
      .onHoldPackages()
      .then((result) => (allPackages = [...allPackages, ...result])),
    primaryDataLoader
      .inactivePackages()
      .then((result) => (allPackages = [...allPackages, ...result])),
  ];

  await Promise.allSettled(promises);

  const dateFilteredPackages = allPackages.filter((pkg) => {
    if (pkg.PackagedDate < reportConfig[ReportType.COGS_TRACKER]!.packageFilter.packagedDateGt!) {
      return false;
    }

    if (pkg.PackagedDate > reportConfig[ReportType.COGS_TRACKER]!.packageFilter.packagedDateLt!) {
      return false;
    }

    return true;
  });

  const historyPromises: Promise<any>[] = dateFilteredPackages.map((pkg) =>
    primaryDataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
      pkg.history = history;
    })
  );

  await Promise.allSettled(historyPromises);

  const bulkInfusedMatrix: any[][] = [];
  const distRexCogsMatrix: any[][] = [];
  const packagedGoodsCogsMatrix: any[][] = [];

  const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const ordinalHeaders = ordinals
    .map((ordinal) => [
      `${ordinal} Input Tag`,
      `${ordinal} Name`,
      `${ordinal} Weight Used For Combination`,
      `${ordinal} $/g`,
    ])
    .flat();

  const srcHeaders = [
    "Item",
    "Tag",
    "Source Packages",
    "JV/CM",
    "Production Batch Number",
    "Category",
    "Packaged Date",
    "Source Harvests",
    "Starting Quantity",
    "Input Material COGS",
    "Number of Test Samples Pulled",
    "Weight Post Test If Applicable",
    "Test Cost",
    "Tested $/G",
    "Cost Basis Value for Package",
    "Notes",
    ...ordinalHeaders,
  ];

  const packagedHeaders = [
    "Tag",
    "Item",
    "Category",
    "Sub-Category",
    "JV/CM/Int",
    "Packaged Date",
    "Starting Quantity (ea)",
    "Cost Basis of Whole Lot",
    "Tag of Bulk Input",
    "Tested $/G From Bulk Tag",
    "gram weight / unit of finished goods",
  ];

  bulkInfusedMatrix.push(srcHeaders);
  distRexCogsMatrix.push(srcHeaders);
  packagedGoodsCogsMatrix.push(packagedHeaders);

  const bulkInfusedPackages = dateFilteredPackages.filter(
    (pkg) =>
      pkg.Item.ProductCategoryName.includes("Bulk") &&
      !pkg.Item.ProductCategoryName.includes("Shake/Trim") &&
      !pkg.Item.ProductCategoryName.includes("Bulk Flower")
  );
  const distRexCogsPackages = dateFilteredPackages.filter(
    (pkg) =>
      pkg.Item.ProductCategoryName.includes("Bulk") &&
      !pkg.Item.ProductCategoryName.includes("Shake/Trim") &&
      !pkg.Item.ProductCategoryName.includes("Bulk Flower")
  );
  const packagedGoodsCogsPackages = dateFilteredPackages.filter(
    (pkg) => pkg.UnitOfMeasureQuantityType === "CountBased"
  );

  function cogsTrackerInputRowFactory(pkg: IIndexedPackageData): any[] {
    const initialWeightData = extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history!);
    const testLabels = extractTestSamplePackageLabelsFromHistory(pkg.history!);
    const parentTagQuantityUnitItemSets = extractParentPackageTagQuantityUnitItemSetsFromHistory(
      pkg.history!
    );
    const childTagQuantityUnitItemSets = extractChildPackageTagQuantityUnitSetsFromHistory(
      pkg.history!
    );

    const testMaterialWeightSum = testLabels
      .map(
        (testLabel) =>
          (childTagQuantityUnitItemSets.find((x) => x[0] === testLabel) ?? [null, 0, null])[1]
      )
      .reduce((a, b) => a + b, 0);

    const sourceValues: [string, string, number, string][] = parentTagQuantityUnitItemSets.map(
      ([label, quantity, unit, itemName]) => {
        return [label, itemName, quantity, ""];
      }
    );

    return [
      pkg.Item.Name,
      pkg.Label,
      pkg.SourcePackageLabels,
      "",
      pkg.ProductionBatchNumber,
      pkg.Item.ProductCategoryName,
      isodateToSlashDate(pkg.PackagedDate),
      pkg.SourceHarvestNames,
      initialWeightData[0], // starting quantity
      "", // input material COGS
      testLabels.length,
      testMaterialWeightSum > 0 ? initialWeightData[0] - testMaterialWeightSum : "", // Weight post test if applicable
      "", // test costs
      "", // tested $/g
      "", // cost basis value
      "", // notes
      ...sourceValues.flat(),
    ];
  }

  function cogsTrackerOutputRowFactory(pkg: IIndexedPackageData): any[] {
    const initialWeightData = extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history!);

    return [
      pkg.Label,
      pkg.Item.Name,
      pkg.Item.ProductCategoryName,
      "",
      "",
      isodateToSlashDate(pkg.PackagedDate),
      initialWeightData[0],
      "",
      pkg.SourcePackageLabels,
      "",
      pkg.Item.UnitWeight,
    ];
  }

  bulkInfusedPackages.map((pkg) => bulkInfusedMatrix.push(cogsTrackerInputRowFactory(pkg)));
  distRexCogsPackages.map((pkg) => distRexCogsMatrix.push(cogsTrackerInputRowFactory(pkg)));
  packagedGoodsCogsPackages.map((pkg) =>
    packagedGoodsCogsMatrix.push(cogsTrackerOutputRowFactory(pkg))
  );

  reportData[ReportType.COGS_TRACKER] = {
    bulkInfusedMatrix,
    distRexCogsMatrix,
    packagedGoodsCogsMatrix,
  };
}

export async function createCogsTrackerSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.COGS_TRACKER]) {
    throw new Error("Missing COGS data");
  }

  const sheetTitles = [
    SheetTitles.OVERVIEW,
    SheetTitles.BULK_INFUSED_GOODS_COGS,
    SheetTitles.DIST_REX_COGS,
    SheetTitles.PACKAGED_GOODS_COGS,
  ];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `COGS Tracker - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  if (!response.data.success) {
    throw new Error("Unable to create COGS tracker sheet");
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

  const { bulkInfusedMatrix, distRexCogsMatrix, packagedGoodsCogsMatrix } =
    reportData[ReportType.COGS_TRACKER]!;

  const bulkInfusedSheetId = sheetTitles.indexOf(SheetTitles.BULK_INFUSED_GOODS_COGS);
  const distRexCogsSheetId = sheetTitles.indexOf(SheetTitles.DIST_REX_COGS);
  const packagedGoodsCogsSheetId = sheetTitles.indexOf(SheetTitles.PACKAGED_GOODS_COGS);

  formattingRequests = [
    ...formattingRequests,
    // Bulk Infused COGS
    addRowsRequestFactory({ sheetId: bulkInfusedSheetId, length: bulkInfusedMatrix.length }),
    styleTopRowRequestFactory({ sheetId: bulkInfusedSheetId }),
    freezeTopRowRequestFactory({ sheetId: bulkInfusedSheetId }),
    // Dist/Rex COGS
    addRowsRequestFactory({ sheetId: distRexCogsSheetId, length: distRexCogsMatrix.length }),
    styleTopRowRequestFactory({ sheetId: distRexCogsSheetId }),
    freezeTopRowRequestFactory({ sheetId: distRexCogsSheetId }),
    // Packaged Goods COGS
    addRowsRequestFactory({
      sheetId: packagedGoodsCogsSheetId,
      length: packagedGoodsCogsMatrix.length,
    }),
    styleTopRowRequestFactory({ sheetId: packagedGoodsCogsSheetId }),
    freezeTopRowRequestFactory({ sheetId: packagedGoodsCogsSheetId }),
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
        [null, `Start date:`, reportConfig[ReportType.COGS_TRACKER]?.packageFilter.packagedDateGt],
        [null, `End date:`, reportConfig[ReportType.COGS_TRACKER]?.packageFilter.packagedDateLt],
      ],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Writing report data...`, level: "success" },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.BULK_INFUSED_GOODS_COGS,
    data: bulkInfusedMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 10,
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.DIST_REX_COGS,
    data: distRexCogsMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 10,
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.PACKAGED_GOODS_COGS,
    data: packagedGoodsCogsMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 10,
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
      sheetId: bulkInfusedSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: distRexCogsSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: packagedGoodsCogsSheetId,
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
