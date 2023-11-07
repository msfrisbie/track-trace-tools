import {
  IItemData, ILocationData, IPackageData, ITagData
} from '@/interfaces';

export interface ISplitPackageBuilderState {
  sourcePackage: IPackageData | null;
  sourcePackageAdjustQuantity: number | null;
  packageTags: ITagData[];
  quantityList: number[];
  note: string;
  packageIsodate: string;
  productionBatchNumber: string;
  remediationDate: string;
  remediationMethodId: string;
  remediationSteps: string;
  useSameItem: boolean;
  outputItem: IItemData | null;
  isDonation: boolean;
  isTradeSample: boolean;
  location: ILocationData | null;
  expirationDate: string;
}
