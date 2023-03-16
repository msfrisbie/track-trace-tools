import { MessageType } from "@/consts";
import {
  IDestinationData,
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedRichTransferData,
  IPackageData,
  ISpreadsheet,
  ITransferData,
} from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
} from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "./date";

enum SheetTitles {
  OVERVIEW = "Overview",
  PACKAGES = "Packages",
  MATURE_PLANTS = "Mature Plants",
  OUTGOING_TRANSFERS = "Outgoing Transfers",
  DEPARTED_TRANSFER_PACKAGES = "Departed Transfer Packages",
}

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
          horizontalAlignment: "CENTER",
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
      fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
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
  endIndex = 12,
}: {
  sheetId: number;
  endIndex?: number;
}) {
  return {
    autoResizeDimensions: {
      dimensions: {
        dimension: "COLUMNS",
        sheetId,
        startIndex: 1,
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
  await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
    spreadsheetId,
    range: `'${spreadsheetTitle}'!1:1`,
    values: [fields.map((fieldData) => `     ${fieldData.readableName}     `)],
  });

  let nextPageStartIdx = 0;
  let nextPageRowIdx = 2;
  const pageSize = 2000;

  while (true) {
    const nextPage = data.slice(nextPageStartIdx, nextPageStartIdx + pageSize);
    if (nextPage.length === 0) {
      break;
    }

    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
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
    });

    nextPageStartIdx += nextPage.length;
    nextPageRowIdx += nextPage.length;
  }
}

export async function createExportSpreadsheetOrError({
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

  function shouldGenerateReport(reportType: ReportType): boolean {
    return !!reportConfig[reportType] && !!reportData[reportType];
  }

  function extractNestedData(reportType: ReportType) {
    switch (reportType) {
      case ReportType.ACTIVE_PACKAGES:
        return reportData[reportType]?.activePackages as IIndexedPackageData[];
      case ReportType.MATURE_PLANTS:
        return reportData[reportType]?.maturePlants as IIndexedPlantData[];
      case ReportType.OUTGOING_TRANSFERS:
        return reportData[reportType]?.outgoingTransfers as IIndexedRichTransferData[];
      case ReportType.TRANSFER_PACKAGES:
        return reportData[reportType]?.richOutgoingInactiveTransfers as IIndexedRichTransferData[];
      default:
        throw new Error("Bad reportType " + reportType);
    }
  }

  function extractFlattenedData(reportType: ReportType): any[] {
    if (flattenedCache.has(reportType)) {
      return flattenedCache.get(reportType) as any[];
    }

    const value = (() => {
      switch (reportType) {
        case ReportType.ACTIVE_PACKAGES:
          return extractNestedData(reportType);
        case ReportType.MATURE_PLANTS:
          return extractNestedData(reportType);
        case ReportType.OUTGOING_TRANSFERS:
          let flattenedOutgoingTransfers: {
            Destination: IDestinationData;
            Transfer: ITransferData;
          }[] = [];

          for (const transfer of extractNestedData(reportType) as IIndexedRichTransferData[]) {
            for (const destination of transfer?.outgoingDestinations || []) {
              flattenedOutgoingTransfers.push({
                Destination: destination,
                Transfer: transfer,
              });
            }
          }

          return flattenedOutgoingTransfers;
        case ReportType.TRANSFER_PACKAGES:
          let flattenedOutgoingPackages: {
            Package: IPackageData;
            Destination: IDestinationData;
            Transfer: ITransferData;
          }[] = [];

          for (const transfer of extractNestedData(reportType) as IIndexedRichTransferData[]) {
            for (const destination of transfer?.outgoingDestinations || []) {
              for (const pkg of destination.packages) {
                flattenedOutgoingPackages.push({
                  Package: pkg,
                  Destination: destination,
                  Transfer: transfer,
                });
              }
            }
          }
          return flattenedOutgoingPackages;
        default:
          throw new Error("Bad reportType " + reportType);
      }
    })();

    flattenedCache.set(reportType, value);

    return value;
  }

  function getSheetTitle(reportType: ReportType): SheetTitles {
    switch (reportType) {
      case ReportType.ACTIVE_PACKAGES:
        return SheetTitles.PACKAGES;
      case ReportType.MATURE_PLANTS:
        return SheetTitles.MATURE_PLANTS;
      case ReportType.OUTGOING_TRANSFERS:
        return SheetTitles.OUTGOING_TRANSFERS;
      case ReportType.TRANSFER_PACKAGES:
        return SheetTitles.DEPARTED_TRANSFER_PACKAGES;
      default:
        throw new Error("Bad reportType " + reportType);
    }
  }

  //
  // Check that inputs are well-formed
  //

  const ELIGIBLE_REPORT_TYPES: ReportType[] = [
    ReportType.ACTIVE_PACKAGES,
    ReportType.MATURE_PLANTS,
    ReportType.OUTGOING_TRANSFERS,
    ReportType.TRANSFER_PACKAGES,
  ].filter(shouldGenerateReport);

  //
  // Generate Sheets
  //

  const sheetTitles: SheetTitles[] = [
    SheetTitles.OVERVIEW,
    ...ELIGIBLE_REPORT_TYPES.map(getSheetTitle),
  ];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(MessageType.CREATE_SPREADSHEET, {
    title: `${store.state.pluginAuth?.authState?.license} Metrc Export - ${todayIsodate()}`,
    sheetTitles,
  });

  if (!response.data.success) {
    throw new Error("Unable to create export sheet");
  }

  //
  // Marshal Data Into Matrix
  // Format Sheet For Data
  //

  let formattingRequests: any = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    const sheetId: number = sheetTitles.indexOf(getSheetTitle(reportType));
    const length = Math.max(extractFlattenedData(reportType).length, 1);

    formattingRequests = [
      ...formattingRequests,

      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: formattingRequests,
  });

  //
  // Write all values
  //

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: getSheetTitle(reportType),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData(reportType) as any[],
    });
  }

  //
  // Generate Summary Sheet
  //

  const summaryList = [];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    summaryList.push([
      null,
      getSheetTitle(reportType),
      `=COUNTA('${getSheetTitle(reportType)}'!A2:A)`,
      // `=COUNTIF('${SheetTitles.PACKAGES}'!C2:C, "ACTIVE")`,
    ]);
  }

  await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
    spreadsheetId: response.data.result.spreadsheetId,
    range: `'${SheetTitles.OVERVIEW}'`,
    values: [
      [`Generated with Track & Trace Tools at ${Date().toString()}`],
      [],
      [null, "License", store.state.pluginAuth?.authState?.license],
      [],
      ...summaryList,
    ],
  });

  //
  // Write All Values
  //

  let resizeRequests: any[] = [
    autoResizeDimensionsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
    }),
  ];

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    resizeRequests = [
      ...resizeRequests,
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(getSheetTitle(reportType)),
      }),
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: resizeRequests,
  });

  return response.data.result;
}
