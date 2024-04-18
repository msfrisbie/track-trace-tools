import { METRC_TAG_REGEX, PackageState } from '@/consts';
import '@/test/utils/auto-mock-chrome';
import '@/test/utils/auto-mock-fetch';
import {
  getDelimiterSeparatedValuesOrError, getGrossWeightOrError, getIdOrError, getItemCategoryOrError, getItemNameOrError, getItemUnitOfMeasureNameOrError, getItemUnitQuantityAndUnitOrError, getLabelOrError, getLabTestingStateOrError, getQuantityOrError, getStrainNameOrError, getUnitOfMeasureNameOrError, getWholesalePriceOrError
} from './package';

describe('package.ts', () => {
  it('Extracts UnionPackage values correctly', () => {
    const pkg = {
      PackageState: PackageState.ACTIVE,
      Id: 3,
      Label: 'foo',
      Quantity: 9,
      UnitOfMeasureAbbreviation: 'g',
      Item: {
        StrainName: 'baz',
        Name: 'beep',
        UnitWeight: 20,
        UnitOfMeasureName: 'Grams',
        UnitWeightUnitOfMeasureAbbreviation: 'g',
        ProductCategoryName: 'Flower',
      },
      LabTestingStateName: 'NotRequired'
    } as any;

    const transferPkg = {
      PackageState: PackageState.TRANSFERRED,
      PackageId: 5,
      PackageLabel: 'bar',
      ShippedQuantity: 12,
      ShippedUnitOfMeasureAbbreviation: 'lb',
      ProductName: 'boop',
      ItemStrainName: 'qux',
      ItemUnitWeight: 30,
      ItemUnitWeightUnitOfMeasureAbbreviation: 'lb',
      ItemUnitQuantityUnitOfMeasureAbbreviation: 'lb',
      ProductCategoryName: 'Flower',
      LabTestingStateName: 'NotRequired',
      GrossWeight: 3,
      ShipperWholesalePrice: 6,
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

    expect(getStrainNameOrError(pkg)).toEqual('baz');
    expect(getStrainNameOrError(transferPkg)).toEqual('qux');
    expect(() => getStrainNameOrError(emptyPkg)).toThrowError();

    expect(getItemCategoryOrError(pkg)).toEqual('Flower');
    expect(getItemCategoryOrError(transferPkg)).toEqual('Flower');
    expect(() => getItemCategoryOrError(emptyPkg)).toThrowError();

    expect(getLabTestingStateOrError(pkg)).toEqual('NotRequired');
    expect(getLabTestingStateOrError(transferPkg)).toEqual('NotRequired');
    expect(() => getLabTestingStateOrError(emptyPkg)).toThrowError();

    expect(getGrossWeightOrError(pkg)).toEqual(null);
    expect(getGrossWeightOrError(transferPkg)).toEqual(3);
    expect(() => getGrossWeightOrError(emptyPkg)).toThrowError();

    expect(getGrossWeightOrError(pkg)).toEqual(null);
    expect(getWholesalePriceOrError(transferPkg)).toEqual(6);
    expect(() => getWholesalePriceOrError(emptyPkg)).toThrowError();

    expect(getItemUnitQuantityAndUnitOrError(pkg)).toEqual({
      quantity: 20,
      unitOfMeasureAbbreviation: 'g',
    });
    expect(getItemUnitQuantityAndUnitOrError(transferPkg)).toEqual({
      quantity: 30,
      unitOfMeasureAbbreviation: 'lb',
    });
    expect(() => getItemUnitQuantityAndUnitOrError(emptyPkg)).toThrowError();

    expect(getUnitOfMeasureNameOrError(pkg)).toEqual('Grams');
    expect(getUnitOfMeasureNameOrError(transferPkg)).toEqual('Pounds');
    expect(() => getUnitOfMeasureNameOrError(emptyPkg)).toThrowError();

    expect(getItemUnitOfMeasureNameOrError(pkg)).toEqual('Grams');
    expect(getItemUnitOfMeasureNameOrError(transferPkg)).toEqual('Pounds');
    expect(() => getItemUnitOfMeasureNameOrError(emptyPkg)).toThrowError();
  });

  it('Extracts delimiter separated values', () => {
    expect(getDelimiterSeparatedValuesOrError('foo, bar')).toEqual(['foo', 'bar']);
    expect(getDelimiterSeparatedValuesOrError('foo, bar', { delimiter: '|' })).toEqual([
      'foo, bar',
    ]);
    expect(
      getDelimiterSeparatedValuesOrError('1A4000000000000000001234, 1A4000000000000000005678', {
        regex: METRC_TAG_REGEX,
      }),
    ).toEqual(['1A4000000000000000001234', '1A4000000000000000005678']);

    expect(() =>
      getDelimiterSeparatedValuesOrError('1A4000000000000000001234, 1A400000000000...', {
        regex: METRC_TAG_REGEX,
      })).toThrowError();
    expect(() =>
      getDelimiterSeparatedValuesOrError('foobar', { regex: METRC_TAG_REGEX })).toThrowError();
    expect(() =>
      getDelimiterSeparatedValuesOrError('foobar,foobarbaz', { regex: METRC_TAG_REGEX })).toThrowError();
  });
});
