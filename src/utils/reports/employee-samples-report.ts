import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import {
  IIndexedPackageData,
  IMetrcEmployeeData,
  IPackageFilter,
  IPluginState,
  ISpreadsheet,
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
import { normalizeIsodate, todayIsodate } from "../date";
import {
  getAllocatedSamplesFromPackageHistoryOrError,
  toNormalizedAllocationQuantity,
} from "../employee";
import { extractInitialPackageQuantityAndUnitFromHistoryOrError } from "../history";
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
  let employees: IMetrcEmployeeData[] = [];

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
    primaryDataLoader.employees().then((result) => {
      employees = result;
    }),
  ];

  await Promise.allSettled(promises);

  const filteredPackages = allPackages.filter((pkg) => {
    if (
      pkg.LastModified < reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateGt!
    ) {
      return false;
    }

    if (
      pkg.PackagedDate > reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateLt!
    ) {
      return false;
    }

    if (!pkg.IsTradeSample) {
      return false;
    }

    return true;
  });

  const historyPromises: Promise<any>[] = filteredPackages.map((pkg) =>
    primaryDataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
      pkg.history = history;
    })
  );

  await Promise.allSettled(historyPromises);

  let employeeSamplesMatrix: any[][] = [
    [
      "Employee Name",
      "Employee ID",
      "Adjustment Date",
      "Package Label",
      "Item",
      "Adjustment Quantity",
      "Units",
      "Flower allocation (g)",
      "Concentrate allocation (g)",
      "Infused allocation (mg)",
    ],
  ];

  let employeeData: Map<string, any[]> = new Map();

  for (const pkg of filteredPackages) {
    for (const allocationData of getAllocatedSamplesFromPackageHistoryOrError(pkg)) {
      const normalizedAllocationQuantity = await toNormalizedAllocationQuantity(
        pkg,
        allocationData.quantity
      );

      if (!employeeData.has(allocationData.employeeName)) {
        employeeData.set(allocationData.employeeName, []);
      }

      employeeData
        .get(allocationData.employeeName)!
        .push([
          allocationData.employeeName,
          allocationData.employeeLicenseNumber,
          allocationData.isodate,
          allocationData.packageLabel,
          pkg.Item.Name,
          allocationData.quantity,
          allocationData.unitOfMeasureName,
          normalizedAllocationQuantity.flowerAllocationGrams,
          normalizedAllocationQuantity.concentrateAllocationGrams,
          normalizedAllocationQuantity.infusedAllocationGrams * 1000,
        ]);
    }
  }

  for (const [key, rows] of [...employeeData.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.sort((a, b) => a[3].localeCompare(b[3]));

    for (const row of rows) {
      employeeSamplesMatrix.push(row);
    }

    employeeSamplesMatrix.push(
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `=SUM(H${employeeSamplesMatrix.length - rows.length + 1}:H${employeeSamplesMatrix.length})`,
        `=SUM(I${employeeSamplesMatrix.length - rows.length + 1}:I${employeeSamplesMatrix.length})`,
        `=SUM(J${employeeSamplesMatrix.length - rows.length + 1}:J${employeeSamplesMatrix.length})`,
      ],
      []
    );
  }

  let receivedSamplesMatrix: any[][] = [];

  for (const pkg of filteredPackages) {
    if (!pkg.ReceivedDateTime) {
      continue;
    }

    if (
      pkg.ReceivedDateTime <
      reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateGt!
    ) {
      continue;
    }

    if (
      pkg.ReceivedDateTime >
      reportConfig[ReportType.EMPLOYEE_SAMPLES]!.packageFilter.packagedDateLt!
    ) {
      continue;
    }

    receivedSamplesMatrix.push([
      normalizeIsodate(pkg.ReceivedDateTime),
      pkg.Label,
      pkg.Item.Name,
      ...extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history!),
    ]);
  }

  receivedSamplesMatrix.sort((a, b) => a[0].localeCompare(b[0]));

  receivedSamplesMatrix = [
    ["Received Date", "Package Label", "Item", "Quantity", "Units"],
    ...receivedSamplesMatrix,
  ];

  reportData[ReportType.EMPLOYEE_SAMPLES] = {
    employeeSamplesMatrix,
    receivedSamplesMatrix,
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

  const sheetTitles = [
    SheetTitles.OVERVIEW,
    SheetTitles.EMPLOYEE_SAMPLES,
    SheetTitles.RECEIVED_SAMPLES,
  ];

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

  const { employeeSamplesMatrix, receivedSamplesMatrix } = reportData[ReportType.EMPLOYEE_SAMPLES]!;

  const employeeSamplesSheetId = sheetTitles.indexOf(SheetTitles.EMPLOYEE_SAMPLES);
  const receivedSamplesSheetId = sheetTitles.indexOf(SheetTitles.RECEIVED_SAMPLES);

  formattingRequests = [
    ...formattingRequests,
    addRowsRequestFactory({
      sheetId: employeeSamplesSheetId,
      length: employeeSamplesMatrix.length,
    }),
    styleTopRowRequestFactory({ sheetId: employeeSamplesSheetId }),
    freezeTopRowRequestFactory({ sheetId: employeeSamplesSheetId }),
    addRowsRequestFactory({
      sheetId: receivedSamplesSheetId,
      length: receivedSamplesMatrix.length,
    }),
    styleTopRowRequestFactory({ sheetId: receivedSamplesSheetId }),
    freezeTopRowRequestFactory({ sheetId: receivedSamplesSheetId }),
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

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.RECEIVED_SAMPLES,
    data: receivedSamplesMatrix,
    options: {
      pageSize: 5000,
      valueInputOption: "USER_ENTERED",
      maxParallelRequests: 10,
    },
  });

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Resizing sheets...`, level: "success" },
  });

  let resizeRequests: any[] = [];

  resizeRequests = [
    ...resizeRequests,
    autoResizeDimensionsRequestFactory({
      sheetId: employeeSamplesSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: receivedSamplesSheetId,
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
