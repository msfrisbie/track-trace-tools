import { ReportType } from "@/interfaces";

export function reportIsCurrentSnapshot(reportType: ReportType): boolean {
  return [
    "CURRENT_PACKAGE_SNAPSHOT",
    "CURRENT_PLANT_SNAPSHOT",
    "CURRENT_PLANT_BATCH_SNAPSHOT"
    ].includes(reportType);
}