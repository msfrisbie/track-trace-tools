import { MessageType } from "@/consts";
import {
  IDestinationData,
  IIndexedPackageData,
  IIndexedRichTransferData,
  IPackageData,
  ISpreadsheet,
  ITransferData,
} from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig, IReportData } from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "./date";

enum SheetTitles {
  OVERVIEW = "Overview",
  PACKAGES = "Packages",
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
  if (reportConfig[ReportType.ACTIVE_PACKAGES] && reportData[ReportType.ACTIVE_PACKAGES]) {
    includeActivePackageReport = true;
    activePackages = reportData[ReportType.ACTIVE_PACKAGES]
      ?.activePackages as IIndexedPackageData[];
  }

  let includeTransferPackagesReport: boolean = false;
  let richOutgoingInactiveTransfers: IIndexedRichTransferData[] = [];
  if (reportConfig[ReportType.TRANSFER_PACKAGES] && reportData[ReportType.TRANSFER_PACKAGES]) {
    includeTransferPackagesReport = true;
    richOutgoingInactiveTransfers = reportData[ReportType.TRANSFER_PACKAGES]
      ?.richOutgoingInactiveTransfers as IIndexedRichTransferData[];
  }

  //
  // Generate Sheets
  //

  const sheetTitles: SheetTitles[] = [SheetTitles.OVERVIEW];

  if (includeActivePackageReport) {
    sheetTitles.push(SheetTitles.PACKAGES);
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
                red: 0.0,
                green: 0.0,
                blue: 0.0,
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

  let richOutgoingInactiveTransfersRequests: any[] = [];
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

    richOutgoingInactiveTransfersRequests = [
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
                red: 0.0,
                green: 0.0,
                blue: 0.0,
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
      ...richOutgoingInactiveTransfersRequests,
    ],
  });

  //
  // Generate Data Matrix
  //

  if (includeActivePackageReport) {
    const packageProperties = [
      "Label",
      "LicenseNumber",
      "PackageState",
      "Item.Name",
      "Quantity",
      "UnitOfMeasureAbbreviation",
      "PackagedDate",
      "LocationName",
      "PackagedByFacilityLicenseNumber",
      "LabTestingStateName",
      "ProductionBatchNumber",
    ];

    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.PACKAGES}'!1:1`,
      values: [packageProperties.map((x) => `     ${x}     `)],
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
          packageProperties.map((property) => {
            let value = pkg;
            for (const subProperty of property.split(".")) {
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
    const richOutgoingInactiveTransferProperties = [
      "Transfer.ManifestNumber",
      "Transfer.ShipmentLicenseTypeName",
      "Transfer.ShipperFacilityName",
      "Transfer.ShipperFacilityLicenseNumber",
      "Destination.RecipientFacilityName",
      "Destination.RecipientFacilityLicenseNumber",
      "Destination.EstimatedDepartureDateTime",
      "Package.PackageLabel",
      "Package.ProductName",
      "Package.ShippedQuantity",
      "Package.ShippedUnitOfMeasureAbbreviation",
    ];

    await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!1:1`,
      values: [richOutgoingInactiveTransferProperties.map((x) => `     ${x}     `)],
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
          richOutgoingInactiveTransferProperties.map((property) => {
            let value = data;
            for (const subProperty of property.split(".")) {
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

  let packageSummary: any[] = [];
  let departedTransferPackageSummary: any[] = [];

  if (includeActivePackageReport) {
    packageSummary = [
      null,
      "Active Packages",
      `=COUNTIF('${SheetTitles.PACKAGES}'!C2:C, "ACTIVE")`,
    ];
  }

  if (includeTransferPackagesReport) {
    departedTransferPackageSummary = [
      null,
      "Departed Packages",
      `=COUNT('${SheetTitles.DEPARTED_TRANSFER_PACKAGES}'!A2:A)`,
    ];
  }

  await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
    spreadsheetId: response.data.result.spreadsheetId,
    range: `'${SheetTitles.OVERVIEW}'`,
    values: [
      [`Generated with Track & Trace Tools at ${Date().toString()}`],
      [],
      [null, "License", store.state.pluginAuth?.authState?.license],
      [],
      packageSummary,
      departedTransferPackageSummary,
    ],
  });

  //
  // Write All Values
  //

  let packageResizeRequests: any[] = [];
  let departedTransferPackageResizeRequests: any[] = [];

  if (includeActivePackageReport) {
    packageResizeRequests = [
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf(SheetTitles.PACKAGES),
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
      ...departedTransferPackageResizeRequests,
    ],
  });

  return response.data.result;
}
