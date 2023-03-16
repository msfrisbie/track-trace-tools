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

  //
  // Check that inputs are well-formed
  //

  let includeActivePackageReport: boolean = false;
  let activePackages: IIndexedPackageData[] = [];
  let activePackageFields: IFieldData[] = [];
  if (reportConfig[ReportType.ACTIVE_PACKAGES] && reportData[ReportType.ACTIVE_PACKAGES]) {
    includeActivePackageReport = true;
    activePackages = reportData[ReportType.ACTIVE_PACKAGES]
      ?.activePackages as IIndexedPackageData[];
    activePackageFields = reportConfig[ReportType.ACTIVE_PACKAGES]?.fields as IFieldData[];
  }

  let includeMaturePlantsReport: boolean = false;
  let maturePlants: IIndexedPlantData[] = [];
  let maturePlantFields: IFieldData[] = [];
  if (reportConfig[ReportType.MATURE_PLANTS] && reportData[ReportType.MATURE_PLANTS]) {
    includeMaturePlantsReport = true;
    maturePlants = reportData[ReportType.MATURE_PLANTS]?.maturePlants as IIndexedPlantData[];
    maturePlantFields = reportConfig[ReportType.MATURE_PLANTS]?.fields as IFieldData[];
  }

  let includeOutgoingTransfersReport: boolean = false;
  let richOutgoingTransfers: IIndexedRichTransferData[] = [];
  let richOutgoingTransferFields: IFieldData[] = [];
  if (reportConfig[ReportType.OUTGOING_TRANSFERS] && reportData[ReportType.OUTGOING_TRANSFERS]) {
    includeOutgoingTransfersReport = true;
    richOutgoingTransfers = reportData[ReportType.OUTGOING_TRANSFERS]
      ?.outgoingTransfers as IIndexedRichTransferData[];
    richOutgoingTransferFields = reportConfig[ReportType.OUTGOING_TRANSFERS]
      ?.fields as IFieldData[];
  }

  let includeTransferPackagesReport: boolean = false;
  let richOutgoingInactiveTransfers: IIndexedRichTransferData[] = [];
  let richOutgoingInactiveTransferFields: IFieldData[] = [];
  if (reportConfig[ReportType.TRANSFER_PACKAGES] && reportData[ReportType.TRANSFER_PACKAGES]) {
    includeTransferPackagesReport = true;
    richOutgoingInactiveTransfers = reportData[ReportType.TRANSFER_PACKAGES]
      ?.richOutgoingInactiveTransfers as IIndexedRichTransferData[];
    richOutgoingInactiveTransferFields = reportConfig[ReportType.TRANSFER_PACKAGES]
      ?.fields as IFieldData[];
  }

  //
  // Generate Sheets
  //

  const sheetTitles: SheetTitles[] = [SheetTitles.OVERVIEW];

  if (includeActivePackageReport) {
    sheetTitles.push(SheetTitles.PACKAGES);
  }

  if (includeMaturePlantsReport) {
    sheetTitles.push(SheetTitles.MATURE_PLANTS);
  }

  if (includeOutgoingTransfersReport) {
    sheetTitles.push(SheetTitles.OUTGOING_TRANSFERS);
  }

  if (includeTransferPackagesReport) {
    sheetTitles.push(SheetTitles.DEPARTED_TRANSFER_PACKAGES);
  }

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

  let activePackageRequests: any[] = [];

  if (includeActivePackageReport) {
    const sheetId: number = sheetTitles.indexOf(SheetTitles.PACKAGES);
    const length = Math.max(activePackages.length, 1);

    activePackageRequests = [
      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  let maturePlantRequests: any = [];

  if (includeMaturePlantsReport) {
    const sheetId: number = sheetTitles.indexOf(SheetTitles.MATURE_PLANTS);
    const length: number = Math.max(activePackages.length, 1);
    maturePlantRequests = [
      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  let richOutgoingTransfersRequests: any[] = [];
  let flattenedOutgoingTransfers: {
    Destination: IDestinationData;
    Transfer: ITransferData;
  }[] = [];

  if (includeOutgoingTransfersReport) {
    for (const transfer of richOutgoingTransfers) {
      for (const destination of transfer?.outgoingDestinations || []) {
        flattenedOutgoingTransfers.push({
          Destination: destination,
          Transfer: transfer,
        });
      }
    }

    const sheetId: number = sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS);
    const length: number = Math.max(flattenedOutgoingTransfers.length, 1);

    richOutgoingTransfersRequests = [
      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  let richOutgoingInactiveTransferPackagesRequests: any[] = [];
  let flattenedOutgoingPackages: {
    Package: IPackageData;
    Destination: IDestinationData;
    Transfer: ITransferData;
  }[] = [];

  if (includeTransferPackagesReport) {
    for (const transfer of richOutgoingInactiveTransfers) {
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
    const sheetId: number = sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES);
    const length: number = Math.max(flattenedOutgoingTransfers.length, 1);

    richOutgoingInactiveTransferPackagesRequests = [
      addRowsRequestFactory({ sheetId, length }),
      styleTopRowRequestFactory({ sheetId }),
      freezeTopRowRequestFactory({ sheetId }),
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: [
      ...activePackageRequests,
      ...maturePlantRequests,
      ...richOutgoingTransfersRequests,
      ...richOutgoingInactiveTransferPackagesRequests,
    ],
  });

  //
  // Generate Data Matrix
  //

  if (includeActivePackageReport) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: SheetTitles.PACKAGES,
      fields: activePackageFields,
      data: activePackages,
    });
  }

  if (includeMaturePlantsReport) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: SheetTitles.MATURE_PLANTS,
      fields: maturePlantFields,
      data: maturePlants,
    });
  }

  if (includeOutgoingTransfersReport) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: SheetTitles.OUTGOING_TRANSFERS,
      fields: richOutgoingTransferFields,
      data: flattenedOutgoingTransfers,
    });
  }

  if (includeTransferPackagesReport) {
    await writeDataSheet({
      spreadsheetId: response.data.result.spreadsheetId,
      spreadsheetTitle: SheetTitles.DEPARTED_TRANSFER_PACKAGES,
      fields: richOutgoingInactiveTransferFields,
      data: flattenedOutgoingPackages,
    });
  }

  //
  // Generate Summary Sheet
  //

  const summaryList = [];

  if (includeActivePackageReport) {
    summaryList.push([
      null,
      SheetTitles.PACKAGES,
      `=COUNTA('${SheetTitles.PACKAGES}'!A2:A)`,
      // `=COUNTIF('${SheetTitles.PACKAGES}'!C2:C, "ACTIVE")`,
    ]);
  }

  if (includeMaturePlantsReport) {
    summaryList.push([
      null,
      SheetTitles.MATURE_PLANTS,
      `=COUNTA('${SheetTitles.MATURE_PLANTS}'!A2:A)`,
    ]);
  }

  if (includeOutgoingTransfersReport) {
    summaryList.push([
      null,
      SheetTitles.OUTGOING_TRANSFERS,
      `=COUNTA('${SheetTitles.OUTGOING_TRANSFERS}'!A2:A)`,
    ]);
  }

  if (includeTransferPackagesReport) {
    summaryList.push([
      null,
      "Departed Packages",
      `=COUNTA('${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!A2:A)`,
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

  let packageResizeRequests: any[] = [];
  let maturePlantResizeRequests: any[] = [];
  let outgoingTransferResizeRequests: any[] = [];
  let departedTransferPackageResizeRequests: any[] = [];

  if (includeActivePackageReport) {
    packageResizeRequests = [
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
      }),
    ];
  }

  if (includeMaturePlantsReport) {
    maturePlantResizeRequests = [
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
      }),
    ];
  }

  if (includeOutgoingTransfersReport) {
    outgoingTransferResizeRequests = [
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
      }),
    ];
  }

  if (includeTransferPackagesReport) {
    departedTransferPackageResizeRequests = [
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
      }),
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: [
      autoResizeDimensionsRequestFactory({
        sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      }),
      ...packageResizeRequests,
      ...maturePlantResizeRequests,
      ...outgoingTransferResizeRequests,
      ...departedTransferPackageResizeRequests,
    ],
  });

  return response.data.result;
}
