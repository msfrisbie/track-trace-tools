import { LRU } from "./cache";

describe("cache.ts", () => {
  it("Correctly implements a LRU cache", () => {
    const lru = new LRU<string>(["foo", "bar", "baz"]);

    expect(lru.elements).toEqual(["foo", "bar", "baz"]);
    lru.touch("bar");
    expect(lru.elements).toEqual(["bar", "foo", "baz"]);
    expect(() => lru.touch("qux")).toThrowError();
  });
});
