import { IIndexedHarvestData, IIndexedPackageData, IIndexedPlantBatchData, IIndexedPlantData, IIndexedTransferData } from "@/interfaces";

export function maybePushOntoUniqueStack(value: any | null, stack: Array<string>): Array<string> {
  if (!value) {
    return stack;
  }

  const formattedValue = value.toString();

  // Remove from stack if it exists
  stack = stack.filter((x) => x !== formattedValue);

  // Push onto beginning
  stack.unshift(formattedValue);

  // Limit stack size
  stack = stack.slice(0, 50);

  return stack;
}

// Search the primary key
export async function sloppyObjectSearch(queryString: string, options?: {
  performFallbackSearch?: boolean,
  objectType?: 'package' | 'plant' | 'plantbatch' | 'harvest' | 'transfer'
}): Promise<{
  pkg?: IIndexedPackageData,
  plant?: IIndexedPlantData,
  plantBatch?: IIndexedPlantBatchData,
  harvest?: IIndexedHarvestData,
  incomingTransfer?: IIndexedTransferData
  outgoingTransfer?: IIndexedTransferData
}> {
  const match = {};

  return match;
}
