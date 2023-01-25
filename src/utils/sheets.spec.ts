import { extractSheetIdOrError, sheetsAPI } from "./sheets";

describe("sheets.ts", () => {
  it("Correctly builds a sheets API URL", () => {
    expect(sheetsAPI("/foobar")).toEqual("https://sheets.googleapis.com/v4/spreadsheets/foobar");
    expect(sheetsAPI("/foobar", { foo: "bar" })).toEqual(
      "https://sheets.googleapis.com/v4/spreadsheets/foobar?foo=bar"
    );
  });

  it("Correctly extracts sheet IDs", () => {
    const spreadsheetId = `13e1XNpC9CSs7oAkbUlI3B-So9_-UN6vU3XOE7zxzJT4`;

    expect(
      extractSheetIdOrError(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`)
    ).toEqual(spreadsheetId);

    expect(() => extractSheetIdOrError("foobar")).toThrowError();
  });
});
