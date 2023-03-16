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

  function extractFlattenedData(reportType: ReportType) {
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

  const mergedReportData: {
    [ReportType.ACTIVE_PACKAGES]?: {};
    [ReportType.MATURE_PLANTS]?: {};
    [ReportType.OUTGOING_TRANSFERS]?: {};
    [ReportType.TRANSFER_PACKAGES]?: {};
  } = {};

  const ELIGIBLE_REPORT_TYPES: ReportType[] = [
    ReportType.ACTIVE_PACKAGES,
    ReportType.MATURE_PLANTS,
    ReportType.OUTGOING_TRANSFERS,
    ReportType.TRANSFER_PACKAGES,
  ].filter(shouldGenerateReport);

  // if (shouldGenerateReport(ReportType.ACTIVE_PACKAGES)) {
  //   reports.push({
  //     reportType: ReportType.ACTIVE_PACKAGES,
  //     sheetTitle: SheetTitles.PACKAGES,
  //     nestedData: extractNestedData(ReportType.ACTIVE_PACKAGES) as ,
  //     flattenedData: [],
  //     fields: reportConfig[ReportType.ACTIVE_PACKAGES]?.fields as IFieldData[]
  //   })
  // }

  // let activePackages: IIndexedPackageData[] = [];
  // let activePackageFields: IFieldData[] = [];
  // if (reportConfig[ReportType.ACTIVE_PACKAGES] && reportData[ReportType.ACTIVE_PACKAGES]) {
  //   reports.push(ReportType.ACTIVE_PACKAGES);
  //   activePackages = reportData[ReportType.ACTIVE_PACKAGES]
  //     ?.activePackages as IIndexedPackageData[];
  //   activePackageFields = reportConfig[ReportType.ACTIVE_PACKAGES]?.fields as IFieldData[];
  // }

  // let maturePlants: IIndexedPlantData[] = [];
  // let maturePlantFields: IFieldData[] = [];
  // if (reportConfig[ReportType.MATURE_PLANTS] && reportData[ReportType.MATURE_PLANTS]) {
  //   reports.push(ReportType.MATURE_PLANTS);
  //   maturePlants = reportData[ReportType.MATURE_PLANTS]?.maturePlants as IIndexedPlantData[];
  //   maturePlantFields = reportConfig[ReportType.MATURE_PLANTS]?.fields as IFieldData[];
  // }

  // let richOutgoingTransfers: IIndexedRichTransferData[] = [];
  // let richOutgoingTransferFields: IFieldData[] = [];
  // if (reportConfig[ReportType.OUTGOING_TRANSFERS] && reportData[ReportType.OUTGOING_TRANSFERS]) {
  //   reports.push(ReportType.OUTGOING_TRANSFERS);
  //   richOutgoingTransfers = reportData[ReportType.OUTGOING_TRANSFERS]
  //     ?.outgoingTransfers as IIndexedRichTransferData[];
  //   richOutgoingTransferFields = reportConfig[ReportType.OUTGOING_TRANSFERS]
  //     ?.fields as IFieldData[];
  // }

  // let richOutgoingInactiveTransfers: IIndexedRichTransferData[] = [];
  // let richOutgoingInactiveTransferFields: IFieldData[] = [];
  // if (reportConfig[ReportType.TRANSFER_PACKAGES] && reportData[ReportType.TRANSFER_PACKAGES]) {
  //   reports.push(ReportType.TRANSFER_PACKAGES);
  //   richOutgoingInactiveTransfers = reportData[ReportType.TRANSFER_PACKAGES]
  //     ?.richOutgoingInactiveTransfers as IIndexedRichTransferData[];
  //   richOutgoingInactiveTransferFields = reportConfig[ReportType.TRANSFER_PACKAGES]
  //     ?.fields as IFieldData[];
  // }

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

  // let activePackageRequests: any[] = [];

  // if (reports.includes(ReportType.ACTIVE_PACKAGES)) {
  //   activePackageRequests = [
  //     addRowsRequestFactory({ sheetId, length }),
  //     styleTopRowRequestFactory({ sheetId }),
  //     freezeTopRowRequestFactory({ sheetId }),
  //   ];
  // }

  // let maturePlantRequests: any = [];

  // if (reports.includes(ReportType.MATURE_PLANTS)) {
  //   const sheetId: number = sheetTitles.indexOf(SheetTitles.MATURE_PLANTS);
  //   const length: number = Math.max(activePackages.length, 1);
  //   maturePlantRequests = [
  //     addRowsRequestFactory({ sheetId, length }),
  //     styleTopRowRequestFactory({ sheetId }),
  //     freezeTopRowRequestFactory({ sheetId }),
  //   ];
  // }

  // let richOutgoingTransfersRequests: any[] = [];

  // if (reports.includes(ReportType.OUTGOING_TRANSFERS)) {
  //   const sheetId: number = sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS);
  //   const length: number = Math.max(flattenedOutgoingTransfers.length, 1);

  //   richOutgoingTransfersRequests = [
  //     addRowsRequestFactory({ sheetId, length }),
  //     styleTopRowRequestFactory({ sheetId }),
  //     freezeTopRowRequestFactory({ sheetId }),
  //   ];
  // }

  // let richOutgoingInactiveTransferPackagesRequests: any[] = [];

  // if (reports.includes(ReportType.TRANSFER_PACKAGES)) {
  //   const sheetId: number = sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES);
  //   const length: number = Math.max(flattenedOutgoingTransfers.length, 1);

  //   richOutgoingInactiveTransferPackagesRequests = [
  //     addRowsRequestFactory({ sheetId, length }),
  //     styleTopRowRequestFactory({ sheetId }),
  //     freezeTopRowRequestFactory({ sheetId }),
  //   ];
  // }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: formattingRequests,
  });

  //
  // Generate Data Matrix
  //

  for (const reportType of ELIGIBLE_REPORT_TYPES) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: getSheetTitle(reportType),
      fields: reportConfig[reportType]?.fields as IFieldData[],
      data: extractFlattenedData(reportType) as any[],
    });
  }

  // if (reports.includes(ReportType.ACTIVE_PACKAGES)) {
  //   await writeDataSheet({
  //     spreadsheetId: response.data.result.spreadsheetId,
  //     spreadsheetTitle: SheetTitles.PACKAGES,
  //     fields: activePackageFields,
  //     data: activePackages,
  //   });
  // }

  // if (reports.includes(ReportType.MATURE_PLANTS)) {
  //   await writeDataSheet({
  //     spreadsheetId: response.data.result.spreadsheetId,
  //     spreadsheetTitle: SheetTitles.MATURE_PLANTS,
  //     fields: maturePlantFields,
  //     data: maturePlants,
  //   });
  // }

  // if (reports.includes(ReportType.OUTGOING_TRANSFERS)) {
  //   await writeDataSheet({
  //     spreadsheetId: response.data.result.spreadsheetId,
  //     spreadsheetTitle: SheetTitles.OUTGOING_TRANSFERS,
  //     fields: richOutgoingTransferFields,
  //     data: flattenedOutgoingTransfers,
  //   });
  // }

  // if (reports.includes(ReportType.TRANSFER_PACKAGES)) {
  //   await writeDataSheet({
  //     spreadsheetId: response.data.result.spreadsheetId,
  //     spreadsheetTitle: SheetTitles.DEPARTED_TRANSFER_PACKAGES,
  //     fields: richOutgoingInactiveTransferFields,
  //     data: flattenedOutgoingPackages,
  //   });
  // }

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

  // if (reports.includes(ReportType.ACTIVE_PACKAGES)) {
  //   summaryList.push([
  //     null,
  //     SheetTitles.PACKAGES,
  //     `=COUNTA('${SheetTitles.PACKAGES}'!A2:A)`,
  //     // `=COUNTIF('${SheetTitles.PACKAGES}'!C2:C, "ACTIVE")`,
  //   ]);
  // }

  // if (reports.includes(ReportType.MATURE_PLANTS)) {
  //   summaryList.push([
  //     null,
  //     SheetTitles.MATURE_PLANTS,
  //     `=COUNTA('${SheetTitles.MATURE_PLANTS}'!A2:A)`,
  //   ]);
  // }

  // if (reports.includes(ReportType.OUTGOING_TRANSFERS)) {
  //   summaryList.push([
  //     null,
  //     SheetTitles.OUTGOING_TRANSFERS,
  //     `=COUNTA('${SheetTitles.OUTGOING_TRANSFERS}'!A2:A)`,
  //   ]);
  // }

  // if (reports.includes(ReportType.TRANSFER_PACKAGES)) {
  //   summaryList.push([
  //     null,
  //     SheetTitles.DEPARTED_TRANSFER_PACKAGES,
  //     `=COUNTA('${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!A2:A)`,
  //   ]);
  // }

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

  // let packageResizeRequests: any[] = [];
  // let maturePlantResizeRequests: any[] = [];
  // let outgoingTransferResizeRequests: any[] = [];
  // let departedTransferPackageResizeRequests: any[] = [];

  // if (reports.includes(ReportType.ACTIVE_PACKAGES)) {
  //   packageResizeRequests = [
  //     autoResizeDimensionsRequestFactory({
  //       sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
  //     }),
  //   ];
  // }

  // if (reports.includes(ReportType.MATURE_PLANTS)) {
  //   maturePlantResizeRequests = [
  //     autoResizeDimensionsRequestFactory({
  //       sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
  //     }),
  //   ];
  // }

  // if (reports.includes(ReportType.OUTGOING_TRANSFERS)) {
  //   outgoingTransferResizeRequests = [
  //     autoResizeDimensionsRequestFactory({
  //       sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
  //     }),
  //   ];
  // }

  // if (reports.includes(ReportType.TRANSFER_PACKAGES)) {
  //   departedTransferPackageResizeRequests = [
  //     autoResizeDimensionsRequestFactory({
  //       sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
  //     }),
  //   ];
  // }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: resizeRequests,
    // ...packageResizeRequests,
    // ...maturePlantResizeRequests,
    // ...outgoingTransferResizeRequests,
    // ...departedTransferPackageResizeRequests,
  });

  return response.data.result;
}
