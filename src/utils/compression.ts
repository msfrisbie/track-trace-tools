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
  name: string,
  expanded: T[],
  indexedKey: string,
  keys?: string[]
): CompressedDataWrapper<T> {
  if (expanded.length === 0) {
    console.error("Compressing empty array");
    console.trace();
    return new CompressedDataWrapper("Empty", [], "", []);
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

  return new CompressedDataWrapper<T>(name, compressed, indexedKey, keys);
}

export class CompressedDataWrapper<T> {
  name: string;
  data: any[][];
  keys: string[];
  indexedKey: string;
  index: Map<any, number>;
  duplicateCounter: number = 0;

  constructor(name: string, data: any[][], indexedKey: string, keys: string[]) {
    this.name = name;
    this.data = [];
    this.keys = keys;
    this.indexedKey = indexedKey;
    this.index = new Map<any, number>();

    const j = this.keys.indexOf(indexedKey);

    if (j === -1) {
      throw new Error(`Bad indexedKey: ${indexedKey} --- ${keys.toString()}`);
    }

    let skippedCt = 0;

    for (const [i, row] of data.entries()) {
      const key = row[j];

      if (this.index.has(key)) {
        ++skippedCt;
        continue;
      }

      this.data.push(row);
      this.index.set(key, i);
    }

    if (skippedCt > 0) {
      console.error(`${this.name} skipped: ${skippedCt} insertions`);
    }
  }

  *[Symbol.iterator](): Generator<T> {
    for (const x of this.data) {
      yield this.unpack(x);
    }
  }

  flushCounter() {
    console.log(`${this.name} logged ${this.duplicateCounter} duplicate additions`);
    this.duplicateCounter = 0;
  }

  add(object: T): boolean {
    // @ts-ignore
    const key = object[this.indexedKey];
    if (this.index.has(key)) {
      this.duplicateCounter++;
      return false;
    }
    const packed = this.pack(object);
    this.data.push(packed);
    this.index.set(key, this.data.length - 1);
    return true;
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
