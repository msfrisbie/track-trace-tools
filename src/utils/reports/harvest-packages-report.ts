import {
  IHarvestFilter,
  IIndexedDestinationPackageData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IPluginState,
  IUnionIndexedPackageData,
  IUnitOfMeasure
} from '@/interfaces';
import { DataLoader, getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { dynamicConstsManager } from '@/modules/dynamic-consts-manager.module';
import { facilityManager } from '@/modules/facility-manager.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IReportConfig,
  IReportData,
  IReportsState
} from '@/store/page-overlay/modules/reports/interfaces';
import { TransferPackageSearchAlgorithm } from '@/store/page-overlay/modules/transfer-package-search/consts';
import { v4 as uuidv4 } from 'uuid';
import { ActionContext } from 'vuex';
import { todayIsodate } from '../date';
import {
  extractAdjustmentReasonNoteSetsFromHistory,
  extractChildPackageLabelsFromHistory,
  extractChildPackageLabelsFromHistory_Full,
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractHarvestChildPackageLabelsFromHistory,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractParentPackageTagQuantityUnitItemSetsFromHistory,
  extractTestSamplePackageLabelsFromHistory
} from '../history';
import {
  getIdOrError,
  getItemNameOrError,
  getItemUnitOfMeasureAbbreviationOrError,
  getItemUnitQuantityAndUnitOrError,
  getLabelOrError,
  getStrainNameOrError
} from '../package';
import { findMatchingTransferPackages } from '../transfer';
import { convertUnits } from '../units';

interface IHarvestPackagesReportFormFilters {
  harvestDateGt: string;
  harvestDateLt: string;
  shouldFilterHarvestDateGt: boolean;
  shouldFilterHarvestDateLt: boolean;
  removeFloorNugs: boolean;
  licenseOptions: string[];
  licenses: string[];
  displayChecksum: boolean;
  displayFullTags: boolean;
  addSpacing: boolean;
  debug: boolean;
}

type IHarvestPackageRowData = {
  License: string,
  HarvestID: string,
  SourceTag: string,
  BatchTag: string,
  Strain: string,
  Rename: string,
  MaterialType: string,
  Grams: number | null,
  Pounds: number | null,
  Stage: string,
  Note: string,
  RowSource: string
}

function rowDataFactory(rowData: {
  License?: string,
  HarvestID?: string,
  SourceTag?: string,
  BatchTag?: string,
  Strain?: string,
  Rename?: string,
  MaterialType?: string,
  Grams?: number | null,
  Pounds?: number | null,
  Stage?: string,
  Note?: string,
  RowSource?: string
}): IHarvestPackageRowData {
  const defaultRowData: IHarvestPackageRowData = {
    License: '',
    HarvestID: '',
    SourceTag: '',
    BatchTag: '',
    Strain: '',
    Rename: '',
    MaterialType: '',
    Grams: null,
    Pounds: null,
    Stage: '',
    Note: '',
    RowSource: ''
  };

  return {
    ...defaultRowData,
    ...rowData,
  };
}

export const harvestPackagesFormFiltersFactory: () => IHarvestPackagesReportFormFilters = () => ({
  harvestDateGt: todayIsodate(),
  harvestDateLt: todayIsodate(),
  shouldFilterHarvestDateGt: true,
  shouldFilterHarvestDateLt: true,
  removeFloorNugs: true,
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  displayChecksum: false,
  displayFullTags: false,
  addSpacing: false,
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
    displayChecksum: harvestPackagesFormFilters.displayChecksum,
    displayFullTags: harvestPackagesFormFilters.displayFullTags,
    addSpacing: harvestPackagesFormFilters.addSpacing,
    removeFloorNugs: harvestPackagesFormFilters.removeFloorNugs,
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
  const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  if (!harvestConfig?.harvestFilter) {
    return;
  }

  const promises: Promise<any>[] = [];

  for (const license of harvestConfig.licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} harvests...`, level: 'success' },
    });

    dataLoader = await getDataLoaderByLicense(license);

    promises.push(
      dataLoader.activeHarvests().then(
        (response) => {
          harvests = [...response, ...harvests];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load active harvests.', level: 'warning' },
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
            statusMessage: { text: 'Failed to load inactive harvests.', level: 'warning' },
          });
        }
      )
    );

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: 'success' },
    });

    promises.push(
      dataLoader.activePackages().then(
        (response) => {
          packages = [...response, ...packages];
        },
        (err) => {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
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
            statusMessage: { text: 'Failed to load onhold packages.', level: 'warning' },
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
            statusMessage: { text: 'Failed to load in transit packages.', level: 'warning' },
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
            statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
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

  const harvestPackageRowData: IHarvestPackageRowData[] = [];

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

  if (settledHarvestHistoryPromises.find((x) => x.status === 'rejected')) {
    throw new Error('Harvest history request failed');
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: 'Extracting package history...', level: 'success' },
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
        harvestPackageRowData.push(

        );

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
      const harvestPackage = packageMap.get(harvestPackageLabel);

      if (!harvestPackage) {
        harvestPackageRowData.push(
          rowDataFactory({
            Note: `Could not match harvest package. license:${harvest.LicenseNumber} harvest:${harvest.Name}, label:${harvestPackageLabel}`,
            RowSource: '2'
          })
        );

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
        //   harvestPackageRowData.push([
        //     ...Array(10).fill(""),
        //     `Could not match harvest package. harvest:${harvest.Name}, label:${harvestPackageLabel}`,
        //   ]);

        //   continue;
        // }
      }

      // Assign temporary value to be replaced later
      const strainName = uuidv4();

      // If a candidate is not found, use this as the fallback
      let fallbackStrainName = '';
      try {
        fallbackStrainName = getStrainNameOrError(harvestPackage);
      } catch {}

      const initailHarvestPackageQuantity = harvestPackage.history
        ? extractInitialPackageQuantityAndUnitFromHistoryOrError(harvestPackage.history!)[0]
        : (harvestPackage as IIndexedDestinationPackageData).ShippedQuantity;

      let msg = '';
      if (!harvestPackage.history) {
        msg = `Could not load history for harvest package ${harvestPackageLabel}`;
        console.error(msg);
      }

      // Top-level harvest package
      harvestPackageRowData.push(
        rowDataFactory({
          License: harvestPackage.LicenseNumber,
          HarvestID: harvest.Name,
          SourceTag: truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
          Strain: strainName,
          MaterialType: 'Denug',
          ...generateUnitsPair(initailHarvestPackageQuantity, harvestPackage, unitsOfMeasure),
          Stage: 'Denug',
          Note: harvestConfig.debug ? msg : '',
          RowSource: '3'
        })
      );

      if (!harvestPackage.history) {
        continue;
      }

      const childPackageLabels = extractChildPackageLabelsFromHistory(harvestPackage.history!);

      const trimChildPackages: IUnionIndexedPackageData[] = [];
      const shakeChildPackages: IUnionIndexedPackageData[] = [];
      const harvestPostQcPackages: IUnionIndexedPackageData[] = [];
      const intakePackages: IUnionIndexedPackageData[] = [];

      // Add QC and packaging rows
      for (const childPackageLabel of childPackageLabels) {
        const childPackage = packageMap.get(childPackageLabel);

        if (!childPackage) {
          harvestPackageRowData.push(
            rowDataFactory({
              Note: `Packaging stage: Could not match child package. license:${
                harvest.LicenseNumber
              } harvest:${harvest.Name}, harvestPkg:${getLabelOrError(
                harvestPackage
              )}, label:${childPackageLabel}`,
              RowSource: '4'
            })
          );

          continue;
        }

        if (!childPackage.history) {
          throw new Error(`Could not load history for child package ${childPackageLabel}`);
        }

        // Trim is handled later on
        if (getItemNameOrError(childPackage).includes('Trim')) {
          trimChildPackages.push(childPackage);
          continue;
        }

        // Shake is handled later on
        if (getItemNameOrError(childPackage).includes('Shake')) {
          shakeChildPackages.push(childPackage);
          continue;
        }

        intakePackages.push(childPackage);
      }

      for (const childPackage of harvestPostQcPackages) {
        recordHarvestPostQcRow(
          reportConfig,
          harvest,
          strainName,
          harvestPackage,
          childPackage,
          harvestPackageRowData,
          unitsOfMeasure,
          ''
        );
      }

      for (let childPackage of intakePackages) {
        const originalPackage = childPackage;

        const passthroughTestPackageLabels = extractTestSamplePackageLabelsFromHistory(
          childPackage.history!
        );

        const passthroughPackageLabels = extractChildPackageLabelsFromHistory_Full(
          childPackage.history!
        );

        let passthroughMsg: string = '';

        if (passthroughTestPackageLabels.length === 0 && passthroughPackageLabels.length === 1) {
          if (packageMap.has(passthroughPackageLabels[0].label)) {
            childPackage = packageMap.get(passthroughPackageLabels[0].label)!;
          } else {
            const result = await getPackageFromOutboundTransferOrNull(
              passthroughPackageLabels[0].label,
              childPackage.LicenseNumber,
              // childPackage.PackagedDate!
              passthroughPackageLabels[0].history.RecordedDateTime.split('T')[0]
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
            harvestPackageRowData,
            unitsOfMeasure,
            passthroughMsg
          );
        } catch (e) {
          harvestPackageRowData.push(
            rowDataFactory({
              Note: `Could not record QC Rows: ${(e as any).toString()}. license:${
                childPackage.LicenseNumber
              } harvest:${harvest.Name}, label:${getLabelOrError(childPackage)}`,
              RowSource: '5'
            })
          );

          continue;
        }

        const grandchildPackageLabels = extractChildPackageLabelsFromHistory(childPackage.history!);

        const standardPackages: IUnionIndexedPackageData[] = [];
        const shakePackages: IUnionIndexedPackageData[] = [];

        for (const grandchildPackageLabel of grandchildPackageLabels) {
          const grandchildPackage = packageMap.get(grandchildPackageLabel);

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

          if (getItemNameOrError(grandchildPackage).includes('Shake')) {
            shakePackages.push(grandchildPackage);
          } else {
            standardPackages.push(grandchildPackage);
          }
        }

        if (shakePackages.length > 0) {
          for (const pkg of shakePackages) {
            recordShakeRow(
              reportConfig,
              harvest,
              strainName,
              harvestPackage,
              harvestPackageRowData,
              unitsOfMeasure,
              pkg,
              'Post QC - Sent to Lab'
            );
          }

          if (harvestConfig.addSpacing) {
            harvestPackageRowData.push(rowDataFactory({ RowSource: '6' }));
          }
        }

        if (standardPackages.length > 0) {
          for (const pkg of standardPackages) {
            recordPackagingRows(
              reportConfig,
              harvest,
              strainName,
              harvestPackage,
              pkg,
              harvestPackageRowData,
              unitsOfMeasure,
              packageMap
            );
          }

          if (harvestConfig.addSpacing) {
            harvestPackageRowData.push(rowDataFactory({ RowSource: '7' }));
          }
        }
      }

      // Add trailing shake rows
      for (const childPackage of shakeChildPackages) {
        recordShakeRow(
          reportConfig,
          harvest,
          strainName,
          harvestPackage,
          harvestPackageRowData,
          unitsOfMeasure,
          childPackage,
          'Denug - Sent to Lab'
        );
      }

      // Add trailing trim rows
      for (const childPackage of trimChildPackages) {
        recordTrimRow(
          reportConfig,
          harvest,
          strainName,
          harvestPackage,
          harvestPackageRowData,
          unitsOfMeasure,
          childPackage
        );
      }

      recordHarvestPackageAdjustmentRows(
        reportConfig,
        harvest,
        strainName,
        harvestPackage,
        harvestPackageRowData,
        unitsOfMeasure
      );

      if (!temporaryValueMap.has(strainName)) {
        temporaryValueMap.set(strainName, fallbackStrainName);
        console.error(`Using fallback strain name for harvest package ${harvestPackageLabel}`);
      }

      // if (harvestConfig.addSpacing) {
      //   harvestPackageRowData.push(rowDataFactory({ RowSource: '8' }));
      // }
    }

    if (harvestConfig.addSpacing) {
      harvestPackageRowData.push(rowDataFactory({ RowSource: '9' }));
    }
  }

  // Swap out temporary values for actual ones
  for (const row of harvestPackageRowData) {
    for (const [key, val] of Object.entries(row)) {
      if (temporaryValueMap.has(val)) {
        // @ts-ignore
        row[key] = temporaryValueMap.get(val);
      }
    }
  }

  const harvestPackageMatrix: any[][] = harvestPackageRowData.filter((row) => {
    if (harvestConfig.removeFloorNugs) {
      // if (row[]) TODO
      if (row.Strain === 'Floor Nugs') {
        return false;
      }
    }

    return true;
  }).map(({
    License,
    HarvestID,
    SourceTag,
    BatchTag,
    Strain,
    Rename,
    MaterialType,
    Grams,
    Pounds,
    Stage,
    Note,
    RowSource
  }) => [
    License,
    HarvestID,
    SourceTag,
    BatchTag,
    Strain,
    Rename,
    MaterialType,
    Grams,
    Pounds,
    Stage,
    Note,
    RowSource
  ]);

  harvestPackageMatrix.unshift([
    'License',
    'Harvest ID',
    'Source Tag',
    'Batch Tag',
    'Strain',
    'Rename',
    'Material Type',
    'Grams',
    'Pounds',
    'Stage',
    harvestConfig.debug || harvestConfig.displayChecksum ? 'Note' : '',
    harvestConfig.debug ? 'RowSource' : ''
  ]);

  reportData[ReportType.HARVEST_PACKAGES] = {
    harvestPackageMatrix
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
  if (itemName.includes('Popcorn')) {
    return 'Popcorn';
  }

  if (itemName.includes('Preroll')) {
    return 'Prerolls';
  }

  if (itemName.includes('Flower')) {
    return 'Flower';
  }

  return itemName;
}

function recordHarvestPostQcRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
  msg: string
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const initialChildQuantity: number = childPackage.history
    ? extractInitialPackageQuantityAndUnitFromHistoryOrError(childPackage.history!)[0]
    : (childPackage as IIndexedDestinationPackageData).ShippedQuantity;

  harvestPackageRowData.push(
    rowDataFactory({
      License: harvestPackage.LicenseNumber,
      HarvestID: harvest.Name,
      BatchTag: truncateTag(harvestConfig, getLabelOrError(childPackage)),
      Strain: strainName,
      MaterialType: normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
      ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
      Stage: 'Post QC  - Sent to Lab',
      Note: harvestConfig.debug ? msg : '',
      RowSource: '10'
    })
  );
}

function recordPostQcRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  childPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
  msg: string
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  if (!childPackage.history) {
    harvestPackageRowData.push(rowDataFactory({
      Note: `Could not match post QC child package. harvest:${harvest.Name}, label:${getLabelOrError(
        childPackage
      )}`,
      RowSource: '11'
    }));
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
    if (childAdjustmentReasonNote.reason.includes('Waste')) {
      childWasteTotal += childAdjustmentReasonNote.quantity;
    } else {
      childMLOverpackTotal += childAdjustmentReasonNote.quantity;
    }
  }

  harvestPackageRowData.push(
    rowDataFactory({
      License: harvestPackage.LicenseNumber,
      HarvestID: harvest.Name,
      BatchTag: truncateTag(harvestConfig, getLabelOrError(childPackage)),
      Strain: strainName,
      MaterialType: normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
      ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
      Stage: 'Post QC Batch',
      Note: harvestConfig.debug ? msg : '',
      RowSource: '12'
    })
  );

  harvestPackageRowData.push(
    rowDataFactory({
      License: harvestPackage.LicenseNumber,
      HarvestID: harvest.Name,
      BatchTag: truncateTag(harvestConfig, getLabelOrError(childPackage)),
      Strain: strainName,
      MaterialType: normalizeItemNameToMaterialType(getItemNameOrError(childPackage)),
      ...generateUnitsPair(totalChildTestQuantity, childPackage, unitsOfMeasure),
      Stage: 'Post QC Lab Testing',
      RowSource: '13'
    })
  );

  maybeRecordPostQCWasteRow(
    reportConfig,
    harvest,
    strainName,
    harvestPackage,
    harvestPackageRowData,
    unitsOfMeasure,
    childPackage
  );

  // if (harvestConfig.addSpacing) {
  //   harvestPackageRowData.push(rowDataFactory({ RowSource: '14' }));
  // }
}

function recordPackagingRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  grandchildPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
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
    if (grandchildAdjustmentReasonNote.reason.includes('Waste')) {
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

    if (greatgrandchildPackage && getItemNameOrError(greatgrandchildPackage).includes('Shake')) {
      grandchildShakeTotal += greatgrandchildQty;
    } else {
      grandchildPackagedTotal += greatgrandchildQty;
    }
  }

  // Prerolls and other count-based should use the intake quantity,
  // NOT the calculated initial quantity
  const grandchildPackageIsCountBased = getItemUnitOfMeasureAbbreviationOrError(grandchildPackage) === 'ea';

  let intakeQuantityIsWellFormed = true;
  let totalIntakeQuantity: number = 0;
  let intakeQuantityUnit: string | null = null;

  for (const [tag, quantity, unit, item] of extractParentPackageTagQuantityUnitItemSetsFromHistory(grandchildPackage.history)) {
    if (intakeQuantityUnit === null) {
      intakeQuantityUnit = unit;
    } else if (intakeQuantityUnit !== unit) {
      intakeQuantityIsWellFormed = false;
      break;
    }

    totalIntakeQuantity += quantity;
  }

  if (intakeQuantityUnit === null) {
    intakeQuantityIsWellFormed = false;
  }

  const intakeUnit = unitsOfMeasure.find((x) => x.Name === intakeQuantityUnit);

  const shouldOverrideInitialQuantity = grandchildPackageIsCountBased && intakeQuantityIsWellFormed && !!intakeUnit;

  const packagingIntakeUnitsPair = shouldOverrideInitialQuantity
    ? normalizeUnitsPair(
      totalIntakeQuantity,
      intakeUnit,
      unitsOfMeasure
    ) : generateUnitsPair(
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

  const expectedSum = packagingIntakeUnitsPair.Grams;
  const actualSum = packagingUnitsPair.Grams
    + packagingWasteUnitsPair.Grams
    + packagingShakeUnitsPair.Grams
    + packagingMoistureUnitsPair.Grams;

  const passChecksum = Math.abs(1 - expectedSum / actualSum) < 0.01;

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    BatchTag: truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    Strain: strainName,
    MaterialType: normalizeItemNameToMaterialType(getItemNameOrError(grandchildPackage)),
    ...packagingIntakeUnitsPair,
    Stage: 'Packaging Intake',
    Note: harvestConfig.displayChecksum
      ? `Checksum ${passChecksum ? 'PASS' : 'FAIL'} - expected:${expectedSum}g actual:${actualSum}g`
      : '',
    RowSource: '15'
  }));

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,

    BatchTag: truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    Strain: strainName,

    MaterialType: `${normalizeItemNameToMaterialType(getItemNameOrError(grandchildPackage))} - Prepack`,
    ...packagingUnitsPair,
    Stage: 'Packaging',
    Note: harvestConfig.debug ? '' : '',
    RowSource: '16'
  }));

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    BatchTag: truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    Strain: strainName,
    MaterialType: 'Waste',
    ...packagingWasteUnitsPair,
    Stage: 'Packaging - Waste',
    RowSource: '17'
  }));

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    BatchTag: truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    Strain: strainName,
    MaterialType: 'Shake',
    ...packagingShakeUnitsPair,
    Stage: 'Packaging - Sent to Lab',
    Note: harvestConfig.debug ? '' : '',
    RowSource: '18'
  }));

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    BatchTag: truncateTag(harvestConfig, getLabelOrError(grandchildPackage)),
    Strain: strainName,
    MaterialType: 'Moisture Loss',
    ...packagingMoistureUnitsPair,
    Stage: 'Packaging ML/Overpack',
    RowSource: '19'
  }));
}

function recordShakeRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData,
  stage: string
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const [initialChildQuantity, unit] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
    childPackage.history!
  );

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    BatchTag: truncateTag(harvestConfig, getLabelOrError(childPackage)),
    Strain: strainName,
    MaterialType: 'Shake',
    ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
    Stage: stage,
    RowSource: '20'
  }));
}

function maybeRecordPostQCWasteRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const childAdjustmentReasonNoteSets = extractAdjustmentReasonNoteSetsFromHistory(
    childPackage.history!
  );

  let childWasteTotal = 0;

  for (const childAdjustmentReasonNote of childAdjustmentReasonNoteSets) {
    if (childAdjustmentReasonNote.reason.includes('Waste')) {
      childWasteTotal += childAdjustmentReasonNote.quantity;
    }
  }

  if (childWasteTotal !== 0) {
    harvestPackageRowData.push(rowDataFactory({
      License: harvestPackage.LicenseNumber,
      HarvestID: harvest.Name,
      BatchTag: truncateTag(harvestConfig, getLabelOrError(childPackage)),
      Strain: strainName,
      MaterialType: 'Waste',
      ...generateUnitsPair(childWasteTotal, childPackage, unitsOfMeasure),
      Stage: 'Post QC - Waste',
      RowSource: '21'
    }));
  }
}

function recordTrimRow(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[],
  childPackage: IUnionIndexedPackageData
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const [initialChildQuantity, unit] = extractInitialPackageQuantityAndUnitFromHistoryOrError(
    childPackage.history!
  );

  harvestPackageRowData.push(rowDataFactory({
    License: harvestPackage.LicenseNumber,
    HarvestID: harvest.Name,
    SourceTag: truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
    Strain: strainName,
    MaterialType: 'Trim',
    ...generateUnitsPair(initialChildQuantity, childPackage, unitsOfMeasure),
    Stage: 'Post Machine Trim - Sent to Lab',
    RowSource: '22'
  }));
}

function recordHarvestPackageAdjustmentRows(
  reportConfig: IReportConfig,
  harvest: IIndexedHarvestData,
  strainName: string,
  harvestPackage: IUnionIndexedPackageData,
  harvestPackageRowData: IHarvestPackageRowData[],
  unitsOfMeasure: IUnitOfMeasure[]
) {
  const harvestConfig = reportConfig[ReportType.HARVEST_PACKAGES]!;

  const harvestPackageAdjustmentReasonNoteSets = extractAdjustmentReasonNoteSetsFromHistory(
    harvestPackage.history!
  );

  for (const harvestPackageAdjustmentReasonNote of harvestPackageAdjustmentReasonNoteSets) {
    let materialType = 'Adjustment';

    if (harvestPackageAdjustmentReasonNote.reason.includes('Waste')) {
      materialType = 'Waste';
    } else if (harvestPackageAdjustmentReasonNote.reason.includes('Moisture')) {
      materialType = 'Process Loss';
    }

    harvestPackageRowData.push(rowDataFactory({
      License: harvestPackage.LicenseNumber,
      HarvestID: harvest.Name,
      SourceTag: truncateTag(harvestConfig, getLabelOrError(harvestPackage)),
      Strain: strainName,
      MaterialType: materialType,
      ...generateUnitsPair(
        harvestPackageAdjustmentReasonNote.quantity,
        harvestPackage,
        unitsOfMeasure
      ),
      Stage: 'Denug',
      RowSource: '23'
    }));
  }
}

function generateUnitsPair(
  quantity: number,
  pkg: IUnionIndexedPackageData,
  unitsOfMeasure: IUnitOfMeasure[]
): {Grams: number, Pounds: number} {
  let unitOfMeasure = unitsOfMeasure.find(
    (x) => x.Abbreviation === getItemUnitOfMeasureAbbreviationOrError(pkg)
  )!;

  if (getItemUnitOfMeasureAbbreviationOrError(pkg) === 'ea') {
    try {
      const itemQuantityAndUnit = getItemUnitQuantityAndUnitOrError(pkg);

      quantity *= itemQuantityAndUnit.quantity;
      unitOfMeasure = unitsOfMeasure.find(
        (x) => x.Abbreviation === itemQuantityAndUnit.unitOfMeasureAbbreviation
      )!;
    } catch {
      // Item is count based. No meaningful way to extract an initial weight.
      return { Grams: 0, Pounds: 0 };
    }
  }

  return normalizeUnitsPair(quantity, unitOfMeasure, unitsOfMeasure);
}

function normalizeUnitsPair(
  quantity: number,
  unitOfMeasure: IUnitOfMeasure,
  unitsOfMeasure: IUnitOfMeasure[]
):{Grams: number, Pounds: number} {
  const gramUnitOfMeasure = unitsOfMeasure.find((x) => x.Abbreviation === 'g')!;
  const poundUnitOfmeasure = unitsOfMeasure.find((x) => x.Abbreviation === 'lb')!;

  return {
    Grams: parseFloat(Math.abs(convertUnits(quantity, unitOfMeasure, gramUnitOfMeasure)).toFixed(3)),
    Pounds: parseFloat(Math.abs(convertUnits(quantity, unitOfMeasure, poundUnitOfmeasure)).toFixed(3)),
  };
}

function truncateTag(
  harvestConfig: IReportConfig[ReportType.HARVEST_PACKAGES],
  tag: string
): string {
  return harvestConfig!.displayFullTags ? tag : tag.slice(-8).replace(/^0+/, '');
}
