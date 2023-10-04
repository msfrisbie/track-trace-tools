import {
  IHarvestFilter,
  IIndexedDestinationPackageData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IPluginState,
  IUnionIndexedPackageData,
  IUnitOfMeasure,
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
  extractAdjustmentReasonNoteSetsFromHistory,
  extractChildPackageLabelsFromHistory,
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractHarvestChildPackageLabelsFromHistory,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractTestSamplePackageLabelsFromHistory,
} from "../history";
import {
  getIdOrError,
  getItemNameOrError,
  getItemUnitOfMeasureAbbreviationOrError,
  getLabelOrError,
  getStrainNameOrError,
} from "../package";
import { findMatchingTransferPackages } from "../transfer";
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

  function generateUnitsPair(quantity: number, pkg: IUnionIndexedPackageData): [number, number] {
    return [
      convertUnitsImpl(
        quantity,
        unitsOfMeasure.find(
          (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
        )!,
        gramUnitOfMeasure
      ),
      convertUnitsImpl(
        quantity,
        unitsOfMeasure.find(
          (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
        )!,
        poundUnitOfmeasure
      ),
    ];
  }

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

    const packageMap = new Map<string, IUnionIndexedPackageData>(packages.map((x) => [x.Label, x]));

    async function getPackageFromOutboundTransferOrNull(
      label: string,
      license: string,
      parentPackage?: IIndexedPackageData
    ): Promise<[IIndexedRichOutgoingTransferData, IIndexedDestinationPackageData] | null> {
      const abortController = new AbortController();

      let richTransfer: IIndexedRichOutgoingTransferData | null = null;
      let transferPkg: IIndexedDestinationPackageData | null = null;

      await findMatchingTransferPackages({
        queryString: label,
        startDate: parentPackage?.PackagedDate ?? null,
        licenses: [license],
        signal: abortController.signal,
        updateFn: (transfers) => {
          for (const transfer of transfers) {
            for (const destination of transfer.outgoingDestinations!) {
              for (const pkg of destination.packages!) {
                if (getLabelOrError(pkg) === label) {
                  richTransfer = transfer;
                  transferPkg = pkg;

                  abortController.abort();
                  break;
                }
              }
            }
          }
        },
      });

      if (richTransfer && transferPkg) {
        return [richTransfer, transferPkg];
      }

      return null;
    }

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

    const packageHistoryPromises: Promise<any>[] = [];

    const pkgQueue: [IUnionIndexedPackageData, number][] = [];

    for (const harvest of harvests) {
      const harvestPackageLabels = extractHarvestChildPackageLabelsFromHistory(harvest.history!);

      for (const harvestPackageLabel of harvestPackageLabels) {
        const harvestPackage = packageMap.get(harvestPackageLabel);

        if (!harvestPackage) {
          continue;
        }

        pkgQueue.push([harvestPackage, 0]);
      }
    }

    while (true) {
      if (pkgQueue.length === 0) {
        await Promise.allSettled(packageHistoryPromises);

        if (pkgQueue.length === 0) {
          break;
        }
      }

      const [pkg, depth] = pkgQueue.pop()!;

      dataLoader = await getDataLoaderByLicense(pkg.LicenseNumber);

      packageHistoryPromises.push(
        dataLoader.packageHistoryByPackageId(getIdOrError(pkg)).then(async (history) => {
          pkg.history = history;

          if (depth === 2) {
            return;
          }

          const childPackageLabels = extractChildPackageLabelsFromHistory(history);

          for (const childPackageLabel of childPackageLabels) {
            const childPkg = packageMap.get(childPackageLabel);

            if (!childPkg) {
              continue;
            }

            pkgQueue.push([childPkg, depth + 1]);
          }
        })
      );
    }

    await Promise.allSettled(packageHistoryPromises);

    for (const harvest of harvests) {
      const harvestPackageLabels = extractHarvestChildPackageLabelsFromHistory(harvest.history!);

      for (const harvestPackageLabel of harvestPackageLabels) {
        const harvestPackage = packageMap.get(harvestPackageLabel);

        if (!harvestPackage) {
          const transferredPackage = await getPackageFromOutboundTransferOrNull(
            harvestPackageLabel,
            harvest.LicenseNumber
          );

          if (transferredPackage) {
          } else {
            harvestPackageMatrix.push([
              ...Array(10).fill(""),
              `Could not match harvest package ${harvestPackageLabel}`,
            ]);
          }

          continue;
        }

        const strainName = getStrainNameOrError(harvestPackage);

        const initailHarvestPackageQuantity =
          extractInitialPackageQuantityAndUnitFromHistoryOrError(harvestPackage.history!);

        harvestPackageMatrix.push([
          harvestPackage.LicenseNumber,
          harvest.Name,
          getLabelOrError(harvestPackage).slice(-8).replace(/^0+/, ""),
          "",
          strainName,
          "",
          "Denug",
          ...generateUnitsPair(initailHarvestPackageQuantity[0], harvestPackage),
          "Denug",
        ]);

        const childPackageLabels = extractChildPackageLabelsFromHistory(harvestPackage.history!);

        for (const childPackageLabel of childPackageLabels) {
          const childPackage = packageMap.get(childPackageLabel);

          if (!childPackage) {
            harvestPackageMatrix.push([
              ...Array(10).fill(""),
              `Could not match child package ${childPackageLabel}`,
            ]);

            continue;
          }

          // dataLoader = await getDataLoaderByLicense(childPackage.LicenseNumber);

          // childPackage.history = await dataLoader.packageHistoryByPackageId(
          //   getIdOrError(childPackage)
          // );

          const [initialChildQuantity, unit] =
            extractInitialPackageQuantityAndUnitFromHistoryOrError(childPackage.history!);

          if (getItemNameOrError(childPackage).includes("Trim")) {
            continue;
          }

          const childLabTestLabels = extractTestSamplePackageLabelsFromHistory(
            childPackage.history!
          );

          const childSets = extractChildPackageTagQuantityUnitSetsFromHistory(
            childPackage.history!
          );

          let totalChildTestQuantity = 0;

          for (const childLabTestLabel of childLabTestLabels) {
            for (const childSet of childSets) {
              if (childLabTestLabel === childSet[0]) {
                totalChildTestQuantity += childSet[1];
              }
            }
          }

          const childAdjustmentReasonNoteSets = extractAdjustmentReasonNoteSetsFromHistory(
            childPackage.history!
          );

          let childWasteTotal = 0;
          let childMLOverpackTotal = 0;

          for (const childAdjustmentReasonNote of childAdjustmentReasonNoteSets) {
            if (childAdjustmentReasonNote.reason.includes("Waste")) {
              childWasteTotal += childAdjustmentReasonNote.quantity;
            } else {
              childMLOverpackTotal += childAdjustmentReasonNote.quantity;
            }
          }

          harvestPackageMatrix.push([
            childPackage.LicenseNumber,
            harvest.Name,
            "",
            getLabelOrError(childPackage).slice(-8).replace(/^0+/, ""),
            strainName,
            "",
            getItemNameOrError(childPackage), // TODO convert
            ...generateUnitsPair(initialChildQuantity, childPackage),
            "Post QC Batch",
            "Child",
          ]);

          harvestPackageMatrix.push([
            childPackage.LicenseNumber,
            harvest.Name,
            "",
            getLabelOrError(childPackage).slice(-8).replace(/^0+/, ""),
            strainName,
            "",
            getItemNameOrError(childPackage), // TODO convert
            ...generateUnitsPair(totalChildTestQuantity, childPackage),
            "Post QC Lab Testing",
            "Child",
          ]);

          const grandchildPackageLabels = extractChildPackageLabelsFromHistory(
            childPackage.history!
          );

          for (const grandchildPackageLabel of grandchildPackageLabels) {
            const grandchildPackage = packageMap.get(grandchildPackageLabel);

            if (!grandchildPackage) {
              harvestPackageMatrix.push([
                ...Array(10).fill(""),
                `Could not match grandchild package ${grandchildPackageLabel}`,
              ]);

              continue;
            }

            // dataLoader = await getDataLoaderByLicense(grandchildPackage.LicenseNumber);

            // grandchildPackage.history = await dataLoader.packageHistoryByPackageId(
            //   getIdOrError(grandchildPackage)
            // );

            const [initialGrandchildQuantity, unit] =
              extractInitialPackageQuantityAndUnitFromHistoryOrError(grandchildPackage.history!);

            const grandchildLabTestLabels = extractTestSamplePackageLabelsFromHistory(
              grandchildPackage.history!
            );

            const grandchildSets = extractChildPackageTagQuantityUnitSetsFromHistory(
              grandchildPackage.history!
            );

            let totalGrandchildTestQuantity = 0;

            for (const grandchildLabTestLabel of grandchildLabTestLabels) {
              for (const grandchildSet of grandchildSets) {
                if (grandchildLabTestLabel === grandchildSet[0]) {
                  totalGrandchildTestQuantity += grandchildSet[1];
                }
              }
            }

            const grandchildAdjustmentReasonNoteSets = extractAdjustmentReasonNoteSetsFromHistory(
              grandchildPackage.history!
            );

            let grandchildWasteTotal = 0;
            let grandchildMLOverpackTotal = 0;
            let grandchildShakeTotal = 0;

            for (const grandchildAdjustmentReasonNote of grandchildAdjustmentReasonNoteSets) {
              if (grandchildAdjustmentReasonNote.reason.includes("Waste")) {
                grandchildWasteTotal += grandchildAdjustmentReasonNote.quantity;
              } else {
                grandchildMLOverpackTotal += grandchildAdjustmentReasonNote.quantity;
              }
            }

            harvestPackageMatrix.push([
              grandchildPackage.LicenseNumber,
              harvest.Name,
              "",
              getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
              strainName,
              "",
              getItemNameOrError(grandchildPackage), // TODO convert
              ...generateUnitsPair(initialGrandchildQuantity, grandchildPackage),
              "Packaging Intake",
              "Grandchild",
            ]);

            harvestPackageMatrix.push([
              grandchildPackage.LicenseNumber,
              harvest.Name,
              "",
              getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
              strainName,
              "",
              getItemNameOrError(grandchildPackage) + " - Prepack", // TODO convert
              ...generateUnitsPair(
                initialGrandchildQuantity -
                  (grandchildMLOverpackTotal + grandchildWasteTotal + grandchildShakeTotal),
                grandchildPackage
              ),
              "Packaging",
              "Grandchild",
            ]);

            harvestPackageMatrix.push([
              grandchildPackage.LicenseNumber,
              harvest.Name,
              "",
              getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
              strainName,
              "",
              "Waste", // TODO convert...generateUnitsPair(
              ...generateUnitsPair(
                initialGrandchildQuantity -
                  (grandchildMLOverpackTotal + grandchildWasteTotal + grandchildShakeTotal),
                grandchildPackage
              ),
              "Packaging - Waste",
              "Grandchild",
            ]);

            harvestPackageMatrix.push([
              grandchildPackage.LicenseNumber,
              harvest.Name,
              "",
              getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
              strainName,
              "",
              "Shake", // TODO convert ...generateUnitsPair(
              ...generateUnitsPair(grandchildShakeTotal, grandchildPackage),
              "Packaging - Sent to Lab",
              "Grandchild",
            ]);

            harvestPackageMatrix.push([
              grandchildPackage.LicenseNumber,
              harvest.Name,
              "",
              getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
              strainName,
              "",
              "Moisture Loss", // TODO convert
              ...generateUnitsPair(grandchildMLOverpackTotal, grandchildPackage),
              "Packaging ML/Overpack",
              "Grandchild",
            ]);
          }
        }

        for (const childPackageLabel of childPackageLabels) {
          const childPackage = packageMap.get(childPackageLabel);

          if (!childPackage) {
            harvestPackageMatrix.push([
              ...Array(10).fill(""),
              `Could not match child package ${childPackageLabel}`,
            ]);

            continue;
          }

          // dataLoader = await getDataLoaderByLicense(childPackage.LicenseNumber);

          // childPackage.history = await dataLoader.packageHistoryByPackageId(
          //   getIdOrError(childPackage)
          // );

          const [initialChildQuantity, unit] =
            extractInitialPackageQuantityAndUnitFromHistoryOrError(childPackage.history!);

          if (getItemNameOrError(childPackage).includes("Trim")) {
            harvestPackageMatrix.push([
              harvestPackage.LicenseNumber,
              harvest.Name,
              getLabelOrError(harvestPackage).slice(-8).replace(/^0+/, ""),
              "",
              strainName,
              "",
              "Trim",
              ...generateUnitsPair(initialChildQuantity, childPackage),
              "Post Machine Trim - Sent to Lab",
            ]);
          }
        }

        const harvestPackageAdjustmentReasonNoteSets = extractAdjustmentReasonNoteSetsFromHistory(
          harvestPackage.history!
        );

        for (const harvestPackageAdjustmentReasonNote of harvestPackageAdjustmentReasonNoteSets) {
          let materialType = "Adjustment";

          if (harvestPackageAdjustmentReasonNote.reason.includes("Waste")) {
            materialType = "Waste";
          } else if (harvestPackageAdjustmentReasonNote.reason.includes("Moisture")) {
            materialType = "Process Loss";
          }

          harvestPackageMatrix.push([
            harvestPackage.LicenseNumber,
            harvest.Name,
            getLabelOrError(harvestPackage).slice(-8).replace(/^0+/, ""),
            "",
            strainName,
            "",
            materialType,
            ...generateUnitsPair(harvestPackageAdjustmentReasonNote.quantity, harvestPackage),
            "Denug",
          ]);
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

function convertUnitsImpl(
  quantity: number,
  fromUnitOfMeasure: IUnitOfMeasure,
  toUnitOfMeasure: IUnitOfMeasure
): number {
  return Math.abs(convertUnits(quantity, fromUnitOfMeasure, toUnitOfMeasure));
}
