import {
  IHarvestFilter,
  IIndexedHarvestData,
  IIndexedPackageData,
  IPluginState,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";
import {
  extractChildPackageLabelsFromHistory,
  extractHarvestChildPackageLabelsFromHistory,
} from "../history";
import { convertUnits } from "../units";

interface IHarvestPackagesReportFormFilters {
  harvestDateGt: string;
  harvestDateLt: string;
  shouldFilterHarvestDateGt: boolean;
  shouldFilterHarvestDateLt: boolean;
  licenseOptions: string[];
  licenses: string[];
}

export function getPackageSegment(pkg: IIndexedPackageData): {
  materialType: string;
  stage: string;
} {
  if (pkg.IsTestingSample) {
    // return {
    // }
  }

  return {
    materialType: "Unknown",
    stage: "Unknown",
  };
}

export const harvestPackagesFormFiltersFactory: () => IHarvestPackagesReportFormFilters = () => ({
  harvestDateGt: todayIsodate(),
  harvestDateLt: todayIsodate(),
  shouldFilterHarvestDateGt: true,
  shouldFilterHarvestDateLt: true,
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  // .filter((x) => x.startsWith("PR-") || x.startsWith("AU-P")),
});

export function addHarvestPackagesReport({
  reportConfig,
  harvestPackagesFormFilters,
}: {
  reportConfig: IReportConfig;
  harvestPackagesFormFilters: IHarvestPackagesReportFormFilters;
}) {
  const harvestFilter: IHarvestFilter = {};

  const licenses: string[] = harvestPackagesFormFilters.licenses;

  harvestFilter.harvestDateGt = harvestPackagesFormFilters.shouldFilterHarvestDateGt
    ? harvestPackagesFormFilters.harvestDateGt
    : null;

  harvestFilter.harvestDateLt = harvestPackagesFormFilters.shouldFilterHarvestDateLt
    ? harvestPackagesFormFilters.harvestDateLt
    : null;

  reportConfig[ReportType.HARVEST_PACKAGES] = {
    harvestFilter,
    licenses,
    fields: null,
  };
}

export async function maybeLoadHarvestPackagesReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES];

  let dataLoader: DataLoader | null = null;

  let harvests: IIndexedHarvestData[] = [];
  let packages: IIndexedPackageData[] = [];
  let unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  const gramUnitOfMeasure = unitsOfMeasure.find((x) => x.Abbreviation === "g")!;
  const poundUnitOfmeasure = unitsOfMeasure.find((x) => x.Abbreviation === "lb")!;

  if (harvestConfig?.harvestFilter) {
    for (const license of harvestConfig.licenses) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loading ${license} harvests...`, level: "success" },
      });

      dataLoader = await getDataLoaderByLicense(license);

      try {
        harvests = [...harvests, ...(await dataLoader.activeHarvests())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load active harvests.", level: "warning" },
        });
      }

      try {
        harvests = [...harvests, ...(await dataLoader.inactiveHarvests())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive harvests.", level: "warning" },
        });
      }

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loading ${license} packages...`, level: "success" },
      });

      try {
        packages = [...packages, ...(await dataLoader.activePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load active packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.onHoldPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load onhold packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.inTransitPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load intransit packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.inactivePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive packages.", level: "warning" },
        });
      }
    }

    harvests = harvests.filter((harvest) => {
      if (harvestConfig.harvestFilter.harvestDateLt) {
        if (harvest.HarvestStartDate > harvestConfig.harvestFilter.harvestDateLt) {
          return false;
        }
      }

      if (harvestConfig.harvestFilter.harvestDateGt) {
        if (harvest.HarvestStartDate < harvestConfig.harvestFilter.harvestDateGt) {
          return false;
        }
      }

      return true;
    });

    const harvestPackageMatrix: any[][] = [];

    const packageMap = new Map<string, IIndexedPackageData>(packages.map((x) => [x.Label, x]));

    const harvestHistoryPromises: Promise<any>[] = [];

    // For each harvest in the range, load its history
    harvests.map((harvest) => {
      harvestHistoryPromises.push(
        getDataLoaderByLicense(harvest.LicenseNumber)
          .then((dataLoader) => dataLoader.harvestHistoryByHarvestId(harvest.Id))
          .then((history) => {
            harvest.history = history;
          })
      );
    });

    const settledHarvestHistoryPromises = await Promise.allSettled(harvestHistoryPromises);

    if (settledHarvestHistoryPromises.find((x) => x.status === "rejected")) {
      throw new Error("Harvest history request failed");
    }

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Extracting package history...", level: "success" },
    });

    for (const harvest of harvests) {
      const harvestPackageLabels = extractHarvestChildPackageLabelsFromHistory(harvest.history!);

      for (const harvestPackageLabel of harvestPackageLabels) {
        const harvestPackage = packageMap.get(harvestPackageLabel);

        if (!harvestPackage) {
          harvestPackageMatrix.push([
            ...Array(10).fill(""),
            `Could not match harvest package ${harvestPackageLabel}`,
          ]);
        } else {
          const strainName = harvestPackage.Item.StrainName ?? "Unknown Strain";

          harvestPackageMatrix.push([
            harvestPackage.LicenseNumber,
            harvest.Name,
            harvestPackage.Label, //.slice(-8).replace(/^0+/, ""),
            "",
            strainName,
            "",
            "Denug",
            convertUnits(
              harvestPackage.Quantity,
              unitsOfMeasure.find(
                (x) => x.Abbreviation === harvestPackage.UnitOfMeasureAbbreviation
              )!,
              gramUnitOfMeasure
            ),
            convertUnits(
              harvestPackage.Quantity,
              unitsOfMeasure.find(
                (x) => x.Abbreviation === harvestPackage.UnitOfMeasureAbbreviation
              )!,
              poundUnitOfmeasure
            ),
            "Denug",
          ]);

          dataLoader = await getDataLoaderByLicense(harvestPackage.LicenseNumber);

          harvestPackage.history = await dataLoader.packageHistoryByPackageId(harvestPackage.Id);

          // Also extract waste, moisture loss, adjustments
          const childPackageLabels = extractChildPackageLabelsFromHistory(harvestPackage.history);

          console.log({ childPackageLabels });

          for (const childPackageLabel of childPackageLabels) {
            const childPackage = packageMap.get(childPackageLabel);

            if (!childPackage) {
              harvestPackageMatrix.push([
                ...Array(10).fill(""),
                `Could not match child package ${childPackageLabel}`,
              ]);
            } else {
              harvestPackageMatrix.push([
                childPackage.LicenseNumber,
                harvest.Name,
                "",
                childPackage.Label, //.slice(-8).replace(/^0+/, ""),
                strainName,
                "",
                childPackage.Item.Name, // TODO convert
                convertUnits(
                  childPackage.Quantity,
                  unitsOfMeasure.find(
                    (x) => x.Abbreviation === childPackage.UnitOfMeasureAbbreviation
                  )!,
                  gramUnitOfMeasure
                ),
                convertUnits(
                  childPackage.Quantity,
                  unitsOfMeasure.find(
                    (x) => x.Abbreviation === childPackage.UnitOfMeasureAbbreviation
                  )!,
                  poundUnitOfmeasure
                ),
                "Denug", // TODO convert
                "Child",
              ]);

              dataLoader = await getDataLoaderByLicense(childPackage.LicenseNumber);

              childPackage.history = await dataLoader.packageHistoryByPackageId(childPackage.Id);

              const grandchildPackageLabels = extractChildPackageLabelsFromHistory(
                childPackage.history
              );

              for (const grandchildPackageLabel of grandchildPackageLabels) {
                const grandchildPackage = packageMap.get(grandchildPackageLabel);

                if (!grandchildPackage) {
                  harvestPackageMatrix.push([
                    ...Array(10).fill(""),
                    `Could not match grandchild package ${grandchildPackageLabel}`,
                  ]);
                } else {
                  harvestPackageMatrix.push([
                    grandchildPackage.LicenseNumber,
                    harvest.Name,
                    "",
                    grandchildPackage.Label, //.slice(-8).replace(/^0+/, ""),
                    strainName,
                    "",
                    grandchildPackage.Item.Name, // TODO convert
                    convertUnits(
                      grandchildPackage.Quantity,
                      unitsOfMeasure.find(
                        (x) => x.Abbreviation === grandchildPackage.UnitOfMeasureAbbreviation
                      )!,
                      gramUnitOfMeasure
                    ),
                    convertUnits(
                      grandchildPackage.Quantity,
                      unitsOfMeasure.find(
                        (x) => x.Abbreviation === grandchildPackage.UnitOfMeasureAbbreviation
                      )!,
                      poundUnitOfmeasure
                    ),
                    "Denug", // TODO convert
                    "Grandchild",
                  ]);
                }
              }
            }
          }
        }
      }
    }

    harvestPackageMatrix.unshift([
      "License",
      "Harvest ID",
      "Source Tag",
      "Batch Tag",
      "Strain",
      "Rename",
      "Material Type",
      "Grams",
      "Pounds",
      "Stage",
      "Note",
    ]);

    reportData[ReportType.HARVEST_PACKAGES] = {
      harvestPackageMatrix,
    };
  }
}

export function extractHarvestPackagesData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  return reportData[ReportType.HARVEST_PACKAGES]!.harvestPackageMatrix;
}
