import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import { IIndexedPackageData, IPackageFilter, IPluginState, ISpreadsheet } from "@/interfaces";
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
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  freezeTopRowRequestFactory,
  styleTopRowRequestFactory,
} from "../sheets";
import { writeDataSheet } from "../sheets-export";

interface IEmployeeSamplesReportFormFilters {
  employeeSamplesDateGt: string;
  employeeSamplesDateLt: string;
}

export const employeeSamplesFormFiltersFactory: () => IEmployeeSamplesReportFormFilters = () => ({
  employeeSamplesDateGt: todayIsodate(),
  employeeSamplesDateLt: todayIsodate(),
});

export function addEmployeeSamplesReport({
  reportConfig,
  employeeSamplesFormFilters,
}: {
  reportConfig: IReportConfig;
  employeeSamplesFormFilters: IEmployeeSamplesReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};

  packageFilter.packagedDateGt = employeeSamplesFormFilters.employeeSamplesDateGt;
  packageFilter.packagedDateLt = employeeSamplesFormFilters.employeeSamplesDateLt;

  reportConfig[ReportType.EMPLOYEE_SAMPLES] = {
    packageFilter,
    fields: null,
  };
}

export async function maybeLoadEmployeeSamplesReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.EMPLOYEE_SAMPLES]) {
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
    if (
      pkg.PackagedDate < reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateGt!
    ) {
      return false;
    }

    if (
      pkg.PackagedDate > reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateLt!
    ) {
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

  const employeeSamplesMatrix: any[][] = [];

  reportData[ReportType.EMPLOYEE_SAMPLES] = {
    employeeSamplesMatrix,
  };
}

export async function createEmployeeSamplesSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.EMPLOYEE_SAMPLES]) {
    throw new Error("Missing employee samples data");
  }

  const sheetTitles = [SheetTitles.OVERVIEW, SheetTitles.EMPLOYEE_SAMPLES];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `Employee Samples - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  if (!response.data.success) {
    throw new Error("Unable to create employee samples sheet");
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

  const { employeeSamplesMatrix } = reportData[ReportType.EMPLOYEE_SAMPLES]!;

  const employeeSamplesSheetId = sheetTitles.indexOf(SheetTitles.EMPLOYEE_SAMPLES);

  formattingRequests = [
    ...formattingRequests,
    addRowsRequestFactory({
      sheetId: employeeSamplesSheetId,
      length: employeeSamplesMatrix.length,
    }),
    styleTopRowRequestFactory({ sheetId: employeeSamplesSheetId }),
    freezeTopRowRequestFactory({ sheetId: employeeSamplesSheetId }),
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
        [
          null,
          `Start date:`,
          reportConfig[ReportType.EMPLOYEE_SAMPLES]?.packageFilter.packagedDateGt,
        ],
        [
          null,
          `End date:`,
          reportConfig[ReportType.EMPLOYEE_SAMPLES]?.packageFilter.packagedDateLt,
        ],
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
    spreadsheetTitle: SheetTitles.EMPLOYEE_SAMPLES,
    data: employeeSamplesMatrix,
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
      sheetId: employeeSamplesSheetId,
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
