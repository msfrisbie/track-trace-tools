// https://developers.google.com/sheets/api/reference/rest

// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append

// https://github.com/theoephraim/node-google-spreadsheet

import { getAuthTokenOrError } from "./oauth";

interface ISheet {
  properties: {
    sheetId: 0;
    title: "Sheet1";
    index: 0;
    sheetType: "GRID";
    gridProperties: {
      rowCount: 1000;
      columnCount: 26;
    };
  };
}

interface IValueRange {
  range: string;
  majorDimension: "ROWS";
  values: string[][];
}

export function sheetsApi(path: string, params?: { [key: string]: string }): string {
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
  const token = await getAuthTokenOrError();

  return fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?&fields=sheets.properties`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  ).then((response) => response.json());
}

export async function writeValues({
  spreadsheetId,
  range,
  values,
}: {
  spreadsheetId: string;
  range: string;
  values: string[][];
}) {
  const token = await getAuthTokenOrError();

  const payload: IValueRange = {
    range,
    majorDimension: "ROWS",
    values,
  };

  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function addSheets() {}

export async function batchUpdateSpreadsheet({}) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
}

export async function batchUpdateValues({
  spreadsheetId,
  range,
  values,
}: {
  spreadsheetId: string;
  range: string;
  values: string[][];
}) {
  // https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchUpdate

  const token = await getAuthTokenOrError();

  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [],
      }),
    }
  );
}
