import { MessageType } from "@/consts";
import {
  IDestinationData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTagData,
  IIndexedTransferData,
  IPackageData,
  ISpreadsheet,
  ITransferData,
  ITransporterData,
} from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
} from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "./date";

enum SheetTitles {
  OVERVIEW = "Overview",
  PACKAGES = "Packages",
  TAGS = "Tags",
  HARVESTS = "Harvests",
  IMMATURE_PLANTS = "Immature Plants",
  MATURE_PLANTS = "Mature Plants",
  INCOMING_TRANSFERS = "Incoming Transfers",
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
      case ReportType.PACKAGES:
        return reportData[reportType]?.packages as IIndexedPackageData[];
      case ReportType.TAGS:
        return reportData[reportType]?.tags as IIndexedTagData[];
      case ReportType.HARVESTS:
        return reportData[reportType]?.harvests as IIndexedHarvestData[];
      case ReportType.IMMATURE_PLANTS:
        return reportData[reportType]?.immaturePlants as IIndexedPlantBatchData[];
      case ReportType.MATURE_PLANTS:
        return reportData[reportType]?.maturePlants as IIndexedPlantData[];
      case ReportType.INCOMING_TRANSFERS:
        return reportData[reportType]?.incomingTransfers as IIndexedRichIncomingTransferData[];
      case ReportType.OUTGOING_TRANSFERS:
        return reportData[reportType]?.outgoingTransfers as IIndexedRichOutgoingTransferData[];
      case ReportType.TRANSFER_PACKAGES:
        return reportData[reportType]
          ?.richOutgoingInactiveTransfers as IIndexedRichOutgoingTransferData[];
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
        case ReportType.PACKAGES:
        case ReportType.MATURE_PLANTS:
        case ReportType.IMMATURE_PLANTS:
        case ReportType.HARVESTS:
        case ReportType.TAGS:
          return extractNestedData(reportType);
        case ReportType.INCOMING_TRANSFERS:
          let flattenedIncomingTransfers: {
            Transporter: ITransporterData;
            Transfer: IIndexedTransferData;
          }[] = [];

          for (const transfer of extractNestedData(
            reportType
          ) as IIndexedRichIncomingTransferData[]) {
            for (const transporter of transfer?.incomingTransporters ?? []) {
              flattenedIncomingTransfers.push({
                Transporter: transporter,
                Transfer: transfer,
              });
            }
          }

          return flattenedIncomingTransfers;
        case ReportType.OUTGOING_TRANSFERS:
          let flattenedOutgoingTransfers: {
            Destination: IDestinationData;
            Transfer: ITransferData;
          }[] = [];

          for (const transfer of extractNestedData(
            reportType
          ) as IIndexedRichOutgoingTransferData[]) {
            for (const destination of transfer?.outgoingDestinations ?? []) {
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

          for (const transfer of extractNestedData(
            reportType
          ) as IIndexedRichOutgoingTransferData[]) {
            for (const destination of transfer?.outgoingDestinations ?? []) {
              for (const pkg of destination.packages ?? []) {
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
      case ReportType.PACKAGES:
        return SheetTitles.PACKAGES;
      case ReportType.HARVESTS:
        return SheetTitles.HARVESTS;
      case ReportType.TAGS:
        return SheetTitles.TAGS;
      case ReportType.IMMATURE_PLANTS:
        return SheetTitles.IMMATURE_PLANTS;
      case ReportType.MATURE_PLANTS:
        return SheetTitles.MATURE_PLANTS;
      case ReportType.INCOMING_TRANSFERS:
        return SheetTitles.INCOMING_TRANSFERS;
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
    ReportType.PACKAGES,
    ReportType.TAGS,
    ReportType.HARVESTS,
    ReportType.IMMATURE_PLANTS,
    ReportType.MATURE_PLANTS,
    ReportType.INCOMING_TRANSFERS,
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
    const sheetId: number = sheetTitles.indexOf(getSheetTitle(reportType));
    const length = Math.max(extractFlattenedData(reportType).length, 1);

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
      spreadsheetTitle: getSheetTitle(reportType),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData(reportType) as any[],
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
      `=HYPERLINK("#gid=${sheetTitles.indexOf(getSheetTitle(reportType))}","${getSheetTitle(
        reportType
      )}")`,
      `=COUNTA('${getSheetTitle(reportType)}'!A2:A)`,
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
        sheetId: sheetTitles.indexOf(getSheetTitle(reportType)),
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
        sheetId: sheetTitles.indexOf(getSheetTitle(reportType)),
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
