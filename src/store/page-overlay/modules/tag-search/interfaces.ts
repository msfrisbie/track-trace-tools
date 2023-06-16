import { IIndexedTagData, ITagSearchFilters } from "@/interfaces";

export interface ITagSearchState {
  tagSearchFilters: ITagSearchFilters;
  tags: IIndexedTagData[];
  selectedTag: IIndexedTagData | null;
}
