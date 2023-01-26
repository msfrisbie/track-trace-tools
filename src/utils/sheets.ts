// https://developers.google.com/sheets/api/reference/rest

// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append

// https://github.com/theoephraim/node-google-spreadsheet

import { customFetch } from "@/modules/fetch-manager.module";
import { getAuthTokenOrError } from "./oauth";

interface ISheet {
  properties: {
    sheetId: number; // 0
    title: string; // Sheet1
    index: number; // 0
    sheetType: string; // GRID
    gridProperties: {
      rowCount: number; // 1000
      columnCount: number; // 26
      frozenRowCount: number; // 1
    };
    tabColor: {
      red: number; // 1.0
      green: number; // 0.3
      blue: number; // 0.4
    };
  };
}

type ISheetValues = string[][];

interface IValueRange {
  range: string;
  majorDimension: "ROWS";
  values: ISheetValues;
}

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

function buildSheetsApiURL(path: string, params?: { [key: string]: string }): string {
  if (path[0] != "/") {
    throw new Error("Must prepend slash to path");
  }

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets${path}`);

  if (params) {
    url.search = new URLSearchParams(params).toString();
  }

  return url.toString();
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
