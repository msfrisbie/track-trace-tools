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
import { ReportType, ReportsMutations } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { TransferPackageSearchAlgorithm } from "@/store/page-overlay/modules/transfer-package-search/consts";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";
import {
  extractAdjustmentReasonNoteSetsFromHistory,
  extractChildPackageLabelsFromHistory,
  extractChildPackageLabelsFromHistory_Full,
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
  ignoreMissingPackages: boolean;
  debug: false;
}

export const harvestPackagesFormFiltersFactory: () => IHarvestPackagesReportFormFilters = () => ({
  harvestDateGt: todayIsodate(),
  harvestDateLt: todayIsodate(),
  shouldFilterHarvestDateGt: true,
  shouldFilterHarvestDateLt: true,
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  ignoreMissingPackages: true,
  debug: false,
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
    debug: harvestPackagesFormFilters.debug,
    ignoreMissingPackages: harvestPackagesFormFilters.ignoreMissingPackages,
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
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  let dataLoader: DataLoader | null = null;

  let harvests: IIndexedHarvestData[] = [];
  let packages: IIndexedPackageData[] = [];
  let unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  if (!harvestConfig?.harvestFilter) {
    return;
  }

  let promises: Promise<any>[] = [];

  for (const license of harvestConfig.licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} harvests...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);

    promises.push(
      dataLoader.activeHarvests().then(
        (response) => {
          harvests = [...response, ...harvests];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load active harvests.", level: "warning" },
          });
        }
      )
    );

    promises.push(
      dataLoader.inactiveHarvests().then(
        (response) => {
          harvests = [...response, ...harvests];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load inactive harvests.", level: "warning" },
          });
        }
      )
    );

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: "success" },
    });

    promises.push(
      dataLoader.activePackages().then(
        (response) => {
          packages = [...response, ...packages];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load active packages.", level: "warning" },
          });
        }
      )
    );

    promises.push(
      dataLoader.onHoldPackages().then(
        (response) => {
          packages = [...response, ...packages];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load onhold packages.", level: "warning" },
          });
        }
      )
    );

    promises.push(
      dataLoader.inTransitPackages().then(
        (response) => {
          packages = [...response, ...packages];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load in transit packages.", level: "warning" },
          });
        }
      )
    );

    promises.push(
      dataLoader.inactivePackages().then(
        (response) => {
          packages = [...response, ...packages];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load inactive packages.", level: "warning" },
          });
        }
      )
    );

    await Promise.allSettled(promises);
  }

  await Promise.allSettled(promises);

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

  const temporaryValueMap = new Map<any, any>();

  for (const harvest of harvests) {
    const harvestPackageLabels = extractHarvestChildPackageLabelsFromHistory(harvest.history!);

    for (const harvestPackageLabel of harvestPackageLabels) {
      let harvestPackage = packageMap.get(harvestPackageLabel);

      if (!harvestPackage) {
        // @ts-ignore
        harvestPackageMatrix.push([
          ...Array(10).fill(""),
          `Could not match harvest package. harvest:${harvest.Name}, label:${harvestPackageLabel}`,
        ]);

        continue;

        // const result = await getPackageFromOutboundTransferOrNull(
        //   harvestPackageLabel,
        //   harvest.LicenseNumber,
        //   harvest.HarvestStartDate
        // );

        // if (result) {
        //   const [transfer, pkg] = result;

        //   harvestPackage = pkg;
        // } else {
        //   // @ts-ignore
        //   harvestPackageMatrix.push([
        //     ...Array(10).fill(""),
        //     `Could not match harvest package. harvest:${harvest.Name}, label:${harvestPackageLabel}`,
        //   ]);

        //   continue;
        // }
      }

      // Assign temporary value to be replaced later
      let strainName = uuidv4();

      // If a candidate is not found, use this as the fallback
      let fallbackStrainName = "";
      try {
        fallbackStrainName = getStrainNameOrError(harvestPackage);
      } catch {}

      const initailHarvestPackageQuantity = harvestPackage.history
        ? extractInitialPackageQuantityAndUnitFromHistoryOrError(harvestPackage.history!)[0]
        : (harvestPackage as IIndexedDestinationPackageData).ShippedQuantity;

      let msg = "";
      if (!harvestPackage.history) {
        msg = `Could not load history for harvest package ${harvestPackageLabel}`;
        console.error(msg);
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
        harvestConfig.debug ? msg : "",
      ]);

      if (!harvestPackage.history) {
        continue;
      }

      let childPackageLabels = extractChildPackageLabelsFromHistory(harvestPackage.history!);

      const trimChildPackages: IUnionIndexedPackageData[] = [];

      // Add QC and packaging rows
      for (const childPackageLabel of childPackageLabels) {
        let childPackage = packageMap.get(childPackageLabel);

        if (!childPackage) {
          // @ts-ignore
          harvestPackageMatrix.push([
            ...Array(10).fill(""),
            `Packaging stage: Could not match child package. harvest:${
              harvest.Name
            }, harvestPkg:${getLabelOrError(harvestPackage)}, label:${childPackageLabel}`,
          ]);
          continue;
        }

        if (!childPackage.history) {
          throw new Error(`Could not load history for child package ${childPackageLabel}`);
        }

        // Trim is handled later on
        if (getItemNameOrError(childPackage).includes("Trim")) {
          trimChildPackages.push(childPackage);
          continue;
        }

        let originalPackage = childPackage;

        const passthroughTestPackageLabels = extractTestSamplePackageLabelsFromHistory(
          childPackage.history!
        );

        const passthroughPackageLabels = extractChildPackageLabelsFromHistory_Full(
          childPackage.history!
        );

        if (passthroughTestPackageLabels.length === 0 && passthroughPackageLabels.length === 1) {
          if (packageMap.has(passthroughPackageLabels[0].label)) {
            childPackage = packageMap.get(passthroughPackageLabels[0].label);
          } else {
            const result = await getPackageFromOutboundTransferOrNull(
              passthroughPackageLabels[0].label,
              childPackage.LicenseNumber,
              // childPackage.PackagedDate!
              passthroughPackageLabels[0].history.RecordedDateTime.split("T")[0]
            );

            if (result) {
              const [transfer, pkg] = result;

              childPackage = pkg;
            }
          }

          if (!childPackage) {
            throw new Error(
              `Passthrough failed: childLabel:${childPackageLabel} passthroughLabel:${passthroughPackageLabels[0].label}`
            );
          } else {
            console.log(
              `Passthrough matched! Original:${getLabelOrError(
                originalPackage
              )} Passthrough:${getLabelOrError(childPackage)}`
            );
          }
        }

        if (!childPackage.history) {
          await getDataLoaderByLicense(childPackage.LicenseNumber)
            .then((dataLoader) => dataLoader.packageHistoryByPackageId(getIdOrError(childPackage!)))
            .then((history) => {
              childPackage!.history = history;
            });
        }

        try {
          recordPostQcRows(
            reportConfig,
            harvest,
            strainName,
            harvestPackage,
            childPackage,
            harvestPackageMatrix,
            unitsOfMeasure
          );
        } catch (e) {
          // @ts-ignore
          harvestPackageMatrix.push([
            ...Array(10).fill(""),
            `Could not record QC Rows: ${(e as any).toString()}. harvest:${
              harvest.Name
            }, label:${getLabelOrError(childPackage)}`,
          ]);

          continue;
        }

        const grandchildPackageLabels = extractChildPackageLabelsFromHistory(childPackage.history!);

        for (const grandchildPackageLabel of grandchildPackageLabels) {
          let grandchildPackage = packageMap.get(grandchildPackageLabel);

          if (!grandchildPackage) {
            // Seems this is not needed
            console.error(`Skipping grandchild package ${grandchildPackageLabel}`);
            continue;
          }

          try {
            if (!temporaryValueMap.has(strainName)) {
              const actualStrainName = getStrainNameOrError(grandchildPackage);

              temporaryValueMap.set(strainName, actualStrainName);
            }
          } catch {}

          recordPackagingRows(
            reportConfig,
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

      // Add trailing trim rows
      for (const childPackage of trimChildPackages) {
        recordTrimRow(
          reportConfig,
          harvest,
          strainName,
          harvestPackage,
          harvestPackageMatrix,
          unitsOfMeasure,
          childPackage
        );
      }

      recordHarvestPackageAdjustmentRows(
        reportConfig,
        harvest,
        strainName,
        harvestPackage,
        harvestPackageMatrix,
        unitsOfMeasure
      );

      if (!temporaryValueMap.has(strainName)) {
        temporaryValueMap.set(strainName, fallbackStrainName);
        console.error(`Using fallback strain name for harvest package ${harvestPackageLabel}`);
      }
    }
  }

  // Swap out temporary values for actual ones
  for (const row of harvestPackageMatrix) {
    for (const [idx, cell] of row.entries()) {
      if (temporaryValueMap.has(cell)) {
        row[idx] = temporaryValueMap.get(cell);
      }
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
    harvestConfig.debug ? "Note" : "",
  ]);

  reportData[ReportType.HARVEST_PACKAGES] = {
    harvestPackageMatrix,
  };
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
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[]
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  if (!childPackage.history) {
    // @ts-ignore
    harvestPackageMatrix.push([
      ...Array(10).fill(""),
      `Could not match post QC child package. harvest:${harvest.Name}, label:${getLabelOrError(
        childPackage
      )}`,
    ]);
  }

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
    harvestConfig.debug ? "Child" : "",
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
    harvestConfig.debug ? "Child" : "",
  ]);
}

function recordPackagingRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  grandchildPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData,
  packageMap: Map<string, IUnionIndexedPackageData>
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

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
    harvestConfig.debug ? "Grandchild" : "",
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
    harvestConfig.debug ? "Grandchild" : "",
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
    harvestConfig.debug ? "Grandchild" : "",
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
    harvestConfig.debug ? "Grandchild" : "",
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
    harvestConfig.debug ? "Grandchild" : "",
  ]);
}

function recordTrimRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const [initialChildQuantity, unit] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
    childPackage.history!
  );

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

function recordHarvestPackageAdjustmentRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[]
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

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
    parseFloat(
      Math.abs(
        convertUnits(
          quantity,
          unitsOfMeasure.find(
            (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
          )!,
          gramUnitOfMeasure
        )
      ).toFixed(3)
    ),
    parseFloat(
      Math.abs(
        convertUnits(
          quantity,
          unitsOfMeasure.find(
            (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
          )!,
          poundUnitOfmeasure
        )
      ).toFixed(3)
    ),
  ];
}
