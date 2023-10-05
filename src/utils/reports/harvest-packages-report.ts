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
import { TransferPackageSearchAlgorithm } from "@/store/page-overlay/modules/transfer-package-search/consts";
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

    const harvestPackageMatrix: [
      string,
      string,
      string,
      string,
      string,
      "",
      string,
      number,
      number,
      string,
      string?
    ][] = [];

    const packageMap = new Map<string, IUnionIndexedPackageData>(packages.map((x) => [x.Label, x]));

    async function getPackageFromOutboundTransferOrNull(
      label: string,
      license: string,
      startDate: string
    ): Promise<[IIndexedRichOutgoingTransferData, IIndexedDestinationPackageData] | null> {
      const abortController = new AbortController();

      let richTransfer: IIndexedRichOutgoingTransferData | null = null;
      let transferPkg: IIndexedDestinationPackageData | null = null;

      await findMatchingTransferPackages({
        queryString: label,
        startDate,
        licenses: [license],
        signal: abortController.signal,
        algorithm: TransferPackageSearchAlgorithm.OLD_TO_NEW,
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
          console.error(`Skipping harvest package ${harvestPackageLabel}`);
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

          // Still not know if we need to traverse to depth 2 or 3
          if (depth === 3) {
            return;
          }

          const childPackageLabels = extractChildPackageLabelsFromHistory(history);

          for (const childPackageLabel of childPackageLabels) {
            const childPkg = packageMap.get(childPackageLabel);

            if (!childPkg) {
              console.error(`Skipping child package ${childPackageLabel}`);
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
        let harvestPackage = packageMap.get(harvestPackageLabel);

        if (!harvestPackage) {
          const result = await getPackageFromOutboundTransferOrNull(
            harvestPackageLabel,
            harvest.LicenseNumber,
            harvest.HarvestStartDate
          );

          if (result) {
            const [transfer, pkg] = result;

            harvestPackage = pkg;
          } else {
            // @ts-ignore
            harvestPackageMatrix.push([
              ...Array(10).fill(""),
              `Could not match harvest package ${harvestPackageLabel}`,
            ]);

            continue;
          }
        }

        const strainName = getStrainNameOrError(harvestPackage);

        const initailHarvestPackageQuantity = harvestPackage.history
          ? extractInitialPackageQuantityAndUnitFromHistoryOrError(harvestPackage.history!)[0]
          : (harvestPackage as IIndexedDestinationPackageData).ShippedQuantity;

        let msg = "";
        if (!harvestPackage.history) {
          msg = `Could not load history for harvest package ${harvestPackageLabel}`;
        }

        harvestPackageMatrix.push([
          harvestPackage.LicenseNumber,
          harvest.Name,
          getLabelOrError(harvestPackage).slice(-8).replace(/^0+/, ""),
          "",
          strainName,
          "",
          "Denug",
          ...generateUnitsPair(initailHarvestPackageQuantity, harvestPackage, unitsOfMeasure),
          "Denug",
          msg,
        ]);

        if (!harvestPackage.history) {
          console.error(`No harvest package history ${harvestPackageLabel}`);
          continue;
        }

        let childPackageLabels = extractChildPackageLabelsFromHistory(harvestPackage.history!);

        // TODO check if this package is a passthrough
        // if (childPackageLabels.length === 1) {
        //   console.log(`Potential passthrough package: ${childPackageLabels[0]}`);
        //   const potentialPassthroughPackage = packageMap.get(childPackageLabels[0]);

        //   if (potentialPassthroughPackage && potentialPassthroughPackage.history) {
        //     const [initialQuantity, unit] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
        //       potentialPassthroughPackage.history
        //     );

        //     const [passthroughLabel, passthroughQuantity, passthroughUnit] =
        //       extractChildPackageTagQuantityUnitSetsFromHistory(
        //         potentialPassthroughPackage.history
        //       )[0];

        //     console.log(`Initial/final: ${initialQuantity}/${passthroughQuantity}`);

        //     if (initialQuantity === passthroughQuantity) {
        //       console.log(`Passthrough package: ${childPackageLabels[0]}`);
        //       childPackageLabels = extractChildPackageLabelsFromHistory(
        //         potentialPassthroughPackage.history!
        //       );
        //     }
        //   }
        // }

        for (const childPackageLabel of childPackageLabels) {
          let childPackage = packageMap.get(childPackageLabel);

          if (!childPackage) {
            throw new Error(`Could not match child package ${childPackageLabel}`);
          }

          if (!childPackage.history) {
            throw new Error(`Could not load history for child package ${childPackageLabel}`);
          }

          // Trim is handled later on
          if (getItemNameOrError(childPackage).includes("Trim")) {
            continue;
          }

          const passthroughTestPackageLabels = extractTestSamplePackageLabelsFromHistory(
            childPackage.history!
          );

          const passthroughPackageLabels = extractChildPackageLabelsFromHistory(
            childPackage.history!
          );

          if (passthroughTestPackageLabels.length === 0 && passthroughPackageLabels.length === 1) {
            childPackage = packageMap.get(passthroughPackageLabels[0]);

            if (!childPackage) {
              throw new Error(
                `Passthrough failed: ${childPackageLabel} / ${passthroughPackageLabels[0]}`
              );
            }
          }

          recordPostQcRows(
            harvest,
            strainName,
            harvestPackage,
            childPackage,
            harvestPackageMatrix,
            unitsOfMeasure
          );

          const grandchildPackageLabels = extractChildPackageLabelsFromHistory(
            childPackage.history!
          );

          for (const grandchildPackageLabel of grandchildPackageLabels) {
            let grandchildPackage = packageMap.get(grandchildPackageLabel);

            if (!grandchildPackage) {
              // Seems this is not needed
              console.error(`Skipping grandchild package ${grandchildPackageLabel}`);
              continue;
              // throw new Error(`Could not match grandchild package ${grandchildPackageLabel}`);
            }

            recordPackagingRows(
              harvest,
              strainName,
              harvestPackage,
              grandchildPackage,
              harvestPackageMatrix,
              unitsOfMeasure,
              childPackage,
              packageMap
            );
          }
        }

        for (const childPackageLabel of childPackageLabels) {
          let childPackage = packageMap.get(childPackageLabel);

          if (!childPackage) {
            throw new Error(`Could not match child package ${childPackageLabel}`);
          }

          // if (!childPackage) {
          //   const result = await getPackageFromOutboundTransferOrNull(
          //     childPackageLabel,
          //     harvestPackage.LicenseNumber,
          //     harvestPackage.PackagedDate!
          //   );

          //   if (result) {
          //     const [transfer, pkg] = result;
          //     childPackage = pkg;
          //   } else {
          //     // @ts-ignore
          //     harvestPackageMatrix.push([
          //       ...Array(10).fill(""),
          //       `Could not match child package ${childPackageLabel}`,
          //     ]);

          //     continue;
          //   }
          // }

          recordTrimRow(
            harvest,
            strainName,
            harvestPackage,
            harvestPackageMatrix,
            unitsOfMeasure,
            childPackage
          );
        }

        recordHarvestPackageAdjustmentRows(
          harvest,
          strainName,
          harvestPackage,
          harvestPackageMatrix,
          unitsOfMeasure
        );
      }
    }

    harvestPackageMatrix.unshift([
      "License",
      "Harvest ID",
      "Source Tag",
      "Batch Tag",
      "Strain",
      // @ts-ignore
      "Rename",
      "Material Type",
      // @ts-ignore
      "Grams",
      // @ts-ignore
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

function extractInitialQuantity(pkg: IUnionIndexedPackageData): [number, string] {
  if (pkg.history) {
    return extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history);
  } else {
    // @ts-ignore
    if (pkg.PackageLabel) {
      return [
        (pkg as IIndexedDestinationPackageData).ShippedQuantity,
        (pkg as IIndexedDestinationPackageData).ShippedUnitOfMeasureAbbreviation,
      ];
    }

    throw new Error("Invalid package state");
  }
}

function normalizeItemNameToMaterialType(itemName: string) {
  if (itemName.includes("Popcorn")) {
    return "Popcorn";
  }

  if (itemName.includes("Flower")) {
    return "Flower";
  }

  return itemName;
}

function recordPostQcRows(
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[]
) {
  const initialChildQuantity: number = childPackage.history
    ? extractInitialPackageQuantityAndUnitFromHistoryOrError(childPackage.history!)[0]
    : (childPackage as IIndexedDestinationPackageData).ShippedQuantity;

  const childLabTestLabels = extractTestSamplePackageLabelsFromHistory(childPackage.history!);

  const childSets = extractChildPackageTagQuantityUnitSetsFromHistory(childPackage.history!);

  let totalChildTestQuantity = 0;

  for (const childLabTestLabel of childLabTestLabels) {
    for (const [childLabel, childQty, childUnit] of childSets) {
      if (childLabTestLabel === childLabel) {
        totalChildTestQuantity += childQty;
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
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(childPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
    "Post QC Batch",
    "Child",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(childPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(totalChildTestQuantity, childPackage, unitsOfMeasure),
    "Post QC Lab Testing",
    "Child",
  ]);
}

function recordPackagingRows(
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  grandchildPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData,
  packageMap: Map<string, IUnionIndexedPackageData>
) {
  const initialGrandchildQuantity: number = grandchildPackage.history
    ? extractInitialPackageQuantityAndUnitFromHistoryOrError(grandchildPackage.history!)[0]
    : (grandchildPackage as IIndexedDestinationPackageData).ShippedQuantity;

  if (!grandchildPackage.history) {
    throw new Error(
      `Could not load history for grandchild package ${getLabelOrError(grandchildPackage)}`
    );
  }

  const grandchildLabTestLabels = extractTestSamplePackageLabelsFromHistory(
    grandchildPackage.history!
  );

  const grandchildSets = extractChildPackageTagQuantityUnitSetsFromHistory(
    grandchildPackage.history!
  );

  let totalGrandchildTestQuantity = 0;

  for (const grandchildLabTestLabel of grandchildLabTestLabels) {
    for (const [grandchildLabel, grandchildQty, grandchildUnit] of grandchildSets) {
      if (grandchildLabTestLabel === grandchildLabel) {
        totalGrandchildTestQuantity += grandchildQty;
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

  const greatgrandchildPackageLabelSets = extractChildPackageTagQuantityUnitSetsFromHistory(
    grandchildPackage.history!
  );

  for (const [
    greatgrandchildLabel,
    greatgrandchildQty,
    greatgrandchildUnit,
  ] of greatgrandchildPackageLabelSets) {
    const greatgrandchildPackage = packageMap.get(greatgrandchildLabel);

    if (greatgrandchildPackage) {
      if (getItemNameOrError(greatgrandchildPackage).includes("Shake")) {
        grandchildShakeTotal += greatgrandchildQty;
      }
    }
  }

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(initialGrandchildQuantity, grandchildPackage, unitsOfMeasure),
    "Packaging Intake",
    "Grandchild",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)) + " - Prepack",
    ...generateUnitsPair(
      initialGrandchildQuantity -
        (grandchildMLOverpackTotal + grandchildWasteTotal + grandchildShakeTotal),
      grandchildPackage,
      unitsOfMeasure
    ),
    "Packaging",
    "Grandchild",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    "Waste",
    ...generateUnitsPair(grandchildWasteTotal, grandchildPackage, unitsOfMeasure),
    "Packaging - Waste",
    "Grandchild",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    "Shake",
    ...generateUnitsPair(grandchildShakeTotal, grandchildPackage, unitsOfMeasure),
    "Packaging - Sent to Lab",
    "Grandchild",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    getLabelOrError(grandchildPackage).slice(-8).replace(/^0+/, ""),
    strainName,
    "",
    "Moisture Loss",
    ...generateUnitsPair(grandchildMLOverpackTotal, grandchildPackage, unitsOfMeasure),
    "Packaging ML/Overpack",
    "Grandchild",
  ]);
}

function recordTrimRow(
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData
) {
  const [initialChildQuantity, unit] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
    childPackage.history!
  );

  if (getItemNameOrError(childPackage).includes("Trim")) {
    harvestPackageMatrix.push([
      harvestPackage.LicenseNumber,
      harvest.Name,
      getLabelOrError(harvestPackage).slice(-8).replace(/^0+/, ""),
      "",
      strainName,
      "",
      "Trim",
      ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
      "Post Machine Trim - Sent to Lab",
    ]);
  }
}

function recordHarvestPackageAdjustmentRows(
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[]
) {
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
      ...generateUnitsPair(
        harvestPackageAdjustmentReasonNote.quantity,
        harvestPackage,
        unitsOfMeasure
      ),
      "Denug",
    ]);
  }
}

function generateUnitsPair(
  quantity: number,
  pkg: IUnionIndexedPackageData,
  unitsOfMeasure: IUnitOfMeasure[]
): [number, number] {
  const gramUnitOfMeasure = unitsOfMeasure.find((x) => x.Abbreviation === "g")!;
  const poundUnitOfmeasure = unitsOfMeasure.find((x) => x.Abbreviation === "lb")!;

  return [
    convertUnitsImpl(
      quantity,
      unitsOfMeasure.find((x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg))!,
      gramUnitOfMeasure
    ),
    convertUnitsImpl(
      quantity,
      unitsOfMeasure.find((x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg))!,
      poundUnitOfmeasure
    ),
  ];
}
