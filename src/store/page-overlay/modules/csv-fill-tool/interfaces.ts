export interface ICsvFillToolState {}

export interface IHierarchyNode {
  el: Element;
  name: string;
  childSections: IHierarchyNode[];
  inputs: {
    el: Element;
    ngModel: string;
    name: string;
  }[];
  addSectionButton: Element | null;
}

export interface IModalInput {
  ngRepeat: string;
  ngModel: string;
  name: string;
  el: Element;
}
