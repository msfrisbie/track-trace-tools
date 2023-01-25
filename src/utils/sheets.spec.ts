import { sheetsApi } from "./sheets";

describe("sheets.ts", () => {
  it("Correctly builds a sheets API URL", () => {
    expect(sheetsApi("/foobar")).toEqual("https://sheets.googleapis.com/v4/spreadsheets/foobar");
    expect(sheetsApi("/foobar", { foo: "bar" })).toEqual(
      "https://sheets.googleapis.com/v4/spreadsheets/foobar?foo=bar"
    );
  });
});
