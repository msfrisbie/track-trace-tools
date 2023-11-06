import { METRC_TAG_REGEX } from "@/consts";
import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";
import {
  getDelimiterSeparatedValuesOrError, getIdOrError, getItemNameOrError, getItemUnitQuantityAndUnitOrError, getLabelOrError, getQuantityOrError, getStrainNameOrError
} from "./package";

describe("package.ts", () => {
  it("Extracts UnionPackage values correctly", () => {
    const pkg = {
      Id: 3,
      Label: 'foo',
      Quantity: 9,
      Item: {
        StrainName: 'baz',
        Name: 'beep',
        UnitWeight: 20,
        UnitWeightUnitOfMeasureAbbreviation: 'g'
      },
    } as any;

    const transferPkg = {
      PackageId: 5,
      PackageLabel: 'bar',
      ShippedQuantity: 12,
      ProductName: 'boop',
      ItemStrainName: 'qux',
      ItemUnitWeight: 30,
      ItemUnitWeightUnitOfMeasureAbbreviation: 'lb'
    } as any;

    const emptyPkg = {} as any;

    expect(getIdOrError(pkg)).toEqual(3);
    expect(getIdOrError(transferPkg)).toEqual(5);
    expect(() => getIdOrError(emptyPkg)).toThrowError();

    expect(getLabelOrError(pkg)).toEqual('foo');
    expect(getLabelOrError(transferPkg)).toEqual('bar');
    expect(() => getLabelOrError(emptyPkg)).toThrowError();

    expect(getQuantityOrError(pkg)).toEqual(9);
    expect(getQuantityOrError(transferPkg)).toEqual(12);
    expect(() => getQuantityOrError(emptyPkg)).toThrowError();

    expect(getStrainNameOrError(pkg)).toEqual('baz');
    expect(getStrainNameOrError(transferPkg)).toEqual('qux');
    expect(() => getStrainNameOrError(emptyPkg)).toThrowError();

    expect(getItemNameOrError(pkg)).toEqual('beep');
    expect(getItemNameOrError(transferPkg)).toEqual('boop');
    expect(() => getItemNameOrError(emptyPkg)).toThrowError();

    expect(getItemUnitQuantityAndUnitOrError(pkg)).toEqual({
      quantity: 20,
      unitOfMeasureAbbreviation: 'g'
    });
    expect(getItemUnitQuantityAndUnitOrError(transferPkg)).toEqual({

      quantity: 30,
      unitOfMeasureAbbreviation: 'lb'
    });
    expect(() => getItemUnitQuantityAndUnitOrError(emptyPkg)).toThrowError();
  });

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
