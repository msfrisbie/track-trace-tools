// import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-store";
import { getDatesInRange, getIsoDateFromOffset } from "./date";

describe("date.ts", () => {
  it("Correctly calculates date offset", () => {
    expect(getIsoDateFromOffset(3, "2023-04-02T17:58:25.496Z")).toEqual("2023-04-05T17:58:25.496Z");
    expect(getIsoDateFromOffset(-3, "2023-04-02T17:58:25.496Z")).toEqual(
      "2023-03-30T17:58:25.496Z"
    );

    expect(getIsoDateFromOffset(3, "2023-04-02")).toEqual("2023-04-05T00:00:00.000Z");
    expect(getIsoDateFromOffset(-3, "2023-04-02")).toEqual("2023-03-30T00:00:00.000Z");
  });

  it("Correctly generates date ranges", () => {
    expect(() => getDatesInRange("2023-03-27", "2023-03-26")).toThrowError();

    expect(getDatesInRange("2023-03-26", "2023-03-26")).toEqual(["2023-03-26"]);
    expect(getDatesInRange("2023-03-26", "2023-04-02")).toEqual([
      "2023-03-26",
      "2023-03-27",
      "2023-03-28",
      "2023-03-29",
      "2023-03-30",
      "2023-03-31",
      "2023-04-01",
      "2023-04-02",
    ]);
  });
});
