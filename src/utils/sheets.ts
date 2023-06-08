// https://developers.google.com/sheets/api/reference/rest

// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append

// https://github.com/theoephraim/node-google-spreadsheet

import {
  ISheet,
  ISheetValues,
  ISimpleSheet,
  ISimpleSpreadsheet,
  ISpreadsheet,
  IValueRange,
} from "@/interfaces";
import { customFetch, retryDefaults } from "@/modules/fetch-manager.module";
import { getAuthTokenOrError } from "./oauth";

async function headersFactory() {
  const token = await getAuthTokenOrError();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function extractSheetIdOrError(sheetUrl: string): string {
  const match = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (match && match[1] && match[1].length) {
    return match[1];
  }

  throw new Error("Unmatched sheet ID");
}

export function buildSheetsApiURL(path: string, params?: { [key: string]: string }): string {
  if (path[0] != "/") {
    throw new Error("Must prepend slash to path");
  }

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets${path}`);

  if (params) {
    url.search = new URLSearchParams(params).toString();
  }

  return url.toString();
}

export function getSimpleSpreadsheet(spreadsheet: ISpreadsheet): ISimpleSpreadsheet {
  const { spreadsheetId, spreadsheetUrl } = spreadsheet;
  const { title } = spreadsheet.properties;

  return {
    spreadsheetId,
    spreadsheetUrl,
    properties: {
      title,
    },
    sheets: spreadsheet.sheets.map(getSimpleSheet),
  };
}

export function getSimpleSheet(sheet: ISheet): ISimpleSheet {
  const { sheetId, title, index } = sheet.properties;

  return {
    properties: {
      sheetId,
      title,
      index,
    },
  };
}

export async function createSpreadsheet({
  title,
  sheetTitles,
}: {
  title: string;
  sheetTitles: string[];
}): Promise<ISpreadsheet> {
  const url = buildSheetsApiURL(`/`);

  const headers = await headersFactory();

  const payload = {
    properties: {
      title,
    },
    sheets: sheetTitles.map((sheetTitle, idx) => [
      {
        properties: {
          sheetType: "GRID",
          sheetId: idx,
          title: sheetTitle,
          gridProperties: {
            rowCount: 1,
            columnCount: 12,
          },
        },
      },
    ]),
  };

  return customFetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  }).then((response) => response.json());

  // {
  //   "spreadsheetId": "1zLwDLKVkjoS67LqtTiIOP1RLRm-JUxuSO9GqRlZwGxo",
  //   "properties": {
  //     "title": "My new spreadsheet",
  //     "locale": "en_US",
  //     "autoRecalc": "ON_CHANGE",
  //     "timeZone": "Etc/GMT",
  //     "defaultFormat": {
  //       "backgroundColor": {
  //         "red": 1,
  //         "green": 1,
  //         "blue": 1
  //       },
  //       "padding": {
  //         "top": 2,
  //         "right": 3,
  //         "bottom": 2,
  //         "left": 3
  //       },
  //       "verticalAlignment": "BOTTOM",
  //       "wrapStrategy": "OVERFLOW_CELL",
  //       "textFormat": {
  //         "foregroundColor": {},
  //         "fontFamily": "arial,sans,sans-serif",
  //         "fontSize": 10,
  //         "bold": false,
  //         "italic": false,
  //         "strikethrough": false,
  //         "underline": false,
  //         "foregroundColorStyle": {
  //           "rgbColor": {}
  //         }
  //       },
  //       "backgroundColorStyle": {
  //         "rgbColor": {
  //           "red": 1,
  //           "green": 1,
  //           "blue": 1
  //         }
  //       }
  //     },
  //     "spreadsheetTheme": {
  //       "primaryFontFamily": "Arial",
  //       "themeColors": [
  //         {
  //           "colorType": "TEXT",
  //           "color": {
  //             "rgbColor": {}
  //           }
  //         },
  //         {
  //           "colorType": "BACKGROUND",
  //           "color": {
  //             "rgbColor": {
  //               "red": 1,
  //               "green": 1,
  //               "blue": 1
  //             }
  //           }
  //         },
  //         {
  //           "colorType": "ACCENT1",
  //           "color": {
  //             "rgbColor": {
  //               "red": 0.25882354,
  //               "green": 0.52156866,
  //               "blue": 0.95686275
  //             }
  //           }
  //         },
  //         {
  //           "colorType": "LINK",
  //           "color": {
  //             "rgbColor": {
  //               "red": 0.06666667,
  //               "green": 0.33333334,
  //               "blue": 0.8
  //             }
  //           }
  //         }
  //       ]
  //     }
  //   },
  //   "sheets": [
  //     {
  //       "properties": {
  //         "sheetId": 0,
  //         "title": "Sheet1",
  //         "index": 0,
  //         "sheetType": "GRID",
  //         "gridProperties": {
  //           "rowCount": 20,
  //           "columnCount": 12
  //         }
  //       }
  //     }
  //   ],
  //   "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1zLwDLKVkjoS67LqtTiIOP1RLRm-JUxuSO9GqRlZwGxo/edit"
  // }
}

export async function getSheetProperties({ spreadsheetId }: { spreadsheetId: string }): Promise<{
  sheets: ISheet[];
}> {
  const url = buildSheetsApiURL(`/${spreadsheetId}`, { fields: "sheets.properties" });

  const headers = await headersFactory();

  // GET /v4/spreadsheets/spreadsheetId?fields=sheets.properties(sheetId,title,sheetType,gridProperties)

  return customFetch(url, {
    method: "GET",
    headers,
  }).then((response) => response.json());
}

export async function writeValues({
  spreadsheetId,
  range,
  values,
  valueInputOption,
}: {
  spreadsheetId: string;
  range: string;
  values: ISheetValues;
  valueInputOption?: "RAW" | "USER_ENTERED";
}) {
  const url = buildSheetsApiURL(`/${spreadsheetId}/values/${range}`, {
    valueInputOption: valueInputOption ?? "USER_ENTERED",
  });

  const headers = await headersFactory();

  const payload: IValueRange = {
    range,
    majorDimension: "ROWS",
    values,
  };

  return customFetch(url, {
    ...retryDefaults,
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function appendValues({
  spreadsheetId,
  range,
  values,
  valueInputOption,
}: {
  spreadsheetId: string;
  range: string;
  values: ISheetValues;
  valueInputOption?: "RAW" | "USER_ENTERED";
}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
  const url = buildSheetsApiURL(`/${spreadsheetId}/values/${range}:append`, {
    valueInputOption: valueInputOption ?? "USER_ENTERED",
  });

  const headers = await headersFactory();

  const payload: IValueRange = {
    range,
    majorDimension: "ROWS",
    values,
  };

  return customFetch(url, {
    ...retryDefaults,
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function batchUpdate({
  spreadsheetId,
  requests,
}: {
  spreadsheetId: string;
  requests: any[];
}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
  // https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}:batchUpdate
  const url = buildSheetsApiURL(`/${spreadsheetId}:batchUpdate`);

  const headers = await headersFactory();

  return customFetch(url, {
    ...retryDefaults,
    method: "POST",
    headers,
    body: JSON.stringify({
      requests,
    }),
  });
}

export async function batchUpdateValues({
  spreadsheetId,
  data,
  valueInputOption,
}: {
  spreadsheetId: string;
  data: IValueRange[];
  valueInputOption?: "RAW" | "USER_ENTERED";
}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate
  // https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchUpdate
  const url = buildSheetsApiURL(`/${spreadsheetId}/values:batchUpdate`);

  const headers = await headersFactory();

  return customFetch(url, {
    ...retryDefaults,
    method: "POST",
    headers,
    body: JSON.stringify({
      data,
      valueInputOption: valueInputOption ?? "USER_ENTERED",
    }),
  });
}

export function addRowsRequestFactory({ sheetId, length }: { sheetId: number; length: number }) {
  return {
    appendDimension: {
      dimension: "ROWS",
      // Adding 0 rows causes the Sheets API to 500
      length: Math.max(length, 1),
      sheetId,
    },
  };
}

export function styleTopRowRequestFactory({ sheetId }: { sheetId: number }) {
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

export function shrinkFontRequestFactory({ sheetId }: { sheetId: number }) {
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

export function freezeTopRowRequestFactory({ sheetId }: { sheetId: number }) {
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

export function autoResizeDimensionsRequestFactory({
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

export function conditionalFormattingRequestFactory({
  sheetId,
  range,
  customFormula,
  backgroundColor,
}: {
  sheetId: number;
  range: {
    startColumnIndex?: number;
    endColumnIndex?: number;
    startRowIndex?: number;
    endRowIndex?: number;
  };
  customFormula: string;
  backgroundColor: { red?: number; green?: number; blue?: number };
}) {
  return {
    addConditionalFormatRule: {
      rule: {
        ranges: [
          {
            sheetId,
            ...range,
          },
        ],
        booleanRule: {
          condition: {
            type: "CUSTOM_FORMULA",
            values: [
              {
                userEnteredValue: customFormula,
              },
            ],
          },
          format: {
            backgroundColor,
          },
        },
      },
      index: 0,
    },
  };
}

// 0 -> A
export function getLetterFromIndex(columnIndex: number): string {
  return String.fromCharCode(columnIndex + 97).toUpperCase();
}
