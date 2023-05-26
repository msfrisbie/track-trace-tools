import { IIndexedPackageData, IMetrcEmployeeData, IPackageHistoryData } from "@/interfaces";
import { ISampleAllocation } from "@/store/page-overlay/modules/employee-samples/interfaces";
import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-store";
import { getIsoDateFromOffset } from "./date";

const ADJUSTMENT_REGEX = new RegExp(`Package adjusted by -([0-9\.]+) ([a-zA-Z]+)`);
const EMPLOYEE_REGEX = new RegExp(`Note: ([^0-9]+) ([0-9]+)`);

export function getAvailableSamplesFromPackage(pkg: IIndexedPackageData): ISampleAllocation[] {
  const sampleAllocations: ISampleAllocation[] = [];

  return sampleAllocations;
}

export function getAllocatedSampleFromPackageHistoryEntryOrNull(
  historyEntry: IPackageHistoryData
): {
  employeeId: string;
  employeeName: string;
  quantity: number;
  unitOfMeasureName: string;
  isodate: string;
} | null {
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
  let employeeId: string | null = null;

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
  employeeId = employeeLineMatch[2];

  return {
    quantity,
    employeeId,
    employeeName,
    unitOfMeasureName,
    isodate: historyEntry.ActualDate,
  };
}

export function getAllocatedSamplesFromPackageHistoryOrError(pkg: IIndexedPackageData): {
  employeeId: number;
  employeeName: string;
  allocation: ISampleAllocation;
  isodate: string;
}[] {
  if (!pkg.history) {
    throw new Error("Package is missing history");
  }

  return [];
}

export function getEmployeeAllocationOnDate(
  employees: IMetrcEmployeeData[],
  samplePackages: IIndexedPackageData[],
  isodate: string,
  daysInSlidingWindow: number
): {
  employee: IMetrcEmployeeData;
  allocation: ISampleAllocation;
}[] {
  const startDate = getIsoDateFromOffset(-daysInSlidingWindow, isodate);

  // Sorted in received order
  const eligiblePackages = samplePackages
    .filter((pkg) => pkg.ReceivedDateTime! >= startDate)
    .sort((a, b) => a.ReceivedDateTime!.localeCompare(b.ReceivedDateTime!));

  return [];
}
