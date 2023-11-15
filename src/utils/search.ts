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

export async function sloppyObjectSearch(queryString: string): Promise<{
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
