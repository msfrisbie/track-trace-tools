import { IIndexedTagData, ITagSearchFilters } from "@/interfaces";

export interface ISelectedTagMetadata {
  tagData: IIndexedTagData;
  sectionName: string;
  priority: number;
}

export interface ITagSearchState {
  searchInflight: boolean;
  tagSearchFilters: ITagSearchFilters;
  tags: IIndexedTagData[];
  selectedTagMetadata: ISelectedTagMetadata | null;
}
