import { IIndexedPackageData, IMetrcEmployeeData, IPackageHistoryData } from "@/interfaces";
import {
  IHistoryAllocationData,
  ISampleAllocation,
} from "@/store/page-overlay/modules/employee-samples/interfaces";

const ADJUSTMENT_REGEX = new RegExp(`Package adjusted by -([0-9\.]+) ([a-zA-Z]+)`);
const EMPLOYEE_REGEX = new RegExp(`Note: ([^0-9]+) ([0-9]+)`);

export function getEstimatedNumberOfSamplesRemaining(pkg: IIndexedPackageData): number {
  if (pkg.Quantity === 0) {
    return 0;
  }

  // TODO
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

// export function getEmployeeAllocationOnDate(
//   employees: IMetrcEmployeeData[],
//   samplePackages: IIndexedPackageData[],
//   isodate: string,
//   daysInSlidingWindow: number
// ): {
//   employee: IMetrcEmployeeData;
//   allocation: ISampleAllocation;
// }[] {
//   const startDate = getIsoDateFromOffset(-daysInSlidingWindow, isodate);

//   const eligiblePackages = samplePackages
//     .filter((pkg) => pkg.ReceivedDateTime! >= startDate)
//     .sort((a, b) => a.ReceivedDateTime!.localeCompare(b.ReceivedDateTime!));

//   return [];
// }

export function getSampleAllocationFromAllocationDataOrNull(
  employees: IMetrcEmployeeData[],
  packages: IIndexedPackageData[],
  allocationData: IHistoryAllocationData
): ISampleAllocation | null {
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
    pkg,
    employee,
    adjustmentQuantity: allocationData.quantity,
    // TODO
    flowerAllocationGrams: 1,
    concentrateAllocationGrams: 0,
    infusedAllocationGrams: 0,
  };
}

export function canEmployeeAcceptSample(
  employee: IMetrcEmployeeData,
  sample: { quantity: number; pkg: IIndexedPackageData },
  recordedAllocationBuffer: ISampleAllocation[],
  pendingAllocationBuffer: ISampleAllocation[]
): boolean {
  // TODO
  return true;
}
