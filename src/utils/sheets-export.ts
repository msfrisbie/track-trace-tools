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
    activePackageRequests = [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: Math.max(activePackages.length, 1),
          sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
        },
      },
      // Style top row - black bg, white text
      {
        repeatCell: {
          range: {
            sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
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
      },
      // Freeze top row
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
    ];
  }

  let maturePlantRequests: any = [];

  if (includeMaturePlantsReport) {
    maturePlantRequests = [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: Math.max(activePackages.length, 1),
          sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
        },
      },
      // Style top row - black bg, white text
      {
        repeatCell: {
          range: {
            sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
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
      },
      // Freeze top row
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
    ];
  }

  let richOutgoingTransfersRequests: any[] = [];
  let flattenedOutgoingTransfers: {
    Destination: IDestinationData;
    Transfer: ITransferData;
  }[] = [];

  if (includeOutgoingTransfersReport) {
    console.log({ richOutgoingTransfers });
    for (const transfer of richOutgoingTransfers) {
      for (const destination of transfer?.outgoingDestinations || []) {
        flattenedOutgoingTransfers.push({
          Destination: destination,
          Transfer: transfer,
        });
      }
    }
    console.log({ flattenedOutgoingTransfers });

    richOutgoingTransfersRequests = [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: Math.max(flattenedOutgoingTransfers.length, 1),
          sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
        },
      },
      // Style top row - black bg, white text
      {
        repeatCell: {
          range: {
            sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
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
      },
      // Freeze top row
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
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

    richOutgoingInactiveTransferPackagesRequests = [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: Math.max(flattenedOutgoingPackages.length, 1),
          sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
        },
      },
      // Style top row - black bg, white text
      {
        repeatCell: {
          range: {
            sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
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
      },
      // Freeze top row
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: "gridProperties.frozenRowCount",
        },
      },
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: 19,
          sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
        },
      },
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
    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.PACKAGES}'!1:1`,
      values: [activePackageFields.map((fieldData) => `     ${fieldData.readableName}     `)],
    });

    let nextPageStartIdx = 0;
    let nextPageRowIdx = 2;
    const pageSize = 2000;

    while (true) {
      const nextPage = activePackages.slice(nextPageStartIdx, nextPageStartIdx + pageSize);
      if (nextPage.length === 0) {
        break;
      }

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: `'${SheetTitles.PACKAGES}'!${nextPageRowIdx}:${nextPageRowIdx + nextPage.length}`,
        values: nextPage.map((pkg) =>
          activePackageFields.map((fieldData) => {
            let value = pkg;
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

  if (includeMaturePlantsReport) {
    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.MATURE_PLANTS}'!1:1`,
      values: [maturePlantFields.map((fieldData) => `     ${fieldData.readableName}     `)],
    });

    let nextPageStartIdx = 0;
    let nextPageRowIdx = 2;
    const pageSize = 2000;

    while (true) {
      const nextPage = maturePlants.slice(nextPageStartIdx, nextPageStartIdx + pageSize);
      if (nextPage.length === 0) {
        break;
      }

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: `'${SheetTitles.MATURE_PLANTS}'!${nextPageRowIdx}:${
          nextPageRowIdx + nextPage.length
        }`,
        values: nextPage.map((plant) =>
          maturePlantFields.map((fieldData) => {
            let value = plant;
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

  console.log({ flattenedOutgoingTransfers });

  if (includeOutgoingTransfersReport) {
    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OUTGOING_TRANSFERS}'!1:1`,
      values: [
        richOutgoingTransferFields.map((fieldData) => `     ${fieldData.readableName}     `),
      ],
    });

    let nextPageStartIdx = 0;
    let nextPageRowIdx = 2;
    const pageSize = 2000;

    while (true) {
      const nextPage = flattenedOutgoingTransfers.slice(
        nextPageStartIdx,
        nextPageStartIdx + pageSize
      );
      if (nextPage.length === 0) {
        break;
      }

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: `'${SheetTitles.OUTGOING_TRANSFERS}'!${nextPageRowIdx}:${
          nextPageRowIdx + nextPage.length
        }`,
        values: nextPage.map((data) =>
          richOutgoingTransferFields.map((fieldData) => {
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

  if (includeTransferPackagesReport) {
    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!1:1`,
      values: [
        richOutgoingInactiveTransferFields.map(
          (fieldData) => `     ${fieldData.readableName}     `
        ),
      ],
    });

    let nextPageStartIdx = 0;
    let nextPageRowIdx = 2;
    const pageSize = 2000;

    while (true) {
      const nextPage = flattenedOutgoingPackages.slice(
        nextPageStartIdx,
        nextPageStartIdx + pageSize
      );
      if (nextPage.length === 0) {
        break;
      }

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: `'${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!${nextPageRowIdx}:${
          nextPageRowIdx + nextPage.length
        }`,
        values: nextPage.map((data) =>
          richOutgoingInactiveTransferFields.map((fieldData) => {
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
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
            startIndex: 0,
            endIndex: 12, // TODO set to length of fields
          },
        },
      },
    ];
  }

  if (includeMaturePlantsReport) {
    maturePlantResizeRequests = [
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.MATURE_PLANTS),
            startIndex: 0,
            endIndex: 12,
          },
        },
      },
    ];
  }

  if (includeOutgoingTransfersReport) {
    outgoingTransferResizeRequests = [
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.OUTGOING_TRANSFERS),
            startIndex: 0,
            endIndex: 12,
          },
        },
      },
    ];
  }

  if (includeTransferPackagesReport) {
    departedTransferPackageResizeRequests = [
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.DEPARTED_TRANSFER_PACKAGES),
            startIndex: 0,
            endIndex: 12,
          },
        },
      },
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: [
      // Auto resize to fit added data
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
            startIndex: 1,
            endIndex: 12,
          },
        },
      },
      ...packageResizeRequests,
      ...maturePlantResizeRequests,
      ...outgoingTransferResizeRequests,
      ...departedTransferPackageResizeRequests,
    ],
  });

  return response.data.result;
}
