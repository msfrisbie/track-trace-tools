import { METRC_INT_SUFFIX_CHARCOUNT, METRC_TAG_REGEX } from "@/consts";

export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0) {
    return false;
  }

  const match = tag.match(METRC_TAG_REGEX);

  return !!match;
}

export function validTagPairOrError(startTag: string, endTag: string) {
  validTagOrError(startTag, "Invalid start tag");
  validTagOrError(endTag, "Invalid end tag");
  tagsInSameRangeOrError(startTag, endTag);
  startTagLessThanOrEqualToEndTagOrError(startTag, endTag);
}

export function areTagsInSameRange(tag1: string, tag2: string): boolean {
  return splitPrefixSuffix(tag1).prefix === splitPrefixSuffix(tag2).prefix;
}

export function tagsInSameRangeOrError(tag1: string, tag2: string) {
  if (!areTagsInSameRange(tag1, tag2)) {
    throw new Error("Tags not in same range");
  }
}

export function validTagOrError(tag: string, errorMessage = "Invalid tag") {
  if (!isValidTag(tag)) {
    throw new Error(errorMessage);
  }
}

export function startTagLessThanOrEqualToEndTag(startTag: string, endTag: string): boolean {
  const startTagComponents = splitPrefixSuffix(startTag);
  const endTagComponents = splitPrefixSuffix(endTag);

  return startTagComponents.suffixInt <= endTagComponents.suffixInt;
}

export function startTagLessThanOrEqualToEndTagOrError(startTag: string, endTag: string) {
  if (!startTagLessThanOrEqualToEndTag(startTag, endTag)) {
    throw new Error("Start tag is not less than end tag");
  }
}

export function generateTagRangeOrError(startTag: string, endTag: string): string[] {
  validTagPairOrError(startTag, endTag);

  if (numTagsInRange(startTag, endTag) > 1e5) {
    throw new Error("More than 100000 tags in this range");
  }

  const tagList = [];

  for (let i = 0; ; ++i) {
    const nextTag = getTagFromOffset(startTag, i);

    tagList.push(nextTag);

    if (nextTag === endTag) {
      break;
    }

    if (i > 1e5) {
      throw new Error("Exceeded tag upper bound");
    }
  }

  return tagList;
}

function splitPrefixSuffix(tag: string): { prefix: string; suffix: string; suffixInt: number } {
  validTagOrError(tag);

  const prefixCharcount = tag.length - METRC_INT_SUFFIX_CHARCOUNT;

  const prefix = tag.slice(0, prefixCharcount);
  const suffix = tag.slice(prefixCharcount);
  const suffixInt = parseInt(suffix, 10);

  return { prefix, suffix, suffixInt };
}

// Match this behavior to chars_at_offset in tag.py
export function getTagFromOffset(tag: string, offset: number): string {
  validTagOrError(tag);

  const { prefix, suffix, suffixInt } = splitPrefixSuffix(tag);

  const offsetSuffixInt = suffixInt + offset;

  const offsetSuffix = offsetSuffixInt.toString().padStart(METRC_INT_SUFFIX_CHARCOUNT, "0");

  return prefix + offsetSuffix;
}

export function numTagsInRange(startTag: string, endTag: string) {
  validTagPairOrError(startTag, endTag);

  const startTagComponents = splitPrefixSuffix(startTag);
  const endTagComponents = splitPrefixSuffix(endTag);

  return endTagComponents.suffixInt - startTagComponents.suffixInt + 1;
}

export function isTagInsidePair({
  startTag,
  endTag,
  targetTag,
}: {
  targetTag: string;
  startTag: string;
  endTag: string;
}): boolean {
  validTagOrError(targetTag);

  validTagPairOrError(startTag, endTag);

  const targetTagComponents = splitPrefixSuffix(targetTag);
  const startTagComponents = splitPrefixSuffix(startTag);
  const endTagComponents = splitPrefixSuffix(endTag);

  if (targetTagComponents.prefix !== startTagComponents.prefix) {
    return false;
  }

  if (targetTagComponents.suffixInt < startTagComponents.suffixInt) {
    return false;
  }

  if (targetTagComponents.suffixInt > endTagComponents.suffixInt) {
    return false;
  }

  return true;
}

// -1 means it is the preceding tag
// 0 means it is the same tag
// 1 means it is the next tag
export function getOffsetFromTag({
  referenceTag,
  newTag,
}: {
  referenceTag: string;
  newTag: string;
}): number {
  validTagPairOrError(referenceTag, newTag);

  const referenceTagComponents = splitPrefixSuffix(referenceTag);
  const newTagComponents = splitPrefixSuffix(newTag);

  return newTagComponents.suffixInt - referenceTagComponents.suffixInt;
}

export function getVoidTagBody(tagId: number): string {
  return `=${tagId}`;
}

export function getDuplicates(tags: string[]) {
  const uniques: Set<string> = new Set();
  const duplicates: Set<string> = new Set();

  tags.map((x) => {
    if (uniques.has(x)) {
      duplicates.add(x);
    }
    uniques.add(x);
  });

  return [...duplicates].sort();
}
