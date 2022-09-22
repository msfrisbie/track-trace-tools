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
      rawCollection
    }: {
      tagExtractor: (rawData: Object) => string;
      propertyMask: (rawData: Object) => Object;
      rawCollection: any[];
    },
    includeRawData: boolean = true
  ) {
    const sortedMaskedCollection: IFormattedTagData[] = rawCollection
      .map(data => {
        const tag = tagExtractor(data);
        const maskedData = propertyMask(data);

        let parsed: IFormattedTagData = {
          tag,
          maskedData
        };

        if (includeRawData) {
          parsed.rawData = data;
        }

        return parsed;
      })
      .sort((a, b) => (a.tag > b.tag ? 1 : -1));

    sortedMaskedCollection.map(x => this.insert(x));

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
      rawData: data.rawData
    });
  }

  find(tag: string): ICompressedMetrcTagRange[] {
    return this._compressedTagRanges.filter((compressedTagRange: ICompressedMetrcTagRange) => {
      return isTagInsidePair({
        startTag: compressedTagRange.startTag,
        endTag: compressedTagRange.endTag,
        targetTag: tag
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
