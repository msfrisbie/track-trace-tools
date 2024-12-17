export interface ICsvFillToolState {}

// top level is always array
// line [
//   { values: x, y, z }
//   children: [
//   ]
// ]

// export interface IHierarchyNode {
//   el: Element;
//   name: string;
//   childSections: IHierarchyNode[];
//   inputs: {
//     el: Element;
//     ngModel: string;
//     name: string;
//   }[];
//   addSectionButton: Element | null;
// }

export interface IModalInput {
  ngRepeat: string;
  ngModel: string;
  name: string;
  el: Element;
}

export interface ICsvFillField {
  ngModel: string
  value: string
}

export interface ICsvFillSectionGroup {
  ngRepeat: string
  sections: []
}

export interface ICsvFillSection {
  fields: ICsvFillField[],
  sectionGroups: ICsvFillSectionGroup[]
}
