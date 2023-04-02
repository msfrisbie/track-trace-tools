// import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-store";
import { getIsoDateFromOffset } from "./date";

describe("date.ts", () => {
  it("Correctly calculates date offset", () => {
    expect(getIsoDateFromOffset(3, "2023-04-02T17:58:25.496Z")).toEqual("2023-04-05T17:58:25.496Z");
    expect(getIsoDateFromOffset(-3, "2023-04-02T17:58:25.496Z")).toEqual(
      "2023-03-30T17:58:25.496Z"
    );
  });
});
