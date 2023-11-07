import { safeZip, sameLength } from './array';

describe('array.ts', () => {
  it('sameLength performs correct length evaluations', () => {
    expect(sameLength([])).toStrictEqual(true);
    expect(sameLength([1])).toStrictEqual(true);
    expect(sameLength([1, 1], [2, 2])).toStrictEqual(true);
    expect(sameLength([1, 1], [3, 3, 3], [2, 2])).toStrictEqual(false);
  });

  it('safeZip throws errors on bad zips', () => {
    expect(() => safeZip(
      [1, 2],
      ['a', 'b', 'c']
    )).toThrowError();
  });

  it('safeZip correctly zips', () => {
    expect(safeZip(
      [1, 2, 3],
      ['a', 'b', 'c']
    )).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
  });
});
