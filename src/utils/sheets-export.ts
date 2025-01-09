import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import {
  ICsvFile,
  IDestinationData,
  IDestinationPackageData,
  IIndexedTransferData,
  ISheetValues,
  ISpreadsheet,
  ITransporterData,
  IValueRange,
  IXlsxFile,
} from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { ReportType, ReportsMutations } from "@/store/page-overlay/modules/reports/consts";
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
import {
  extractFlattenedData,
  getCsvFilename,
  getSheetTitle,
  getSpreadsheetName,
  reportCatalogFactory,
  // reportCatalogFactory,
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
/* eslint-disable-next-line */
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { generateHtmlTag } from "./html";
import { downloadXlsxFile, emailXlsxFile } from "./xlsx";
import { createScanSheetSpreadsheetOrError } from "./reports/scan-sheet-report";

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
  spreadsheetTitle: string;
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

    const values = nextPage;

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
    const formattingRequests: any = [
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
  const ELIGIBLE_REPORT_TYPES: ReportType[] = reportCatalogFactory()
    .filter((x) => x.value && x.enabled)
    .map((x) => x.value as ReportType)
    .filter((reportType) => shouldGenerateReport({ reportType, reportConfig, reportData }));

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const filename = getCsvFilename({
      reportType,
      license: store.state.pluginAuth?.authState?.license,
      reportConfig,
    });

    let data: any[][] = extractFlattenedData({
      flattenedCache,
      reportType,
      reportData,
      reportConfig,
    });

    if (reportCatalogFactory().find((x) => x.value === reportType)!.usesFieldTransformer) {
      const fields: IFieldData[] = reportConfig[reportType]!.fields!;

      data = [fields.map((fieldData) => fieldData.readableName), ...data];
    }

    const csvFile: ICsvFile = {
      filename,
      data,
    };

    switch (reportConfig.fileDeliveryFormat) {
      case "DOWNLOAD":
        downloadCsvFile({ csvFile, delay: 50 });
        break;
      default:
        throw new Error(`Invalid file delivery format: ${reportConfig.fileDeliveryFormat}`);
    }
  }
}

export async function createXlsxOrError({
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
  const ELIGIBLE_REPORT_TYPES: ReportType[] = reportCatalogFactory()
    .filter((x) => x.value && x.enabled)
    .map((x) => x.value as ReportType)
    .filter((reportType) => shouldGenerateReport({ reportType, reportConfig, reportData }));

  const xlsxFile: IXlsxFile = {
    filename: getSpreadsheetName({
      reportConfig,
    }),
    sheets: [],
  };

  let extraHtml: string | null = null;

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const sheetName = getSheetTitle({
      reportType,
      reportConfig,
    });

    let data: any[][] = extractFlattenedData({
      flattenedCache,
      reportType,
      reportData,
      reportConfig,
    });

    if (reportCatalogFactory().find((x) => x.value === reportType)!.usesFieldTransformer) {
      const fields: IFieldData[] = reportConfig[reportType]!.fields!;

      data = [fields.map((fieldData) => fieldData.readableName), ...data];
    }

    let options;

    if (reportType === ReportType.INCOMING_MANIFEST_INVENTORY) {
      options = { table: true };
    }

    xlsxFile.sheets.push({
      sheetName,
      options,
      data,
    });

    if (reportType === ReportType.INCOMING_MANIFEST_INVENTORY) {
      const sharedAttributes = {
        // style: "text-align: left;",
      };

      let tableHtml: string = `
      <table style="margin: 36px 0px; text-align: left; border-spacing: 8px;">
        <tr style="color: blue">
          <th>Originating Facility</th>
          <th>Originating License</th>
          <th>Manifest #</th>
          <th>Total Packages</th>
        </tr>
      `;

      let totalPackages = 0;

      for (const richTransfer of reportData[ReportType.INCOMING_MANIFEST_INVENTORY]!
        .richIncomingTransfers!) {
        let cellsHtml: string = "";

        // Originating Entity
        cellsHtml += generateHtmlTag({
          tagType: "td",
          htmlContent: richTransfer.ShipperFacilityName,
          attributes: sharedAttributes,
        });
        cellsHtml += generateHtmlTag({
          tagType: "td",
          htmlContent: richTransfer.ShipperFacilityLicenseNumber,
          attributes: sharedAttributes,
        });

        const finalTransporter: ITransporterData = [...richTransfer.incomingTransporters!].pop()!;

        // Manifest Summary
        cellsHtml += generateHtmlTag({
          tagType: "td",
          htmlContent: richTransfer.ManifestNumber,
          attributes: sharedAttributes,
        });
        cellsHtml += generateHtmlTag({
          tagType: "td",
          htmlContent: richTransfer.PackageCount.toString(),
          attributes: { ...sharedAttributes, style: "text-align: right" },
        });

        totalPackages += richTransfer.PackageCount;

        // Build the row
        tableHtml += generateHtmlTag({
          tagType: "tr",
          htmlContent: cellsHtml,
          attributes: sharedAttributes,
        });
      }

      // Summary row
      tableHtml += `<tr><td colspan="3"></td><td style="color: red; font-weight: 700; text-align: right">TOTAL: ${totalPackages}</td></tr>`;

      tableHtml += "</table>";

      extraHtml = tableHtml;
    }
  }

  switch (reportConfig.fileDeliveryFormat) {
    case "DOWNLOAD":
      downloadXlsxFile({ xlsxFile });
      break;
    case "EMAIL":
      emailXlsxFile({ xlsxFile, extraHtml });
      break;
    default:
      throw new Error(`Invalid file delivery format: ${reportConfig.fileDeliveryFormat}`);
  }
}

export async function createGoogleDocsSpreadsheetOrError({
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

  if (reportConfig[ReportType.SCAN_SHEET]) {
    return createScanSheetSpreadsheetOrError({
      reportData,
      reportConfig,
    });
  }

  const flattenedCache = new Map<ReportType, any[]>();

  //
  // Check that inputs are well-formed
  //

  const ELIGIBLE_REPORT_TYPES: ReportType[] = reportCatalogFactory()
    .filter((x) => x.value && x.enabled)
    .map((x) => x.value as ReportType)
    .filter((reportType) => shouldGenerateReport({ reportType, reportConfig, reportData }));

  //
  // Generate Sheets
  //

  const sheetTitles: string[] = [
    SheetTitles.OVERVIEW,
    ...ELIGIBLE_REPORT_TYPES.map((reportType) => getSheetTitle({ reportType, reportConfig })),
  ];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: getSpreadsheetName({
        reportConfig,
      }),
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
      horizontalAlignment: "LEFT",
    }),
  ];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const sheetId: number = sheetTitles.indexOf(getSheetTitle({ reportType, reportConfig }));
    const length = Math.max(
      extractFlattenedData({
        flattenedCache,
        reportType,
        reportData,
        reportConfig,
      }).length,
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
      spreadsheetTitle: getSheetTitle({ reportType, reportConfig }),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData({
        flattenedCache,
        reportType,
        reportData,
        reportConfig,
      }),
    });
  }

  //
  // Generate Summary Sheet
  //

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: "Generating summary...", level: "success" },
  });

  const summaryList = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    summaryList.push([
      `=HYPERLINK("#gid=${sheetTitles.indexOf(
        getSheetTitle({ reportType, reportConfig })
      )}","${getSheetTitle({
        reportType,
        reportConfig,
      })}")`,
      `=COUNTA('${getSheetTitle({ reportType, reportConfig })}'!A2:A)`,
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
    statusMessage: { text: "Resizing sheets...", level: "success" },
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
        sheetId: sheetTitles.indexOf(getSheetTitle({ reportType, reportConfig })),
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
    statusMessage: { text: "Cleaning up...", level: "success" },
  });

  let shrinkFontRequests: any[] = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    shrinkFontRequests = [
      ...shrinkFontRequests,
      shrinkFontRequestFactory({
        sheetId: sheetTitles.indexOf(getSheetTitle({ reportType, reportConfig })),
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
  const SHEET_TITLE = "Create Packages";

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: "Create Package CSV Template",
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
          `${(x.destination! || x.incomingTransfer!).RecipientFacilityName}      `,
          `${x.pkg.ShippedQuantity} ${x.pkg.ShippedUnitOfMeasureAbbreviation} ${x.pkg.ProductName}      `,
          x.pkg.PackageLabel,
        ]),
      ],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  const sheetId = 0;
  const matchColumn = {
    index: 2,
    identifier: "C",
  };

  const inputColumn = {
    index: 3,
    identifier: "D",
  };

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
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF(${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)=2`,
      backgroundColor: { green: 1 },
    }),
    // Second column: turn red if tag appears exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF(${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)=1`,
      backgroundColor: { red: 1 },
    }),
    // First column: turn yellow if tag appears more than twice anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)>2`,
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn yellow if tag appears more than once in the 2nd column
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: inputColumn.index,
        endColumnIndex: inputColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${inputColumn.identifier}$2:${inputColumn.identifier},${inputColumn.identifier}2)>1`,
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn orange if tag appears exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: inputColumn.index,
        endColumnIndex: inputColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${matchColumn.identifier}$2:${inputColumn.identifier},${inputColumn.identifier}2)=1`,
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
