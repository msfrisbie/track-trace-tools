import { MessageType } from "@/consts";
import { IIndexedPackageData, ISpreadsheet } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { todayIsodate } from "./date";

export async function createExportSpreadsheetOrError({
  activePackages,
}: {
  activePackages?: IIndexedPackageData[];
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  const sheetTitles = ["Overview", "Packages"];

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

  let packageRequests: any[] = [];

  if (activePackages) {
    packageRequests = [
      // Add more rows
      {
        appendDimension: {
          dimension: "ROWS",
          length: activePackages.length,
          sheetId: sheetTitles.indexOf("Packages"),
        },
      },
      // Style top row - black bg, white text
      {
        repeatCell: {
          range: {
            sheetId: sheetTitles.indexOf("Packages"),
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
            sheetId: sheetTitles.indexOf("Packages"),
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
          sheetId: sheetTitles.indexOf("Overview"),
        },
      },
      ...packageRequests,
    ],
  });

  if (activePackages) {
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
      range: "Packages!1:1",
      values: [packageProperties],
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
        range: `Packages!${nextPageRowIdx}:${nextPageRowIdx + nextPage.length}`,
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

  let packageSummary: any[] = [];

  if (activePackages) {
    packageSummary = [null, "Active Packages", `=COUNTIF(Packages!C2:C, "ACTIVE")`];
  }

  await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
    spreadsheetId: response.data.result.spreadsheetId,
    range: "Overview",
    values: [
      [`Generated with Track & Trace Tools at ${Date().toString()}`],
      [],
      [null, "License", store.state.pluginAuth?.authState?.license],
      [],
      packageSummary,
    ],
  });

  await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
    spreadsheetId: response.data.result.spreadsheetId,
    requests: [
      // Auto resize to fit added data
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf("Overview"),
            startIndex: 1,
            endIndex: 12,
          },
        },
      },
      {
        autoResizeDimensions: {
          dimensions: {
            dimension: "COLUMNS",
            sheetId: sheetTitles.indexOf("Packages"),
            startIndex: 0,
            endIndex: 12,
          },
        },
      },
    ],
  });

  return response.data.result;
}
