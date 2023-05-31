import { IIndexedPackageData, IMetrcEmployeeData, IPackageHistoryData } from "@/interfaces";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import {
  IHistoryAllocationData,
  INormalizedAllocation,
  ISampleAllocation,
} from "@/store/page-overlay/modules/employee-samples/interfaces";
import { v4 as uuidv4 } from "uuid";

const ADJUSTMENT_REGEX = new RegExp(`Package adjusted by -([0-9\.]+) ([a-zA-Z]+)`);
const EMPLOYEE_REGEX = new RegExp(`Note: ([^0-9]+) ([0-9]+)`);

export function getEstimatedNumberOfSamplesRemaining(pkg: IIndexedPackageData): number {
  if (pkg.Quantity === 0) {
    return 0;
  }

  if (pkg.UnitOfMeasureAbbreviation === "ea") {
    return pkg.Quantity;
  }

  return 1;
}

export function getAllocatedSampleFromPackageHistoryEntryOrNull(
  packageLabel: string,
  historyEntry: IPackageHistoryData
): IHistoryAllocationData | null {
  if (!historyEntry.Descriptions.find((x) => x.includes("Reason: Trade Sample"))) {
    return null;
  }

  if (!historyEntry.ActualDate) {
    console.error("No actual date");
    return null;
  }

  let quantity: number | null = null;
  let unitOfMeasureName: string | null = null;
  let employeeName: string | null = null;
  let employeeLicenseNumber: string | null = null;

  const [adjustmentLineMatch] = historyEntry.Descriptions.map((x) =>
    x.match(ADJUSTMENT_REGEX)
  ).filter((x) => !!x);
  const [employeeLineMatch] = historyEntry.Descriptions.map((x) => x.match(EMPLOYEE_REGEX)).filter(
    (x) => !!x
  );

  if (!adjustmentLineMatch || !employeeLineMatch) {
    console.error("Regex non-match");
    return null;
  }

  quantity = parseFloat(adjustmentLineMatch[1]);
  unitOfMeasureName = adjustmentLineMatch[2];
  employeeName = employeeLineMatch[1];
  employeeLicenseNumber = employeeLineMatch[2];

  return {
    packageLabel,
    quantity,
    employeeLicenseNumber,
    employeeName,
    unitOfMeasureName,
    isodate: historyEntry.ActualDate,
  };
}

export function getAllocatedSamplesFromPackageHistoryOrError(
  pkg: IIndexedPackageData
): IHistoryAllocationData[] {
  if (!pkg.history) {
    throw new Error("Package is missing history");
  }

  const allocatedSamples: IHistoryAllocationData[] = [];

  for (const entry of pkg.history) {
    const data = getAllocatedSampleFromPackageHistoryEntryOrNull(pkg.Label, entry);

    if (data) {
      allocatedSamples.push(data);
    }
  }

  return allocatedSamples;
}

export async function getSampleAllocationFromAllocationDataOrNull(
  employees: IMetrcEmployeeData[],
  packages: IIndexedPackageData[],
  allocationData: IHistoryAllocationData
): Promise<ISampleAllocation | null> {
  const employee = employees.find(
    (x) => parseInt(x.License.Number, 10) === parseInt(allocationData.employeeLicenseNumber, 10)
  );

  if (!employee) {
    console.error("No employee match, ignoring allocation");
    return null;
  }

  const pkg = packages.find((x) => x.Label === allocationData.packageLabel);

  if (!pkg) {
    console.error("No pkg match, ignoring allocation");
    return null;
  }

  return {
    uuid: uuidv4(),
    pkg,
    employee,
    adjustmentQuantity: allocationData.quantity,
    ...(await toNormalizedAllocationQuantity(pkg, allocationData.quantity)),
  };
}

export async function canEmployeeAcceptSample(
  employee: IMetrcEmployeeData,
  sample: { quantity: number; pkg: IIndexedPackageData },
  recordedAllocationBuffer: ISampleAllocation[],
  pendingAllocationBuffer: ISampleAllocation[]
): Promise<boolean> {
  // A producer or marijuana sales location is limited to transferring:

  // a total of 1 ounce of marijuana,
  // a total of 6grams of marijuana concentrate, and
  // marijuana-infused products with a total THC content of 2000 mgs

  // of internal product samples to each of its employees in a
  // 30-day period.
  const normalizedSample = await toNormalizedAllocationQuantity(sample.pkg, sample.quantity);

  const totalFlowerGrams =
    normalizedSample.flowerAllocationGrams +
    recordedAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.flowerAllocationGrams)
      .reduce((a, b) => a + b, 0) +
    pendingAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.flowerAllocationGrams)
      .reduce((a, b) => a + b, 0);

  if (totalFlowerGrams > 28) {
    return false;
  }

  const totalConcentrateGrams =
    normalizedSample.concentrateAllocationGrams +
    recordedAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.concentrateAllocationGrams)
      .reduce((a, b) => a + b, 0) +
    pendingAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.concentrateAllocationGrams)
      .reduce((a, b) => a + b, 0);

  if (totalConcentrateGrams > 6) {
    return false;
  }

  const totalInfusedGrams =
    normalizedSample.infusedAllocationGrams +
    recordedAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.infusedAllocationGrams)
      .reduce((a, b) => a + b, 0) +
    pendingAllocationBuffer
      .filter((x) => x.employee.Id === employee.Id)
      .map((x) => x.infusedAllocationGrams)
      .reduce((a, b) => a + b, 0);

  if (totalInfusedGrams > 2) {
    return false;
  }

  return true;
}

export async function toNormalizedAllocationQuantity(
  pkg: IIndexedPackageData,
  sampleQuantity: number
): Promise<INormalizedAllocation> {
  const FALLBACK_ALLOCATION = {
    flowerAllocationGrams: 0,
    concentrateAllocationGrams: 0,
    infusedAllocationGrams: 0.2,
  };

  const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  let flowerAllocationGrams = 0;
  let concentrateAllocationGrams = 0;
  let infusedAllocationGrams = 0;

  enum AllocationType {
    FLOWER,
    CONCENTRATE,
    INFUSED,
  }

  let allocationType: AllocationType = AllocationType.INFUSED;

  if (
    pkg.Item.ProductCategoryName.includes("Buds") ||
    pkg.Item.ProductCategoryName.includes("Shake")
  ) {
    allocationType = AllocationType.FLOWER;
  } else if (
    pkg.Item.ProductCategoryName.includes("Concentrate") ||
    pkg.Item.ProductCategoryName.includes("Vape")
  ) {
    allocationType = AllocationType.CONCENTRATE;
  }

  let computedQuantity = sampleQuantity;
  let unitOfWeightId = pkg.UnitOfMeasureId;

  if (
    pkg.UnitOfMeasureQuantityType === "VolumeBased" ||
    pkg.Item.QuantityTypeName === "VolumeBased"
  ) {
    return FALLBACK_ALLOCATION;
  }

  if (pkg.Item.UnitOfMeasureName === "Each") {
    computedQuantity = sampleQuantity * pkg.Item.UnitWeight!;
    unitOfWeightId = pkg.Item.UnitWeightUnitOfMeasureId!;
  }

  const unitOfMeasure = unitsOfMeasure.find((x) => x.Id === unitOfWeightId);
  const gramsUnitOfMeasure = unitsOfMeasure.find((x) => x.Name === "Grams")!;
  if (!unitOfMeasure || !gramsUnitOfMeasure) {
    throw new Error("Could not match unit of measure");
  }

  // Force into grams
  computedQuantity =
    computedQuantity * unitOfMeasure.ToBaseFactor * gramsUnitOfMeasure.FromBaseFactor;

  switch (allocationType) {
    case AllocationType.FLOWER:
      flowerAllocationGrams = computedQuantity;
      break;
    case AllocationType.CONCENTRATE:
      concentrateAllocationGrams = computedQuantity;
      break;
    case AllocationType.INFUSED:
      const match = pkg.Item.Name.match(`([0-9]+)\s?mg`);

      // Find "milligrams"
      if (match && match[1] && typeof parseInt(match[1], 10) === "number") {
        computedQuantity = parseInt(match[1], 10) / 1000;
      }

      // Edible: assume it cannot possibly be higher than 200mg per each
      infusedAllocationGrams = Math.min(0.2, computedQuantity);
      break;
  }

  return {
    flowerAllocationGrams,
    concentrateAllocationGrams,
    infusedAllocationGrams,
  };
}
