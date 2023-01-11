import { LRU } from "./cache";

describe("cache.ts", () => {
  it("Correctly implements LRU cache", () => {
    const intElements: number[] = [1, 2, 3, 4, 5];
    const objectElements: { id: number }[] = intElements.map((x) => ({ id: x }));

    const intLRU = new LRU(intElements);
    const objectLRU = new LRU(objectElements);

    expect(intElements).toEqual(intLRU.elements);
    expect(objectElements).toEqual(objectLRU.elements);

    expect(() => intLRU.touch(6)).toThrowError();
    expect(() => objectLRU.touch({ id: 4 })).toThrowError();

    intLRU.touch(intElements[3]);
    objectLRU.touch(objectElements[3]);

    expect(intLRU.elements).toEqual([4, 1, 2, 3, 5]);
    expect(objectLRU.elements).toEqual([4, 1, 2, 3, 5].map((x) => ({ id: x })));
  });
});
