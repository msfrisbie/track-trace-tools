import {
  areTagsInSameRange,
  generateTagRangeOrError,
  getDuplicates,
  getOffsetFromTag,
  getTagFromOffset,
  getVoidTagBody,
  isTagInsidePair,
  isValidTag,
  numTagsInRange,
} from "./tags";

const SAMPLE_VALID_TAG = "1AFF00000000000000001234";

describe("tags.ts", () => {
  it("correctly identifies valid tags", () => {
    const INVALID_TAG = "asdf";

    expect(isValidTag(INVALID_TAG)).toEqual(false);
    expect(isValidTag(SAMPLE_VALID_TAG)).toEqual(true);
  });

  it("correctly identifies tags in the same range", () => {
    expect(areTagsInSameRange(SAMPLE_VALID_TAG, "1AFF00000000000000001235")).toEqual(true);
    expect(areTagsInSameRange(SAMPLE_VALID_TAG, "1AFZ00000000000000001235")).toEqual(false);
  });

  // it('correctly splits tags', () => {
  //     let { prefix, suffix } = splitPrefixSuffix(SAMPLE_VALID_TAG);

  //     expect(prefix).toEqual('1AFF000000000000');
  //     expect(suffix).toEqual('00001234');
  // })

  it("generates correct tag from offset", () => {
    const START_TAG = SAMPLE_VALID_TAG;

    expect(getTagFromOffset(START_TAG, 0)).toEqual(START_TAG);
    expect(getTagFromOffset(START_TAG, 1)).toEqual("1AFF00000000000000001235");
    expect(getTagFromOffset(START_TAG, -1)).toEqual("1AFF00000000000000001233");
    expect(getTagFromOffset(START_TAG, 10)).toEqual("1AFF00000000000000001244");
    expect(getTagFromOffset(START_TAG, 100)).toEqual("1AFF00000000000000001334");
    expect(getTagFromOffset(START_TAG, 1000)).toEqual("1AFF00000000000000002234");
  });

  it("generates correct tag ranges", () => {
    const START_TAG = SAMPLE_VALID_TAG;
    const END_TAG = "1AFF00000000000000001237";

    expect(generateTagRangeOrError(START_TAG, END_TAG)).toEqual([
      "1AFF00000000000000001234",
      "1AFF00000000000000001235",
      "1AFF00000000000000001236",
      "1AFF00000000000000001237",
    ]);
  });

  it("throws on incorrect tag ranges", () => {
    const START_TAG = SAMPLE_VALID_TAG;
    const UNRELATED_END_TAG = "1AFZ00000000000000001237";

    expect(() => generateTagRangeOrError(START_TAG, UNRELATED_END_TAG)).toThrowError();

    const TOO_HIGH_END_TAG = "1AFF00000000000010001235";

    expect(() => generateTagRangeOrError(START_TAG, TOO_HIGH_END_TAG)).toThrowError();

    const TOO_LOW_END_TAG = "1AFF00000000000000001233";

    expect(() => generateTagRangeOrError(START_TAG, TOO_LOW_END_TAG)).toThrowError();
  });

  it("creates valid tag void body", () => {
    expect(getVoidTagBody(123)).toEqual("=123");
  });

  it("correctly counts tags in range", () => {
    expect(numTagsInRange(SAMPLE_VALID_TAG, SAMPLE_VALID_TAG)).toEqual(1);
    expect(numTagsInRange(SAMPLE_VALID_TAG, "1AFF00000000000000001235")).toEqual(2);
    expect(numTagsInRange(SAMPLE_VALID_TAG, "1AFF00000000000000001243")).toEqual(10);
    expect(numTagsInRange(SAMPLE_VALID_TAG, "1AFF00000000000000001333")).toEqual(100);
  });

  it("correctly identifies tags in and out of pairs", () => {
    expect(
      isTagInsidePair({
        startTag: SAMPLE_VALID_TAG,
        endTag: SAMPLE_VALID_TAG,
        targetTag: SAMPLE_VALID_TAG,
      })
    ).toEqual(true);
    expect(
      isTagInsidePair({
        startTag: SAMPLE_VALID_TAG,
        endTag: "1AFF00000000000000001243",
        targetTag: SAMPLE_VALID_TAG,
      })
    ).toEqual(true);
    expect(
      isTagInsidePair({
        startTag: SAMPLE_VALID_TAG,
        endTag: "1AFF00000000000000001243",
        targetTag: "1AFF00000000000000001235",
      })
    ).toEqual(true);
    expect(
      isTagInsidePair({
        startTag: SAMPLE_VALID_TAG,
        endTag: "1AFF00000000000000001236",
        targetTag: "1AFF00000000000000001237",
      })
    ).toEqual(false);
    expect(
      isTagInsidePair({
        startTag: SAMPLE_VALID_TAG,
        endTag: "1AFF00000000000000001236",
        targetTag: "1AFF00000000000000001220",
      })
    ).toEqual(false);
  });

  it("correctly calculates offset", () => {
    expect(getOffsetFromTag({ referenceTag: SAMPLE_VALID_TAG, newTag: SAMPLE_VALID_TAG })).toEqual(
      0
    );
    expect(
      getOffsetFromTag({ referenceTag: SAMPLE_VALID_TAG, newTag: "1AFF00000000000000001235" })
    ).toEqual(1);
    expect(() =>
      getOffsetFromTag({ referenceTag: SAMPLE_VALID_TAG, newTag: "1AFF00000000000000001233" })).toThrowError();
  });

  it("correctly extracts duplicates", () => {
    expect(getDuplicates(["b", "a"])).toEqual([]);
    expect(getDuplicates(["a", "b", "a"])).toEqual(["a"]);
    expect(getDuplicates(["a", "b", "a", "b"])).toEqual(["a", "b"]);
    expect(getDuplicates(["b", "a", "a", "b"])).toEqual(["a", "b"]);
  });
});
