import { sheetsAPI } from "./sheets";

describe("sheets.ts", () => {
  it("Correctly builds a sheets API URL", () => {
    expect(sheetsAPI("/foobar")).toEqual("https://sheets.googleapis.com/v4/spreadsheets/foobar");
    expect(sheetsAPI("/foobar", { foo: "bar" })).toEqual(
      "https://sheets.googleapis.com/v4/spreadsheets/foobar?foo=bar"
    );
  });
});
