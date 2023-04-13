import { MessageType, SheetTitles } from "@/consts";
import { ISpreadsheet } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
} from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "./date";
import { getLabel } from "./package";
import {
  extractFlattenedData,
  getSheetTitle,
  shouldGenerateReport,
} from "./reports/reports-shared";

function addRowsRequestFactory({ sheetId, length }: { sheetId: number; length: number }) {
  return {
    appendDimension: {
      dimension: "ROWS",
      length,
      sheetId,
    },
  };
}

function styleTopRowRequestFactory({ sheetId }: { sheetId: number }) {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: {
            red: 73 / 256,
            green: 39 / 256,
            blue: 106 / 256,
          },
          // horizontalAlignment: "CENTER",
          textFormat: {
            foregroundColor: {
              red: 1.0,
              green: 1.0,
              blue: 1.0,
            },
            fontSize: 10,
            bold: true,
          },
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat)",
    },
  };
}

function shrinkFontRequestFactory({ sheetId }: { sheetId: number }) {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          textFormat: {
            fontSize: 9,
          },
        },
      },
      fields: "userEnteredFormat(textFormat)",
    },
  };
}

function freezeTopRowRequestFactory({ sheetId }: { sheetId: number }) {
  return {
    updateSheetProperties: {
      properties: {
        sheetId,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      fields: "gridProperties.frozenRowCount",
    },
  };
}

function autoResizeDimensionsRequestFactory({
  sheetId,
  dimension = "COLUMNS",
  startIndex,
  endIndex,
}: {
  sheetId: number;
  dimension?: "COLUMNS" | "ROWS";
  startIndex?: number;
  endIndex?: number;
}) {
  return {
    autoResizeDimensions: {
      dimensions: {
        dimension,
        sheetId,
        startIndex,
        endIndex,
      },
    },
  };
}

async function writeDataSheet<T>({
  spreadsheetId,
  spreadsheetTitle,
  fields,
  data,
  options = {},
}: {
  spreadsheetId: string;
  spreadsheetTitle: SheetTitles;
  fields: IFieldData[];
  data: T[];
  options?: {
    useFieldTransformer?: boolean;
  };
}) {
  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId,
      range: `'${spreadsheetTitle}'!1:1`,
      values: [fields.map((fieldData) => `${fieldData.readableName}     `)],
    },
    undefined,
    90000
  );

  let nextPageStartIdx = 0;
  let nextPageRowIdx = 2;
  const pageSize = 5000;

  const promises = [];

  while (true) {
    const nextPage = data.slice(nextPageStartIdx, nextPageStartIdx + pageSize);
    if (nextPage.length === 0) {
      break;
    }

    const range = `'${spreadsheetTitle}'!${nextPageRowIdx}:${nextPageRowIdx + nextPage.length}`;

    let values = nextPage;
    if (options.useFieldTransformer) {
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
        },
        undefined,
        90000
      )
    );

    nextPageStartIdx += nextPage.length;
    nextPageRowIdx += nextPage.length;
  }

  await Promise.allSettled(promises);
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
    90000
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
    90000
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
    90000
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
    90000
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
    90000
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    90000
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
    90000
  );

  if (!response.data.success) {
    throw new Error("Unable to create COGS sheet");
  }

  const packageData = reportData[ReportType.COGS]!.packages.sort((a, b) => {
    if (!a.ProductionBatchNumber) {
      return 1;
    }
    if (!b.ProductionBatchNumber) {
      return -1;
    }
    return a.ProductionBatchNumber!.localeCompare(b.ProductionBatchNumber!);
  }).map((pkg) => [getLabel(pkg), pkg.ProductionBatchNumber ?? ""]);

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

  const worksheetData = reportData[ReportType.COGS]!.packages.map((pkg, idx) => {
    let fractionalCostExpression = "";
    if (pkg!.fractionalCostData!.length) {
      fractionalCostExpression =
        "=" +
        pkg!
          .fractionalCostData!.map(
            ({ parentLabel, fractionalQuantity }) =>
              `(VLOOKUP("${parentLabel}", $A$2:$C, 3) * ${fractionalQuantity})`
          )
          .join("+");
    }

    return [
      getLabel(pkg),
      pkg.ProductionBatchNumber,
      ``,
      fractionalCostExpression,
      `=SUM(C${idx + 2}:D${idx + 2})`,
      (pkg.errors ?? "").toString(),
    ];
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
    addRowsRequestFactory({ sheetId: worksheetSheetId, length: worksheetData.length }),
    styleTopRowRequestFactory({ sheetId: worksheetSheetId }),
    freezeTopRowRequestFactory({ sheetId: worksheetSheetId }),
    // Manifest COGS
    addRowsRequestFactory({ sheetId: manifestSheetId, length: 200 }),
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
    90000
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [
        [],
        [],
        ...reportData[ReportType.COGS]!.auditData.map(({ text, value }) => ["", text, value]),
      ],
    },
    undefined,
    90000
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
    fields: [
      {
        value: "",
        readableName: "Package Tag",
        required: true,
      },
      {
        value: "",
        readableName: "PB #",
        required: true,
      },
      {
        value: "",
        readableName: "Cost",
        required: true,
      },
      {
        value: "",
        readableName: "Fractional Cost",
        required: true,
      },
      {
        value: "",
        readableName: "Total Cost",
        required: true,
      },
      {
        value: "",
        readableName: "Errors",
        required: true,
      },
    ],
    data: worksheetData,
    options: {
      useFieldTransformer: false,
    },
  });

  // Manifest	Tag	Wholesale Cost	Units	COGS (package)	COGS (per unit)
  // 10000001	1A4050100000900000000008	$500.00	50	=VLOOKUP(B3, 'Calculation Sheet'!A3:B, 2)	=E3/D3

  // TODO

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
    90000
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    90000
  );

  return response.data.result;
}
