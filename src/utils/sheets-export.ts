import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from "@/consts";
import { IDestinationData, IDestinationPackageData, ISpreadsheet } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
} from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "./date";
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
  getLetterFromIndex,
  shrinkFontRequestFactory,
  styleTopRowRequestFactory,
} from "./sheets";

async function writeDataSheet<T>({
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
    useFieldTransformer?: boolean;
    pageSize?: number;
    maxParallelRequests?: number;
    valueInputOption?: "RAW" | "USER_ENTERED";
    rangeStartColumn?: string;
    rangeEndColumn?: string;
  };
}) {
  const mergedOptions = {
    useFieldTransformer: false,
    pageSize: 5000,
    maxParallelRequests: 25,
    valueInputOption: "USER_ENTERED",
    rangeStartColumn: "A",
    rangeEndColumn: "",
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
        values: [fields.map((fieldData) => `${fieldData.readableName}     `)],
      },
      undefined,
      SHEETS_API_MESSAGE_TIMEOUT_MS
    );

    nextPageRowIdx += 1;
  }

  const promises = [];

  while (true) {
    const nextPage = data.slice(nextPageStartIdx, nextPageStartIdx + mergedOptions.pageSize);
    if (nextPage.length === 0) {
      break;
    }

    const range = `'${spreadsheetTitle}'!${mergedOptions.rangeStartColumn}${nextPageRowIdx}:${
      mergedOptions.rangeEndColumn
    }${nextPageRowIdx + nextPage.length - 1}`;

    let values = nextPage;
    if (mergedOptions.useFieldTransformer) {
      if (!fields) {
        throw new Error("Must provide fields transformer");
      }
      // @ts-ignore
      values = values.map((row) =>
        fields.map((fieldData) => {
          let value = row;
          for (const subProperty of fieldData.value.split(".")) {
            // @ts-ignore
            value = value[subProperty];
          }
          return value;
        })
      );
    }

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

    nextPageStartIdx += nextPage.length;
    nextPageRowIdx += nextPage.length;

    if (promises.length % mergedOptions.maxParallelRequests === 0) {
      for (const result of await Promise.allSettled(promises)) {
        if (result.status === "rejected") {
          throw new Error("Write failed");
        }
      }

      // Wait for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
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

  return createReportSpreadsheeetOrError({
    reportData,
    reportConfig,
  });
}

export async function createReportSpreadsheeetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  const flattenedCache = new Map<ReportType, any[]>();

  //
  // Check that inputs are well-formed
  //

  const ELIGIBLE_REPORT_TYPES: ReportType[] = [
    ReportType.PACKAGES,
    ReportType.STRAGGLER_PACKAGES,
    ReportType.TAGS,
    ReportType.HARVESTS,
    ReportType.IMMATURE_PLANTS,
    ReportType.MATURE_PLANTS,
    ReportType.INCOMING_TRANSFERS,
    ReportType.OUTGOING_TRANSFERS,
    ReportType.OUTGOING_TRANSFER_MANIFESTS,
  ].filter((reportType) => shouldGenerateReport({ reportType, reportConfig, reportData }));

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
      title: `${store.state.pluginAuth?.authState?.license} Metrc Snapshot - ${todayIsodate()}`,
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

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const sheetId: number = sheetTitles.indexOf(getSheetTitle({ reportType }));
    const length = Math.max(
      extractFlattenedData({ flattenedCache, reportType, reportData }).length,
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
      data: extractFlattenedData({ flattenedCache, reportType, reportData }) as any[],
      options: {
        useFieldTransformer: true,
      },
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

export async function createCogsSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.COGS]) {
    throw new Error("Missing COGS data");
  }

  const sheetTitles = [
    SheetTitles.OVERVIEW,
    // SheetTitles.PRODUCTION_BATCH_COSTS,
    SheetTitles.WORKSHEET,
    SheetTitles.MANIFEST_COGS,
  ];

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

  // reportData[ReportType.COGS]!.packages.sort((a, b) => {
  //   if (!a.ProductionBatchNumber) {
  //     return 1;
  //   }
  //   if (!b.ProductionBatchNumber) {
  //     return -1;
  //   }
  //   return a.ProductionBatchNumber!.localeCompare(b.ProductionBatchNumber!);
  // }).map((pkg) => [pkg.Label, pkg.ProductionBatchNumber ?? ""]);

  // const worksheetData = reportData[ReportType.COGS]!.packageCostCalculationData.map(
  //   ({ tag, sourceCostData, errors }, idx) => [
  //     tag,
  //     `=SUM(C${idx + 2}:D${idx + 2})`,
  //     `=IFERROR(VLOOKUP(A${idx + 2}, '${SheetTitles.PRODUCTION_BATCH_COSTS}'!A${
  //       idx + 2
  //     }:C, 3, false), 0)`,
  //     "=" +
  //       sourceCostData
  //         .map(
  //           ({ parentTag, costFractionMultiplier }) =>
  //             `(VLOOKUP("${parentTag}", $A$2:$B, 2) * ${costFractionMultiplier})`
  //         )
  //         .join("+"),
  //     errors.toString(),
  //   ]
  // );

  // const worksheetData: any[] = [];
  // const worksheetData = reportData[ReportType.COGS]!.packages.map((pkg, idx) => {
  //   let fractionalCostExpression = "";
  //   if (pkg!.fractionalCostData!.length) {
  //     fractionalCostExpression =
  //       "=" +
  //       pkg!
  //         .fractionalCostData!.map(
  //           ({ parentLabel, fractionalQuantity }) =>
  //             `(VLOOKUP("${parentLabel}", B2:E, 4, false) * ${fractionalQuantity})`
  //         )
  //         .join("+");
  //   }

  //   return [
  //     pkg.LicenseNumber,
  //     pkg.Label,
  //     pkg.ItemName,
  //     pkg.ProductionBatchNumber,
  //     ``,
  //     fractionalCostExpression,
  //     `=SUM(E${idx + 2}:F${idx + 2})`,
  //     (pkg.errors ?? "").toString(),
  //   ];
  // });

  let formattingRequests: any = [
    addRowsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      length: 20,
    }),
    styleTopRowRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
    }),
  ];

  const { worksheetMatrix, cogsMatrix, auditData } = reportData[ReportType.COGS]!;

  // const batchCostSheetId = sheetTitles.indexOf(SheetTitles.PRODUCTION_BATCH_COSTS);
  const worksheetSheetId = sheetTitles.indexOf(SheetTitles.WORKSHEET);
  const manifestSheetId = sheetTitles.indexOf(SheetTitles.MANIFEST_COGS);

  formattingRequests = [
    ...formattingRequests,
    // Batch Costs
    // addRowsRequestFactory({ sheetId: batchCostSheetId, length: packageData.length }),
    // styleTopRowRequestFactory({ sheetId: batchCostSheetId }),
    // freezeTopRowRequestFactory({ sheetId: batchCostSheetId }),
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

  // Tag	Production Batch Number	Cost
  // 1A4050100000900000000001	PR-C100GSSRA-03/21/2023	$1,500.00

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Writing package data...`, level: "success" },
  });

  // await writeDataSheet({
  //   spreadsheetId: response.data.result.spreadsheetId,
  //   spreadsheetTitle: SheetTitles.PRODUCTION_BATCH_COSTS,
  //   fields: [
  //     {
  //       value: "",
  //       readableName: "Package Tag",
  //       required: true,
  //     },
  //     {
  //       value: "",
  //       readableName: "Production Batch Number",
  //       required: true,
  //     },
  //     {
  //       value: "",
  //       readableName: "Cost",
  //       required: true,
  //     },
  //   ],
  //   data: packageData,
  //   options: {
  //     useFieldTransformer: false,
  //   },
  // });

  // Tag	Computed Cost	Production Batch Cost	Fractional Costs
  // 1A4050100000900000000004	=SUM(C5:5) =IFERROR(VLOOKUP(A5, 'Production Batches'!A5:C, 3), 0)	=VLOOKUP("1A4050100000900000000001", $A$2:$B, 2) * 0.25

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: `Writing worksheet data...`, level: "success" },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.WORKSHEET,
    data: worksheetMatrix.map((row) => row.slice(0, row.length - 1)),
    options: {
      valueInputOption: "RAW",
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.WORKSHEET,
    data: worksheetMatrix.map((row) => row.slice(row.length - 1)),
    options: {
      rangeStartColumn: getLetterFromIndex(worksheetMatrix[0].length - 1),
      pageSize: 500,
      valueInputOption: "USER_ENTERED",
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.MANIFEST_COGS,
    data: cogsMatrix.map((row) => row.slice(0, row.length - 1)),
    options: {
      valueInputOption: "RAW",
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.MANIFEST_COGS,
    data: cogsMatrix.map((row) => row.slice(row.length - 1)),
    options: {
      rangeStartColumn: getLetterFromIndex(cogsMatrix[0].length - 1),
      pageSize: 500,
      valueInputOption: "USER_ENTERED",
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
    // autoResizeDimensionsRequestFactory({
    //   sheetId: batchCostSheetId,
    // }),
    autoResizeDimensionsRequestFactory({
      sheetId: worksheetSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: manifestSheetId,
    }),
  ];

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

export async function createScanSheetOrError(
  manifestNumber: string,
  licenseNumber: string,
  manifest: {
    pkg: IDestinationPackageData;
    destination: IDestinationData;
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
          "Package Contents",
          "Package Tag                                    ",
          "Scanned Tags                                   ",
        ],
        ...manifest.map((x) => [
          x.destination.RecipientFacilityName + "      ",
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
