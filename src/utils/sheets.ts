// https://developers.google.com/sheets/api/reference/rest

// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append

// https://github.com/theoephraim/node-google-spreadsheet

import { ISheet, ISheetValues, ISpreadsheet, IValueRange } from "@/interfaces";
import { customFetch } from "@/modules/fetch-manager.module";
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
    sheets: sheetTitles.map((sheetTitle) => [
      {
        properties: {
          sheetType: "GRID",
          // sheetId: 0,
          title: sheetTitle,
          // gridProperties: {
          //   rowCount: 20,
          //   columnCount: 12,
          // },
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
}: {
  spreadsheetId: string;
  range: string;
  values: ISheetValues;
}) {
  const url = buildSheetsApiURL(`/${spreadsheetId}/values/${range}`, {
    valueInputOption: "USER_ENTERED",
  });

  const headers = await headersFactory();

  const payload: IValueRange = {
    range,
    majorDimension: "ROWS",
    values,
  };

  customFetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function addSheets() {}

export async function appendValues({
  spreadsheetId,
  range,
  values,
}: {
  spreadsheetId: string;
  range: string;
  values: ISheetValues;
}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
  const url = buildSheetsApiURL(`/${spreadsheetId}/values/${range}:append`, {
    valueInputOption: "USER_ENTERED",
  });

  const headers = await headersFactory();

  const payload: IValueRange = {
    range,
    majorDimension: "ROWS",
    values,
  };

  customFetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function batchUpdateSpreadsheet({}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
}

export async function batchUpdateValues({
  spreadsheetId,
  data,
}: {
  spreadsheetId: string;
  data: IValueRange[];
}) {
  // https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchUpdate
  const url = buildSheetsApiURL(`/${spreadsheetId}/values:batchUpdate`, {
    valueInputOption: "USER_ENTERED",
  });

  const headers = await headersFactory();

  customFetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data,
    }),
  });
}
