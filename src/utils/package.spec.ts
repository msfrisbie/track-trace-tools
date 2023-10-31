import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";

import { METRC_TAG_REGEX } from "@/consts";
import { getDelimiterSeparatedValuesOrError } from "./package";

describe("package.ts", () => {
  it("Extracts delimiter separated values", () => {
    expect(getDelimiterSeparatedValuesOrError("foo, bar")).toEqual(["foo", "bar"]);
    expect(getDelimiterSeparatedValuesOrError("foo, bar", { delimiter: "|" })).toEqual([
      "foo, bar",
    ]);
    expect(
      getDelimiterSeparatedValuesOrError("1A4000000000000000001234, 1A4000000000000000005678", {
        regex: METRC_TAG_REGEX,
      })
    ).toEqual(["1A4000000000000000001234", "1A4000000000000000005678"]);

    expect(() =>
      getDelimiterSeparatedValuesOrError("1A4000000000000000001234, 1A400000000000...", {
        regex: METRC_TAG_REGEX,
      })).toThrowError();
    expect(() =>
      getDelimiterSeparatedValuesOrError("foobar", { regex: METRC_TAG_REGEX })).toThrowError();
    expect(() =>
      getDelimiterSeparatedValuesOrError("foobar,foobarbaz", { regex: METRC_TAG_REGEX })).toThrowError();
  });
});
