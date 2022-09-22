import { CompressedMetrcTags } from "./compression";

describe("compression.ts", () => {
  it("has the correct version", () => {
    const compressed = new CompressedMetrcTags();

    expect(compressed.version).toStrictEqual(1);
  });

  it("correctly inserts a collection of single type", () => {
    const rawCollection = [
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001234", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001235", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001237", jake: "hsu", foo: "bar" }
    ];

    const tagExtractor = (x: any) => x.tag;
    const propertyMask = (x: any) => ({ foo: x.foo });

    const compressedMetrcTags = new CompressedMetrcTags();

    compressedMetrcTags.insertCollection({
      tagExtractor,
      propertyMask,
      rawCollection
    });

    expect(compressedMetrcTags.compressedTagRanges).toEqual([
      {
        startTag: "1AFF00000000000000001234",
        endTag: "1AFF00000000000000001237",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[1]
      }
    ]);
  });

  it("correctly inserts a collection of dual type", () => {
    const rawCollection = [
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "baz" },
      { tag: "1AFF00000000000000001234", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001235", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001237", jake: "hsu", foo: "baz" }
    ];

    const tagExtractor = (x: any) => x.tag;
    const propertyMask = (x: any) => ({ foo: x.foo });

    const compressedMetrcTags = new CompressedMetrcTags();

    compressedMetrcTags.insertCollection({
      tagExtractor,
      propertyMask,
      rawCollection
    });

    expect(compressedMetrcTags.compressedTagRanges).toEqual([
      {
        startTag: "1AFF00000000000000001234",
        endTag: "1AFF00000000000000001235",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[1]
      },
      {
        startTag: "1AFF00000000000000001236",
        endTag: "1AFF00000000000000001237",
        maskedData: {
          foo: "baz"
        },
        rawData: rawCollection[0]
      }
    ]);
  });

  it("correctly inserts a collection of disjoint tags", () => {
    const rawCollection = [
      { tag: "1ADD00000000000000001236", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001234", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001235", jake: "hsu", foo: "bar" },
      { tag: "1ADD00000000000000001237", jake: "hsu", foo: "bar" }
    ];

    const tagExtractor = (x: any) => x.tag;
    const propertyMask = (x: any) => ({ foo: x.foo });

    const compressedMetrcTags = new CompressedMetrcTags();

    compressedMetrcTags.insertCollection({
      tagExtractor,
      propertyMask,
      rawCollection
    });

    expect(compressedMetrcTags.compressedTagRanges).toEqual([
      {
        startTag: "1ADD00000000000000001236",
        endTag: "1ADD00000000000000001237",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[0]
      },
      {
        startTag: "1AFF00000000000000001234",
        endTag: "1AFF00000000000000001235",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[1]
      }
    ]);
  });

  it("correctly inserts a collection with duplicate tags", () => {
    const rawCollection = [
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001234", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001235", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "baz" }
    ];

    const tagExtractor = (x: any) => x.tag;
    const propertyMask = (x: any) => ({ foo: x.foo });

    const compressedMetrcTags = new CompressedMetrcTags();

    compressedMetrcTags.insertCollection({
      tagExtractor,
      propertyMask,
      rawCollection
    });

    expect(compressedMetrcTags.compressedTagRanges).toEqual([
      {
        startTag: "1AFF00000000000000001234",
        endTag: "1AFF00000000000000001236",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[1]
      },
      {
        startTag: "1AFF00000000000000001236",
        endTag: "1AFF00000000000000001236",
        maskedData: {
          foo: "baz"
        },
        rawData: rawCollection[3]
      }
    ]);
  });

  it("finds matching tag data", () => {
    const rawCollection = [
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001234", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001235", jake: "hsu", foo: "bar" },
      { tag: "1AFF00000000000000001236", jake: "hsu", foo: "baz" },
      { tag: "1AFF00000000000000001237", jake: "hsu", foo: "qux" }
    ];

    const tagExtractor = (x: any) => x.tag;
    const propertyMask = (x: any) => ({ foo: x.foo });

    const compressedMetrcTags = new CompressedMetrcTags();

    compressedMetrcTags.insertCollection({
      tagExtractor,
      propertyMask,
      rawCollection
    });

    expect(compressedMetrcTags.find("1AFF00000000000000001236")).toEqual([
      {
        startTag: "1AFF00000000000000001234",
        endTag: "1AFF00000000000000001236",
        maskedData: {
          foo: "bar"
        },
        rawData: rawCollection[1]
      },
      {
        startTag: "1AFF00000000000000001236",
        endTag: "1AFF00000000000000001236",
        maskedData: {
          foo: "baz"
        },
        rawData: rawCollection[3]
      }
    ]);
  });

  // TODO different maps
  // TODO duplicate tags
});
