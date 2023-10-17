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
  getItemUnitQuantityAndUnitOrError,
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
  displayChecksum: boolean;
  displayFullTags: boolean;
  addSpacing: boolean;
  debug: boolean;
}

type IStringRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];
type IHarvestPackageMatrixRow =
  | [string, string, string, string, string, "", string, number, number, string, string?]
  | IStringRow;

export const harvestPackagesFormFiltersFactory: () => IHarvestPackagesReportFormFilters = () => ({
  harvestDateGt: todayIsodate(),
  harvestDateLt: todayIsodate(),
  shouldFilterHarvestDateGt: true,
  shouldFilterHarvestDateLt: true,
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  displayChecksum: true,
  displayFullTags: true,
  addSpacing: true,
  debug: true,
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
    displayChecksum: harvestPackagesFormFilters.displayChecksum,
    displayFullTags: harvestPackagesFormFilters.displayFullTags,
    addSpacing: harvestPackagesFormFilters.addSpacing,
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

  const harvestPackageMatrix: IHarvestPackageMatrixRow[] = [];

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
        const msg = `Missing harvest package. license:${harvest.LicenseNumber} harvest:${harvest.Name} pkg:${harvestPackageLabel}`;
        console.error(msg);
        harvestPackageMatrix.push([...Array(10).fill(""), msg] as IStringRow);

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

          // This is probably OK
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
        harvestPackageMatrix.push([
          ...Array(10).fill(""),
          `Could not match harvest package. license:${harvest.LicenseNumber} harvest:${harvest.Name}, label:${harvestPackageLabel}`,
        ] as IStringRow);

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

      // Top-level harvest package
      harvestPackageMatrix.push([
        harvestPackage.LicenseNumber,
        harvest.Name,
        truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
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
      const harvestPostQcPackages: IUnionIndexedPackageData[] = [];
      const intakePackages: IUnionIndexedPackageData[] = [];

      // Add QC and packaging rows
      for (const childPackageLabel of childPackageLabels) {
        let childPackage = packageMap.get(childPackageLabel);

        if (!childPackage) {
          harvestPackageMatrix.push([
            ...Array(10).fill(""),
            `Packaging stage: Could not match child package. license:${
              harvest.LicenseNumber
            } harvest:${harvest.Name}, harvestPkg:${getLabelOrError(
              harvestPackage
            )}, label:${childPackageLabel}`,
          ] as IStringRow);
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

        // If top-level pkg was transferred, assume it is the Post QC - Sent to Lab package
        // TODO I do not undestand this distinction
        // if (childPackage.LicenseNumber !== harvest.LicenseNumber) {
        //   harvestPostQcPackages.push(childPackage);

        //   continue;
        // }

        intakePackages.push(childPackage);
      }

      for (const childPackage of harvestPostQcPackages) {
        recordHarvestPostQcRow(
          reportConfig,
          harvest,
          strainName,
          harvestPackage,
          childPackage,
          harvestPackageMatrix,
          unitsOfMeasure,
          ""
        );
      }

      for (let childPackage of intakePackages) {
        let originalPackage = childPackage;

        const passthroughTestPackageLabels = extractTestSamplePackageLabelsFromHistory(
          childPackage.history!
        );

        const passthroughPackageLabels = extractChildPackageLabelsFromHistory_Full(
          childPackage.history!
        );

        let passthroughMsg: string = "";

        if (passthroughTestPackageLabels.length === 0 && passthroughPackageLabels.length === 1) {
          if (packageMap.has(passthroughPackageLabels[0].label)) {
            childPackage = packageMap.get(passthroughPackageLabels[0].label)!;
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
              `Passthrough failed: childLabel:${getLabelOrError(childPackage)} passthroughLabel:${
                passthroughPackageLabels[0].label
              }`
            );
          } else {
            passthroughMsg = `Passthrough matched! Original:${getLabelOrError(
              originalPackage
            )} Passthrough:${getLabelOrError(childPackage)}`;
            console.log(passthroughMsg);
          }
        }

        // Double check that history was loaded
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
            unitsOfMeasure,
            passthroughMsg
          );
        } catch (e) {
          harvestPackageMatrix.push([
            ...Array(10).fill(""),
            `Could not record QC Rows: ${(e as any).toString()}. license:${
              childPackage.LicenseNumber
            } harvest:${harvest.Name}, label:${getLabelOrError(childPackage)}`,
          ] as IStringRow);

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

          if (harvestConfig.addSpacing) {
            harvestPackageMatrix.push(Array(10).fill("") as IStringRow);
          }
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

      if (harvestConfig.addSpacing) {
        harvestPackageMatrix.push(Array(10).fill("") as IStringRow);
      }
    }

    if (harvestConfig.addSpacing) {
      harvestPackageMatrix.push(Array(10).fill("") as IStringRow);
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
    "Rename",
    "Material Type",
    "Grams",
    "Pounds",
    "Stage",
    harvestConfig.debug || harvestConfig.displayChecksum ? "Note" : "",
  ] as IStringRow);

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

  if (itemName.includes("Preroll")) {
    return "Prerolls";
  }

  if (itemName.includes("Flower")) {
    return "Flower";
  }

  return itemName;
}

function recordHarvestPostQcRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  msg: string
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const initialChildQuantity: number = childPackage.history
    ? extractInitialPackageQuantityAndUnitFromHistoryOrError(childPackage.history!)[0]
    : (childPackage as IIndexedDestinationPackageData).ShippedQuantity;

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(childPackage)),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
    "Post QC  - Sent to Lab",
    harvestConfig.debug ? msg : "",
  ]);
}

function recordPostQcRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageMatrix: any[][],
  unitsOfMeasure: IUnitOfMeasure[],
  msg: string
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  if (!childPackage.history) {
    harvestPackageMatrix.push([
      ...Array(10).fill(""),
      `Could not match post QC child package. harvest:${harvest.Name}, label:${getLabelOrError(
        childPackage
      )}`,
    ] as IStringRow);
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
    truncateTag(harvestConfig, getLabelOrError(childPackage)),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
    "Post QC Batch",
    harvestConfig.debug ? msg : "",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(childPackage)),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
    ...generateUnitsPair(totalChildTestQuantity, childPackage, unitsOfMeasure),
    "Post QC Lab Testing",
    harvestConfig.debug ? "" : "",
  ]);

  if (harvestConfig.addSpacing) {
    harvestPackageMatrix.push(Array(10).fill("") as IStringRow);
  }
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

  let grandchildPackagedTotal = 0;
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

    if (greatgrandchildPackage && getItemNameOrError(greatgrandchildPackage).includes("Shake")) {
      grandchildShakeTotal += greatgrandchildQty;
    } else {
      grandchildPackagedTotal += greatgrandchildQty;
    }
  }

  const packagingIntakeUnitsPair = generateUnitsPair(
    initialGrandchildQuantity,
    grandchildPackage,
    unitsOfMeasure
  );
  const packagingUnitsPair = generateUnitsPair(
    grandchildPackagedTotal,
    grandchildPackage,
    unitsOfMeasure
  );
  const packagingWasteUnitsPair = generateUnitsPair(
    grandchildWasteTotal,
    grandchildPackage,
    unitsOfMeasure
  );
  const packagingShakeUnitsPair = generateUnitsPair(
    grandchildShakeTotal,
    grandchildPackage,
    unitsOfMeasure
  );
  const packagingMoistureUnitsPair = generateUnitsPair(
    grandchildMLOverpackTotal,
    grandchildPackage,
    unitsOfMeasure
  );

  const expectedSum = packagingIntakeUnitsPair[0];
  const actualSum =
    packagingUnitsPair[0] +
    packagingWasteUnitsPair[0] +
    packagingShakeUnitsPair[0] +
    packagingMoistureUnitsPair[0];

  const passChecksum = Math.abs(1 - expectedSum / actualSum) < 0.02;

  const checksumMsg = harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(grandchildPackage)),
    ...packagingIntakeUnitsPair,
    "Packaging Intake",
    harvestConfig.displayChecksum
      ? `Checksum ${passChecksum ? "PASS" : "FAIL"} - expected:${expectedSum}g actual:${actualSum}g`
      : "",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    strainName,
    "",
    normalizeItemNameToMaterialType(getItemNameOrError(grandchildPackage)) + " - Prepack",
    ...packagingUnitsPair,
    "Packaging",
    harvestConfig.debug ? "" : "",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    strainName,
    "",
    "Waste",
    ...packagingWasteUnitsPair,
    "Packaging - Waste",
    harvestConfig.debug ? "" : "",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    strainName,
    "",
    "Shake",
    ...packagingShakeUnitsPair,
    "Packaging - Sent to Lab",
    harvestConfig.debug ? "" : "",
  ]);

  harvestPackageMatrix.push([
    harvestPackage.LicenseNumber,
    harvest.Name,
    "",
    truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    strainName,
    "",
    "Moisture Loss",
    ...packagingMoistureUnitsPair,
    "Packaging ML/Overpack",
    harvestConfig.debug ? "" : "",
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
    truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
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
      truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
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
  let unitOfMeasure = unitsOfMeasure.find(
    (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
  )!;

  const gramUnitOfMeasure = unitsOfMeasure.find((x) => x.Abbreviation === "g")!;
  const poundUnitOfmeasure = unitsOfMeasure.find((x) => x.Abbreviation === "lb")!;

  if (getItemUnitOfMeasureAbbreviationOrError(pkg) === "ea") {
    try {
      const itemQuantityAndUnit = getItemUnitQuantityAndUnitOrError(pkg);

      quantity *= itemQuantityAndUnit.quantity;
      unitOfMeasure = unitsOfMeasure.find(
        (x) => x.Abbreviation === itemQuantityAndUnit.unitOfMeasureAbbreviation
      )!;
    } catch {
      // Item is count based. No meaningful way to extract an initial weight.
      return [0, 0];
    }
  }

  return [
    parseFloat(Math.abs(convertUnits(quantity, unitOfMeasure, gramUnitOfMeasure)).toFixed(3)),
    parseFloat(Math.abs(convertUnits(quantity, unitOfMeasure, poundUnitOfmeasure)).toFixed(3)),
  ];
}

function truncateTag(
  harvestConfig: IReportConfig[ReportType.HARVEST_PACKAGES],
  tag: string
): string {
  return harvestConfig!.displayFullTags ? tag : tag.slice(-8).replace(/^0+/, "");
}
