import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import {
  ICsvFile,
  IDestinationData,
  IDestinationPackageData,
  IIndexedTransferData,
  ISheetValues,
  ISpreadsheet,
  IValueRange,
} from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import {
  ALL_ELIGIBLE_REPORT_TYPES,
  FIELD_TRANSFORMER_REPORT_TYPES,
  ReportsMutations,
  ReportType,
} from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
} from "@/store/page-overlay/modules/reports/interfaces";
import { downloadCsvFile } from "./csv";
import { todayIsodate } from "./date";
import { createCogsSpreadsheetOrError } from "./reports/cogs-report";
import { createCogsTrackerSpreadsheetOrError } from "./reports/cogs-tracker-report";
import { createCogsV2SpreadsheetOrError } from "./reports/cogs-v2-report";
import { createEmployeeSamplesSpreadsheetOrError } from "./reports/employee-samples-report";
import { createHarvestPackagesReportOrError } from "./reports/harvest-packages-report";
import {
  extractFlattenedData,
  getSheetTitle,
  shouldGenerateReport,
} from "./reports/reports-shared";
import {
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  conditionalFormattingRequestFactory,
  freezeTopRowRequestFactory,
  shrinkFontRequestFactory,
  styleTopRowRequestFactory,
} from "./sheets";

export async function readSpreadsheet({
  spreadsheetId,
  sheetName,
}: {
  spreadsheetId: string;
  sheetName: string;
}) {
  return messageBus.sendMessageToBackground(
    MessageType.READ_SPREADSHEET_VALUES,
    {
      spreadsheetId,
      sheetName,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );
}

export async function appendSpreadsheetValues({
  spreadsheetId,
  range,
  values,
  valueInputOption,
}: {
  spreadsheetId: string;
  range: string;
  values: ISheetValues;
  valueInputOption?: "RAW" | "USER_ENTERED";
}) {
  await messageBus.sendMessageToBackground(
    MessageType.APPEND_SPREADSHEET_VALUES,
    {
      spreadsheetId,
      range,
      values,
      valueInputOption,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );
}

export async function writeDataSheet<T>({
  spreadsheetId,
  spreadsheetTitle,
  fields,
  data,
  options = {},
}: {
  spreadsheetId: string;
  spreadsheetTitle: SheetTitles;
  fields?: IFieldData[];
  data: T[];
  options?: {
    pageSize?: number;
    maxParallelRequests?: number;
    valueInputOption?: "RAW" | "USER_ENTERED";
    rangeStartColumn?: string;
    rangeEndColumn?: string;
    batchWrite?: boolean;
  };
}) {
  const mergedOptions = {
    pageSize: 10000,
    maxParallelRequests: 10,
    valueInputOption: "USER_ENTERED",
    rangeStartColumn: "A",
    rangeEndColumn: "",
    batchWrite: false,
    ...options,
  };

  let nextPageStartIdx = 0;
  let nextPageRowIdx = 1;

  if (fields) {
    await messageBus.sendMessageToBackground(
      MessageType.WRITE_SPREADSHEET_VALUES,
      {
        spreadsheetId,
        range: `'${spreadsheetTitle}'!1:1`,
        values: [fields.map((fieldData) => `     ${fieldData.readableName}     `)],
      },
      undefined,
      SHEETS_API_MESSAGE_TIMEOUT_MS
    );

    nextPageRowIdx += 1;
  }

  const promises = [];
  let batchRequests: IValueRange[] = [];

  while (true) {
    const nextPage = data.slice(nextPageStartIdx, nextPageStartIdx + mergedOptions.pageSize);
    if (nextPage.length === 0) {
      break;
    }

    const range = `'${spreadsheetTitle}'!${mergedOptions.rangeStartColumn}${nextPageRowIdx}:${
      mergedOptions.rangeEndColumn
    }${nextPageRowIdx + nextPage.length - 1}`;

    let values = nextPage;

    if (mergedOptions.batchWrite) {
      batchRequests.push({
        range,
        majorDimension: "ROWS",
        // @ts-ignore
        values,
      });
    } else {
      promises.push(
        messageBus.sendMessageToBackground(
          MessageType.WRITE_SPREADSHEET_VALUES,
          {
            spreadsheetId,
            range,
            values,
            valueInputOption: mergedOptions.valueInputOption,
          },
          undefined,
          SHEETS_API_MESSAGE_TIMEOUT_MS
        )
      );
    }

    nextPageStartIdx += nextPage.length;
    nextPageRowIdx += nextPage.length;

    if (
      (promises.length > 0 && promises.length % mergedOptions.maxParallelRequests === 0) ||
      (batchRequests.length > 0 && batchRequests.length % mergedOptions.maxParallelRequests === 0)
    ) {
      if (mergedOptions.batchWrite) {
        promises.push(
          messageBus.sendMessageToBackground(
            MessageType.BATCH_UPDATE_SPREADSHEET_VALUES,
            {
              spreadsheetId,
              data: batchRequests,
              valueInputOption: mergedOptions.valueInputOption,
            },
            undefined,
            SHEETS_API_MESSAGE_TIMEOUT_MS
          )
        );
      }

      for (const result of await Promise.allSettled(promises)) {
        if (result.status === "rejected") {
          throw new Error("Write failed");
        }
      }

      batchRequests = [];

      // Wait for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (mergedOptions.batchWrite) {
    promises.push(
      messageBus.sendMessageToBackground(
        MessageType.BATCH_UPDATE_SPREADSHEET_VALUES,
        {
          spreadsheetId,
          data: batchRequests,
          valueInputOption: mergedOptions.valueInputOption,
        },
        undefined,
        SHEETS_API_MESSAGE_TIMEOUT_MS
      )
    );
  }

  for (const result of await Promise.allSettled(promises)) {
    if (result.status === "rejected") {
      throw new Error("Write failed");
    }
  }
}

export async function createDebugSheetOrError({
  spreadsheetName,
  sheetTitles,
  sheetDataMatrixes,
}: {
  spreadsheetName: string;
  sheetTitles: string[];
  sheetDataMatrixes: any[][][];
}) {
  if (sheetTitles.length !== sheetDataMatrixes.length) {
    throw new Error("Sheet size mismatch");
  }

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `Debug - ${spreadsheetName} - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  if (!response.data.success) {
    throw new Error("Unable to create debug sheet");
  }

  for (const [idx, sheetTitle] of sheetTitles.entries()) {
    let formattingRequests: any = [
      addRowsRequestFactory({
        sheetId: idx,
        length: sheetDataMatrixes[idx].length,
      }),
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

    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: sheetTitle as SheetTitles,
      data: sheetDataMatrixes[idx],
      options: {
        valueInputOption: "RAW",
      },
    });
  }

  console.log(response.data);

  return response.data;
}

export async function createCsvOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  const flattenedCache = new Map<ReportType, any[]>();

  // Check that inputs are well-formed
  const ELIGIBLE_REPORT_TYPES: ReportType[] = ALL_ELIGIBLE_REPORT_TYPES.filter((reportType) =>
    shouldGenerateReport({ reportType, reportConfig, reportData })
  );

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const filename = `${getSheetTitle({ reportType })} - ${
      store.state.pluginAuth?.authState?.license
    } - ${todayIsodate()}`;

    let data: any[][] = extractFlattenedData({
      flattenedCache,
      reportType,
      reportData,
      reportConfig,
    });

    if (FIELD_TRANSFORMER_REPORT_TYPES.includes(reportType)) {
      const fields: IFieldData[] = reportConfig[reportType]!.fields!;

      data = [fields.map((fieldData) => fieldData.readableName), ...data];
    }

    const csvFile: ICsvFile = {
      filename,
      data,
    };

    downloadCsvFile({ csvFile, delay: 50 });
  }
}

export async function createSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  // Handle special cases
  if (reportConfig[ReportType.COGS]) {
    return createCogsSpreadsheetOrError({
      reportData,
      reportConfig,
    });
  }
  if (reportConfig[ReportType.COGS_V2]) {
    return createCogsV2SpreadsheetOrError({
      reportData,
      reportConfig,
    });
  }

  if (reportConfig[ReportType.COGS_TRACKER]) {
    return createCogsTrackerSpreadsheetOrError({
      reportData,
      reportConfig,
    });
  }

  if (reportConfig[ReportType.EMPLOYEE_SAMPLES]) {
    return createEmployeeSamplesSpreadsheetOrError({
      reportData,
      reportConfig,
    });
  }

  // if (reportConfig[ReportType.HARVEST_PACKAGES]) {
  //   return createHarvestPackagesReportOrError({
  //     reportData,
  //     reportConfig,
  //   });
  // }

  const flattenedCache = new Map<ReportType, any[]>();

  //
  // Check that inputs are well-formed
  //

  const ELIGIBLE_REPORT_TYPES: ReportType[] = ALL_ELIGIBLE_REPORT_TYPES.filter((reportType) =>
    shouldGenerateReport({ reportType, reportConfig, reportData })
  );

  //
  // Generate Sheets
  //

  const sheetTitles: SheetTitles[] = [
    SheetTitles.OVERVIEW,
    ...ELIGIBLE_REPORT_TYPES.map((reportType) => getSheetTitle({ reportType })),
  ];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `${store.state.pluginAuth?.authState?.license} Metrc Report - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  if (!response.data.success) {
    throw new Error("Unable to create export sheet");
  }

  //
  // Marshal Data Into Matrix
  // Format Sheet For Data
  //

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: "Formatting spreadsheet...", level: "success" },
  });

  let formattingRequests: any = [
    addRowsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      length: 20,
    }),
    styleTopRowRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
    }),
  ];

  // TODO report data should be pre-formatted before getting here

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const sheetId: number = sheetTitles.indexOf(getSheetTitle({ reportType }));
    const length = Math.max(
      extractFlattenedData({ flattenedCache, reportType, reportData, reportConfig }).length,
      1
    );

    formattingRequests = [
      ...formattingRequests,
      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  await messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: formattingRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  //
  // Write all values
  //

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
      statusMessage: { text: `Writing ${reportType}...`, level: "success" },
    });

    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: getSheetTitle({ reportType }),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData({ flattenedCache, reportType, reportData, reportConfig }),
    });
  }

  //
  // Generate Summary Sheet
  //

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Generating summary...`, level: "success" },
  });

  const summaryList = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    summaryList.push([
      `=HYPERLINK("#gid=${sheetTitles.indexOf(getSheetTitle({ reportType }))}","${getSheetTitle({
        reportType,
      })}")`,
      `=COUNTA('${getSheetTitle({ reportType })}'!A2:A)`,
      // `=COUNTIF('${SheetTitles.PACKAGES}'!C2:C, "ACTIVE")`,
    ]);
  }

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [[], [], ...summaryList],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  //
  // Resize
  //

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Resizing sheets...`, level: "success" },
  });

  let resizeRequests: any[] = [
    autoResizeDimensionsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      dimension: "COLUMNS",
    }),
  ];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    resizeRequests = [
      ...resizeRequests,
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(getSheetTitle({ reportType })),
      }),
    ];
  }

  // This is incredibly slow for huge sheets
  messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: resizeRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  // 3000ms grace period for all sheets
  await new Promise((resolve) => setTimeout(resolve, 3000));

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Cleaning up...`, level: "success" },
  });

  let shrinkFontRequests: any[] = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    shrinkFontRequests = [
      ...shrinkFontRequests,
      shrinkFontRequestFactory({
        sheetId: sheetTitles.indexOf(getSheetTitle({ reportType })),
      }),
    ];
  }

  await messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: shrinkFontRequests,
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

export async function createPackageCsvTemplateSheetOrError(
  columns: string[]
): Promise<ISpreadsheet> {
  const SHEET_TITLE = `Create Packages`;

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `Create Package CSV Template`,
      sheetTitles: [SHEET_TITLE],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SHEET_TITLE}'`,
      values: [columns],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  const sheetId = 0;

  const formattingRequests = [
    addRowsRequestFactory({ sheetId, length: 100 }),
    styleTopRowRequestFactory({ sheetId }),
    freezeTopRowRequestFactory({ sheetId }),
    autoResizeDimensionsRequestFactory({
      sheetId,
    }),
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

  return response.data.result;
}

export async function createScanSheetOrError(
  manifestNumber: string,
  licenseNumber: string,
  manifest: {
    pkg: IDestinationPackageData;
    destination?: IDestinationData;
    incomingTransfer?: IIndexedTransferData;
  }[]
): Promise<ISpreadsheet> {
  const SHEET_TITLE = `${manifestNumber} Scan Sheet`;

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `Manifest ${manifestNumber} Scan Sheet (${manifest.length} tags) - ${licenseNumber}`,
      sheetTitles: [SHEET_TITLE],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SHEET_TITLE}'`,
      values: [
        [
          "Destination",
          "    Package Contents    ",
          "                Package Tag                ",
          "                Scanned Tags                ",
        ],
        ...manifest.map((x) => [
          (x.destination! || x.incomingTransfer!).RecipientFacilityName + "      ",
          `${x.pkg.ShippedQuantity} ${x.pkg.ShippedUnitOfMeasureAbbreviation} ${x.pkg.ProductName}      `,
          x.pkg.PackageLabel,
        ]),
      ],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  const sheetId = 0;

  const formattingRequests = [
    addRowsRequestFactory({ sheetId, length: manifest.length + 2 }),
    styleTopRowRequestFactory({ sheetId }),
    freezeTopRowRequestFactory({ sheetId }),
    autoResizeDimensionsRequestFactory({
      sheetId,
    }),
    // First column: turn green if tag appears exactly twice anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: 2,
        endColumnIndex: 3,
        startRowIndex: 1,
      },
      customFormula: "=COUNTIF(C$2:D,C2)=2",
      backgroundColor: { green: 1 },
    }),
    // Second column: turn red if tag appeas exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: 2,
        endColumnIndex: 3,
        startRowIndex: 1,
      },
      customFormula: "=COUNTIF(C$2:D,C2)=1",
      backgroundColor: { red: 1 },
    }),
    // FIrst column: turn yellow if tag appears more than twice anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: 2,
        endColumnIndex: 3,
        startRowIndex: 1,
      },
      customFormula: "=COUNTIF($C$2:D,C2)>2",
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn yellow if tag appears more than once in the 2nd column
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: 3,
        endColumnIndex: 4,
        startRowIndex: 1,
      },
      customFormula: "=COUNTIF($D$2:D,D2)>1",
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn prange if tag appears exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: 3,
        endColumnIndex: 4,
        startRowIndex: 1,
      },
      customFormula: "=COUNTIF($C$2:D,D2)=1",
      backgroundColor: { red: 1, green: 0.64 },
    }),
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
      range: `'${SHEET_TITLE}'!A${manifest.length + 3}`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  return response.data.result;
}
