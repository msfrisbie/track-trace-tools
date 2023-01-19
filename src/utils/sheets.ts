// https://developers.google.com/sheets/api/reference/rest

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

  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values,
      }),
    }
  );
}
