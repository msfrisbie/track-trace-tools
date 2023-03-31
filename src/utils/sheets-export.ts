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
}: {
  spreadsheetId: string;
  spreadsheetTitle: SheetTitles;
  fields: IFieldData[];
  data: T[];
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

    promises.push(
      messageBus.sendMessageToBackground(
        MessageType.WRITE_SPREADSHEET_VALUES,
        {
          spreadsheetId,
          range: `'${spreadsheetTitle}'!${nextPageRowIdx}:${nextPageRowIdx + nextPage.length}`,
          values: nextPage.map((data) =>
            fields.map((fieldData) => {
              let value = data;
              for (const subProperty of fieldData.value.split(".")) {
                // @ts-ignore
                value = value[subProperty];
              }
              return value;
            })
          ),
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
    statusMessage: "Formatting spreadsheet...",
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
      statusMessage: `Writing ${reportType}...`,
    });

    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: getSheetTitle({ reportType }),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData({ flattenedCache, reportType, reportData }) as any[],
    });
  }

  //
  // Generate Summary Sheet
  //

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: `Generating summary...`,
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
    statusMessage: `Resizing sheets...`,
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
    statusMessage: `Cleaning up...`,
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

// export async function createCogsSpreadsheetOrError({
//   reportData,
//   reportConfig,
// }: {
//   reportData: IReportData;
//   reportConfig: IReportConfig;
// }): Promise<ISpreadsheet> {
//   if (!store.state.pluginAuth?.authState?.license) {
//     throw new Error("Invalid authState");
//   }

//   const response: {
//     data: {
//       success: boolean;
//       result: ISpreadsheet;
//     };
//   } = await messageBus.sendMessageToBackground(
//     MessageType.CREATE_SPREADSHEET,
//     {
//       title: `COGS - ${todayIsodate()}`,
//       sheetTitles: ["Batches", ""],
//     },
//     undefined,
//     90000
//   );

//   if (!response.data.success) {
//     throw new Error("Unable to create COGS sheet");
//   }

//   // await messageBus.sendMessageToBackground(
//   //   MessageType.WRITE_SPREADSHEET_VALUES,
//   //   {
//   //     spreadsheetId: response.data.result.spreadsheetId,
//   //     range: `'${SheetTitles.OVERVIEW}'`,
//   //     values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
//   //   },
//   //   undefined,
//   //   90000
//   // );

//   return response.data.result;
// }
