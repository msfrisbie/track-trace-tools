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
import { todayIsodate } from "../date";
import {
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractTagQuantityUnitSetsFromHistory,
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
  const inputCogsMatrix: any[][] = [];

  const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const ordinalHeaders = ordinals
    .map((ordinal) => [
      `${ordinal} Input Tag`,
      `${ordinal} Name`,
      `${ordinal} Weight Used For Combination`,
      `${ordinal} $/g`,
    ])
    .flat();

  const headers = [
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
    "Weight Post Test If Applicable",
    "Test Cost",
    "Tested $/G",
    "Cost Basis Value for Package",
    "Notes",
    ...ordinalHeaders,
  ];

  bulkInfusedMatrix.push(headers);
  inputCogsMatrix.push(headers);

  const bulkInfusedPackages = dateFilteredPackages.filter((pkg) =>
    pkg.Item.ProductCategoryName.includes("Bulk")
  );
  const inputCogsPackages = dateFilteredPackages.filter(
    (pkg) => !pkg.Item.ProductCategoryName.includes("Bulk")
  );

  function cogsTrackerRowFactory(pkg: IIndexedPackageData): any[] {
    const initialWeightData = extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history!);
    const testLabels = extractTestSamplePackageLabelsFromHistory(pkg.history!);
    const tagQuantityUnitSets = extractTagQuantityUnitSetsFromHistory(pkg.history!);

    const testMaterialWeightSum = testLabels
      .map(
        (testLabel) => (tagQuantityUnitSets.find((x) => x[0] === testLabel) ?? [null, 0, null])[1]
      )
      .reduce((a, b) => a + b, 0);

    const sourceValues: [string, string, number, string][] = tagQuantityUnitSets.map(
      ([label, quantity, unit]) => [
        label,
        allPackages.find((x) => x.Label)!.Item.Name,
        quantity,
        "",
      ]
    );

    return [
      pkg.Item.Name,
      pkg.Label,
      pkg.SourcePackageLabels,
      "",
      pkg.ProductionBatchNumber,
      pkg.Item.ProductCategoryName,
      pkg.PackagedDate,
      pkg.SourceHarvestNames,
      initialWeightData[0], // starting quantity
      "", // input material COGS
      testMaterialWeightSum > 0 ? initialWeightData[0] - testMaterialWeightSum : "", // Weight post test if applicable
      "", // test costs
      "", // tested $/g
      "", // cost basis value
      "", // notes
      ...sourceValues.flat(),
    ];
  }

  bulkInfusedPackages.map((pkg) => bulkInfusedMatrix.push(cogsTrackerRowFactory(pkg)));
  inputCogsPackages.map((pkg) => inputCogsMatrix.push(cogsTrackerRowFactory(pkg)));

  reportData[ReportType.COGS_TRACKER] = {
    bulkInfusedMatrix,
    inputCogsMatrix,
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
    SheetTitles.INPUT_COGS,
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

  const { bulkInfusedMatrix, inputCogsMatrix } = reportData[ReportType.COGS_TRACKER]!;

  const bulkInfusedSheetId = sheetTitles.indexOf(SheetTitles.BULK_INFUSED_GOODS_COGS);
  const inputCogsSheetId = sheetTitles.indexOf(SheetTitles.INPUT_COGS);

  formattingRequests = [
    ...formattingRequests,
    // Bulk Infused
    addRowsRequestFactory({ sheetId: bulkInfusedSheetId, length: bulkInfusedMatrix.length }),
    styleTopRowRequestFactory({ sheetId: bulkInfusedSheetId }),
    freezeTopRowRequestFactory({ sheetId: bulkInfusedSheetId }),
    // Input COGS
    addRowsRequestFactory({ sheetId: inputCogsSheetId, length: inputCogsMatrix.length }),
    styleTopRowRequestFactory({ sheetId: inputCogsSheetId }),
    freezeTopRowRequestFactory({ sheetId: inputCogsSheetId }),
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
    spreadsheetTitle: SheetTitles.INPUT_COGS,
    data: inputCogsMatrix,
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
      sheetId: inputCogsSheetId,
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
