import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";
import {
  extractMultiplierFromItemNamesOrError,
  extractMultiplierFromItemNamesWithPackStrategyOrError,
} from "./cogs-v2-report";

describe("cogs-v2-report.ts", () => {
  it("Correctly extracts multiplier from item names", () => {
    expect(
      extractMultiplierFromItemNamesOrError({
        parentItemName: "foo 10mg bar",
        childItemName: "foo 10mg bar",
      })
    ).toEqual(1);
    expect(
      extractMultiplierFromItemNamesOrError({
        parentItemName: "foo 10mg bar",
        childItemName: "foo 100mg bar",
      })
    ).toEqual(0.1);
    expect(
      extractMultiplierFromItemNamesOrError({
        parentItemName: "foo 100mg bar",
        childItemName: "foo 10mg bar",
      })
    ).toEqual(10);
    expect(
      extractMultiplierFromItemNamesOrError({
        parentItemName: "100 mg bar",
        childItemName: "10 mg bar",
      })
    ).toEqual(10);
    expect(() =>
      extractMultiplierFromItemNamesOrError({
        parentItemName: "100 mg bar",
        childItemName: "mg bar",
      })).toThrowError();
    expect(() =>
      extractMultiplierFromItemNamesOrError({
        parentItemName: "10 mg bar",
        childItemName: "foo mg bar",
      })).toThrowError();

    expect(
      extractMultiplierFromItemNamesWithPackStrategyOrError({
        parentItemName: "foo bar",
        childItemName: "foo bar - 5 Pack",
      })
    ).toEqual(0.2);

    expect(() =>
      extractMultiplierFromItemNamesWithPackStrategyOrError({
        parentItemName: "foo bar - 2 Pack",
        childItemName: "foo bar - 8 Pack",
      })).toThrowError();

    expect(
      extractMultiplierFromItemNamesWithPackStrategyOrError({
        parentItemName: "foo bar",
        childItemName: "foo bar - 8 Pack",
      })
    ).toEqual(0.125);

    expect(
      extractMultiplierFromItemNamesWithPackStrategyOrError({
        parentItemName: "foo bar - baz",
        childItemName: "foo bar - 5 Pack - baz",
      })
    ).toEqual(0.2);

    expect(() =>
      extractMultiplierFromItemNamesWithPackStrategyOrError({
        parentItemName: "foo bar baz",
        childItemName: "foo bar 10mg",
      })).toThrowError();
  });
});
