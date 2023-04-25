import { ICompressedMetrcTagRange, ICompressedMetrcTagRanges } from "@/interfaces";
import _ from "lodash";
import { getOffsetFromTag, isTagInsidePair } from "./tags";

interface IFormattedTagData {
  tag: string;
  maskedData: Object;
  rawData?: Object;
}

export class CompressedMetrcTags implements ICompressedMetrcTagRanges {
  private _version: number = 1;

  // Must be sorted for lookup, insertion, and unpacking
  private _compressedTagRanges: ICompressedMetrcTagRange[] = [];

  get version() {
    return this._version;
  }

  get compressedTagRanges() {
    return this._compressedTagRanges;
  }

  import(data: ICompressedMetrcTagRange[]) {
    this._compressedTagRanges = data;
  }

  // collection is an unsorted list
  insertCollection(
    {
      tagExtractor,
      propertyMask,
      rawCollection,
    }: {
      tagExtractor: (rawData: Object) => string;
      propertyMask: (rawData: Object) => Object;
      rawCollection: any[];
    },
    includeRawData: boolean = true
  ) {
    const sortedMaskedCollection: IFormattedTagData[] = rawCollection
      .map((data) => {
        const tag = tagExtractor(data);
        const maskedData = propertyMask(data);

        let parsed: IFormattedTagData = {
          tag,
          maskedData,
        };

        if (includeRawData) {
          parsed.rawData = data;
        }

        return parsed;
      })
      .sort((a, b) => (a.tag > b.tag ? 1 : -1));

    sortedMaskedCollection.map((x) => this.insert(x));

    this._compressedTagRanges.sort((a, b) => (a.startTag > b.startTag ? 1 : -1));
  }

  insert(data: IFormattedTagData) {
    for (const compressedTagRange of this._compressedTagRanges) {
      let tagOffset = null;

      try {
        tagOffset = getOffsetFromTag({ referenceTag: compressedTagRange.endTag, newTag: data.tag });
      } catch (e) {
        // Tag offset failed, not a match
        continue;
      }

      // If the tag offset is not the next tag in the range,
      // it is not in the range
      if (tagOffset !== 1) {
        continue;
      }

      // If the masked properties do not match,
      // it is not in the range
      if (!_.isEqual(data.maskedData, compressedTagRange.maskedData)) {
        continue;
      }

      // It does match, update the end tag
      compressedTagRange.endTag = data.tag;
      return;
    }

    // If this falls through to here,
    // add it as a new entry in the collection
    this._compressedTagRanges.push({
      startTag: data.tag,
      endTag: data.tag,
      maskedData: data.maskedData,
      rawData: data.rawData,
    });
  }

  find(tag: string): ICompressedMetrcTagRange[] {
    return this._compressedTagRanges.filter((compressedTagRange: ICompressedMetrcTagRange) => {
      return isTagInsidePair({
        startTag: compressedTagRange.startTag,
        endTag: compressedTagRange.endTag,
        targetTag: tag,
      });
    });
  }

  // TODO
  // Binary search for lookup

  // Request order:
  //
  // Flowering plants
  // Active packages
  // Unused tags

  // constructor() {

  // }
}

export function compressedDataWrapperFactory<T>(
  expanded: T[],
  indexedKey: string,
  keys?: string[]
): CompressedDataWrapper<T> {
  if (expanded.length === 0) {
    throw new Error("Cannot compress empty array");
  }

  if (!keys) {
    keys = Object.keys(expanded[0]);
  }

  keys.sort();

  const compressed: any[][] = [];

  for (const obj of expanded) {
    // @ts-ignore
    compressed.push(keys.map((key) => obj[key]));
  }

  return new CompressedDataWrapper<T>(compressed, indexedKey, keys);
}

export class CompressedDataWrapper<T> {
  data: any[][];
  keys: string[];
  indexedKey: string;
  index: Map<any, number>;

  constructor(data: any[][], indexedKey: string, keys: string[]) {
    this.data = data;
    this.keys = keys;
    this.indexedKey = indexedKey;
    this.index = new Map<any, number>();

    const j = this.keys.indexOf(indexedKey);

    for (let i = 0; i < data.length; ++i) {
      this.addToIndex(data[i][j], i);
    }
  }

  *[Symbol.iterator](): Generator<T> {
    for (const x of this.data) {
      yield this.unpack(x);
    }
  }

  add(object: T) {
    // @ts-ignore
    const index = object[this.indexedKey];
    const packed = this.pack(object);
    this.data.push(packed);
    this.addToIndex(index, this.data.length - 1);
  }

  private addToIndex(k: any, v: number) {
    if (this.index.has(k)) {
      throw new Error("Duplicate index!");
    }
    this.index.set(k, v);
  }

  findOrNull(key: any): T | null {
    const idx = this.index.get(key);

    if (idx === undefined) {
      return null;
    }

    return this.unpack(this.data[idx]);
  }

  pack<T>(input: T): any[] {
    // @ts-ignore
    return this.keys.map((k) => input[k]);
  }

  unpack<T>(input: any[]): T {
    const output: any = {};
    for (const [idx, k] of this.keys.entries()) {
      output[k] = input[idx];
    }
    return output as T;
  }

  update(indexValue: any, property: any, value: any) {
    const rowIdx = this.index.get(indexValue);

    if (!rowIdx) {
      throw new Error("Bad index");
    }

    this.data[rowIdx][this.keys.indexOf(property)] = value;
  }
}
