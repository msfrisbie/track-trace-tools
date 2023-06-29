import {
  IIntermediateCreatePackageFromPackagesData,
  IIntermediateCreatePlantBatchFromPackageData,
  IIntermediatePromotePlantBatchData,
  IPackageData,
  IPlantBatchData,
  ITagData,
} from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { fStrip } from "./math";

const debugLog = debugLogFactory("utils/misc.ts");

export function allocatePromotePlantCounts(
  totalPlantCount: number,
  plantBatches: IPlantBatchData[]
): IIntermediatePromotePlantBatchData[] {
  let remainingTotal = totalPlantCount;

  let counter = 0;
  let selectedPlantBatchIndex = 0;

  const plantData: IIntermediatePromotePlantBatchData[] = [];

  while (true) {
    let selectedPlantBatch = plantBatches[selectedPlantBatchIndex];
    let selectedPlantBatchRemainingPlantCount = selectedPlantBatch.UntrackedCount;

    // killswitch
    if (++counter > 1000) {
      throw new Error("Killswitch");
    }

    const batchSize: number = Math.min(remainingTotal, selectedPlantBatchRemainingPlantCount, 100);

    debugLog(async () => ["Next batch size:", batchSize]);

    const nextBatch = {
      plantBatch: selectedPlantBatch,
      count: batchSize,
    };

    debugLog(async () => [nextBatch]);

    plantData.push(nextBatch);

    selectedPlantBatchRemainingPlantCount = fStrip(
      selectedPlantBatchRemainingPlantCount - batchSize
    );
    remainingTotal = fStrip(remainingTotal - batchSize);

    if (selectedPlantBatchRemainingPlantCount < 0) {
      throw new Error("Negative selectedPlantBatchRemainingPlantCount");
    }
    if (remainingTotal < 0) {
      throw new Error("Negative remainingTotal");
    }

    // Successfully finished, exit
    if (remainingTotal === 0) {
      break;
    }

    // This package is empty, move to the next one
    if (selectedPlantBatchRemainingPlantCount === 0) {
      selectedPlantBatchIndex += 1;
    }

    if (selectedPlantBatchIndex >= plantBatches.length) {
      throw new Error("Ran out of packages to pack from");
    }
  }

  return plantData;
}

export function divideTagsIntoRanges(tags: ITagData[], counts: number[]): ITagData[][] {
  if (tags.length !== counts.reduce((a, b) => a + b)) {
    throw new Error(`Mismatch! ${tags.length} ${counts.reduce((a, b) => a + b)}`);
  }

  const tagRanges: ITagData[][] = [];
  let acc = 0;

  for (let count of counts) {
    tagRanges.push(tags.slice(acc, acc + count));
    acc += count;
  }

  return tagRanges;
}

export function flattenTagsAndPlantBatches({
  tags,
  promoteDataList,
}: {
  tags: ITagData[];
  promoteDataList: IIntermediatePromotePlantBatchData[];
}): { tag: ITagData; plantBatch: IPlantBatchData }[] {
  const flattened: { tag: ITagData; plantBatch: IPlantBatchData }[] = [];

  let tagIdx = 0;

  for (let promoteData of promoteDataList) {
    for (let i = 0; i < promoteData.count; ++i) {
      const tag = tags[tagIdx];
      tagIdx++;

      flattened.push({ tag, plantBatch: promoteData.plantBatch });
    }
  }

  return flattened;
}

/**
 *
 * @param outputQuantities The desired package sizes in the same units as the input packages
 * @param inputPackages The range of packages to draw from
 * @returns
 */
export function allocatePackageQuantities(
  outputQuantities: number[],
  inputPackages: IPackageData[]
): IIntermediateCreatePackageFromPackagesData[] {
  let packageData: IIntermediateCreatePackageFromPackagesData[] = [];

  let selectedPackageIndex = 0;

  for (let newPackageQuantity of outputQuantities) {
    let remainingTotal = newPackageQuantity;

    let counter = 0;

    let outputPackageData: IIntermediateCreatePackageFromPackagesData = {
      ingredients: [],
      quantity: newPackageQuantity,
    };

    while (true) {
      let selectedPackage = inputPackages[selectedPackageIndex];
      let selectedPackageRemainingQuantity = selectedPackage.Quantity;

      // killswitch
      if (++counter > 1000) {
        throw new Error("Killswitch");
      }

      const batchSize: number = Math.min(remainingTotal, selectedPackageRemainingQuantity);

      debugLog(async () => ["Next batch size:", batchSize]);

      outputPackageData.ingredients.push({
        pkg: selectedPackage,
        quantity: batchSize,
      });

      debugLog(async () => [outputPackageData]);

      selectedPackageRemainingQuantity = fStrip(selectedPackageRemainingQuantity - batchSize);
      remainingTotal = fStrip(remainingTotal - batchSize);

      if (selectedPackageRemainingQuantity < 0) {
        throw new Error("Negative selectedPackageRemainingQuantity");
      }
      if (remainingTotal < 0) {
        throw new Error("Negative remainingTotal");
      }

      // Successfully finished, exit
      if (remainingTotal === 0) {
        break;
      }

      // This package is empty, move to the next one
      if (selectedPackageRemainingQuantity === 0) {
        selectedPackageIndex += 1;
      }

      if (selectedPackageIndex >= inputPackages.length) {
        throw new Error("Ran out of packages to pack from");
      }
    }

    packageData.push(outputPackageData);
  }

  return packageData;
}

// Weight based packages will adjust by 0
export function allocateImmaturePlantCounts(
  totalPlantCount: number,
  packages: IPackageData[]
): IIntermediateCreatePlantBatchFromPackageData[] {
  // Sanity check: is mixed?
  const unitOfMeasureSet = new Set();
  packages.map((pkg) => unitOfMeasureSet.add(pkg.Item.UnitOfMeasureName));
  if (unitOfMeasureSet.size !== 1) {
    throw new Error("Mixed units of measure provided");
  }

  const isWeightBased = packages[0].Item.UnitOfMeasureName !== "Each";

  // Sanity check: do we have enough?
  if (!isWeightBased) {
    if (totalPlantCount > packages.map((x) => x.Quantity).reduce((a, b) => a + b, 0)) {
      throw new Error("Not enough source package material to plant");
    }
  }

  let remainingTotal = totalPlantCount;

  debugLog(async () => ["weight based?", isWeightBased]);
  debugLog(async () => ["Tagging", totalPlantCount, "plants from", packages.length]);

  let counter = 0;
  let selectedPackageIndex = 0;

  const plantBatchData: IIntermediateCreatePlantBatchFromPackageData[] = [];

  while (true) {
    let selectedPackage = packages[selectedPackageIndex];
    let selectedPackageRemainingPlantCount = selectedPackage.Quantity;

    // killswitch
    if (++counter > 1000) {
      throw new Error("Killswitch");
    }

    let batchSize: number = Math.min(remainingTotal, 100);
    if (!isWeightBased) {
      batchSize = Math.min(remainingTotal, selectedPackageRemainingPlantCount, 100);
    }

    debugLog(async () => ["Next batch size:", batchSize]);

    // If weight based, adjustment amount is 0
    const quantity: number = isWeightBased ? 0 : batchSize;

    const nextBatch = {
      pkg: selectedPackage,
      count: batchSize,
      quantity,
      unitOfMeasureId: selectedPackage.Item.UnitOfMeasureId,
    };

    debugLog(async () => [nextBatch]);

    plantBatchData.push(nextBatch);

    if (!isWeightBased) {
      selectedPackageRemainingPlantCount -= batchSize;
    }
    remainingTotal -= batchSize;

    if (selectedPackageRemainingPlantCount < 0) {
      throw new Error("Negative selectedPackageRemainingPlantCount");
    }
    if (remainingTotal < 0) {
      throw new Error("Negative remainingTotal");
    }

    // Successfully finished, exit
    if (remainingTotal === 0) {
      break;
    }

    // This package is empty, move to the next one
    if (selectedPackageRemainingPlantCount === 0) {
      selectedPackageIndex += 1;
    }

    if (selectedPackageIndex >= packages.length) {
      throw new Error("Ran out of packages to pack from");
    }
  }

  return plantBatchData;
}

export function pad(x: string, len: number): string {
  return `${" ".repeat(len)}${x}${" ".repeat(len)}`;
}
