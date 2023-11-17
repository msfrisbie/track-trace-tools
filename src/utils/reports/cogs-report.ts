import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS, SheetTitles } from '@/consts';
import {
  IIndexedRichOutgoingTransferData,
  IMetadataSimplePackageData,
  IPackageFilter,
  IPluginState,
  ISimpleOutgoingTransferData,
  ISimplePackageData,
  ISimpleTransferPackageData,
  ISpreadsheet,
  ITransferFilter,
} from '@/interfaces';
import { DataLoader, getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { messageBus } from '@/modules/message-bus.module';
import store from '@/store/page-overlay/index';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  ICogsArchive,
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import { CompressedDataWrapper } from '../compression';
import { downloadCsvFile } from '../csv';
import { getIsoDateFromOffset, todayIsodate } from '../date';
import {
  extractChildPackageTagQuantityPairsFromHistory,
  extractParentPackageLabelsFromHistory,
} from '../history';
import {
  getParentPackageLabels,
  simplePackageConverter,
  simplePackageNormalizer,
  simpleTransferPackageConverter,
} from '../package';
import {
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  freezeTopRowRequestFactory,
  getLetterFromIndex,
  styleTopRowRequestFactory,
} from '../sheets';
import { writeDataSheet } from '../sheets-export';

interface ICogsReportFormFilters {
  cogsDateGt: string;
  cogsDateLt: string;
}

export const cogsFormFiltersFactory: () => ICogsReportFormFilters = () => ({
  cogsDateGt: todayIsodate(),
  cogsDateLt: todayIsodate(),
});

export function addCogsReport({
  reportConfig,
  cogsFormFilters,
  mutableArchiveData,
}: {
  reportConfig: IReportConfig;
  cogsFormFilters: ICogsReportFormFilters;
  mutableArchiveData: ICogsArchive;
}) {
  const packageFilter: IPackageFilter = {};
  const transferFilter: ITransferFilter = {};

  packageFilter.packagedDateGt = cogsFormFilters.cogsDateGt;
  packageFilter.packagedDateLt = cogsFormFilters.cogsDateLt;

  transferFilter.estimatedDepartureDateGt = cogsFormFilters.cogsDateGt;
  transferFilter.estimatedDepartureDateLt = cogsFormFilters.cogsDateLt;

  reportConfig[ReportType.COGS] = {
    packageFilter,
    transferFilter,
    fields: null,
    mutableArchiveData,
  };
}

export async function maybeLoadCogsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.COGS]) {
    return;
  }

  // packageFilter and transferFilter will have identical dates
  const { transferFilter } = reportConfig[ReportType.COGS]!;

  const mutableArchiveData = reportConfig[ReportType.COGS]!.mutableArchiveData;

  const packageWrapper = new CompressedDataWrapper<ISimplePackageData>(
    'Package',
    mutableArchiveData.packages,
    'Label',
    mutableArchiveData.packagesKeys,
  );
  const transferWrapper = new CompressedDataWrapper<ISimpleOutgoingTransferData>(
    'Transfers',
    mutableArchiveData.transfers,
    'ManifestNumber',
    mutableArchiveData.transfersKeys,
  );
  const transferPackageWrapper = new CompressedDataWrapper<ISimpleTransferPackageData>(
    'Transfer Package',
    mutableArchiveData.transfersPackages,
    'Label',
    mutableArchiveData.transfersPackagesKeys,
  );

  function mergedFindAndUnpackOrNull(label: string): IMetadataSimplePackageData | null {
    const pkg = packageWrapper.findOrNull(label);
    if (pkg) {
      return simplePackageNormalizer(packageWrapper.unpack(pkg));
    }
    const transferPkg = transferPackageWrapper.findOrNull(label);
    if (transferPkg) {
      return simplePackageNormalizer(transferPackageWrapper.unpack(transferPkg));
    }
    return null;
  }

  let dataLoader: DataLoader | null = null;

  for (const license of mutableArchiveData.licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: 'success' },
    });

    dataLoader = await getDataLoaderByLicense(license);

    try {
      (await dataLoader.activePackages()).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load active packages. (${license})`, level: 'warning' },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.onHoldPackages()).map(simplePackageConverter);
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load on hold packages. (${license})`, level: 'warning' },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.inactivePackages()).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load inactive packages. (${license})`, level: 'warning' },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.inTransitPackages()).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Failed to load in transit packages. (${license})`,
          level: 'warning',
        },
      });
    }

    packageWrapper.flushCounter();
  }

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of mutableArchiveData.licenses) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} transfers...`, level: 'success' },
    });

    dataLoader = await getDataLoaderByLicense(license);
    try {
      const outgoingTransfers = await dataLoader.outgoingTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Failed to load outgoing transfers.', level: 'warning' },
      });
    }

    try {
      const rejectedTransfers = await dataLoader.rejectedTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...rejectedTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Failed to load rejected transfers.', level: 'warning' },
      });
    }

    try {
      const outgoingInactiveTransfers = await dataLoader.outgoingInactiveTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingInactiveTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Failed to load outgoing inactive transfers.', level: 'warning' },
      });
    }
  }

  const [departureDateGt] = transferFilter.estimatedDepartureDateGt!.split('T');
  const [departureDateLt] = getIsoDateFromOffset(1, transferFilter.estimatedDepartureDateLt!).split(
    'T',
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: 'Loading destinations....', level: 'success' },
  });

  let inflightCount = 0;

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  for (const transfer of richOutgoingTransfers) {
    if (transferWrapper.index.has(transfer.ManifestNumber)) {
      continue;
    }

    inflightCount++;
    richOutgoingTransferDestinationRequests.push(
      getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
        dataLoader
          .transferDestinations(transfer.Id)
          .then((destinations) => {
            transfer.outgoingDestinations = destinations;
          })
          .finally(() => inflightCount--)),
    );

    if (richOutgoingTransferDestinationRequests.length % 250 === 0) {
      await Promise.allSettled(richOutgoingTransferDestinationRequests);

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations....`,
          level: 'success',
        },
        prependMessage: false,
      });
    }

    while (inflightCount > 10) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Waiting for ${inflightCount} requests to finish....`,
          level: 'success',
        },
        prependMessage: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await Promise.allSettled(richOutgoingTransferDestinationRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations`,
      level: 'success',
    },
    prependMessage: false,
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: 'Loading manifest packages...', level: 'success' },
  });

  const packageRequests: Promise<any>[] = [];

  // Load manifest packages for all transfers
  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations || []) {
      // Existing transfer means the packages are already in the archive
      if (transferWrapper.index.has(transfer.ManifestNumber)) {
        continue;
      }

      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destinationPackages.map((pkg) =>
              transferPackageWrapper.add(simpleTransferPackageConverter(transfer, destination, pkg)));
          })),
      );

      transferPackageWrapper.flushCounter();

      if (packageRequests.length % 50 === 0) {
        await Promise.allSettled(packageRequests);

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Loaded ${packageRequests.length} manifests....`,
            level: 'success',
          },
          prependMessage: false,
        });
      }
    }
  }

  const packageResults = await Promise.allSettled(packageRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${packageRequests.length} manifests`,
      level: 'success',
    },
  });

  const tradeSampleTransferLabels: Set<string> = new Set();
  const testingSampleTransferLabels: Set<string> = new Set();

  for (const transferPackage of transferPackageWrapper) {
    if (transferPackage.Type.includes('Trade Sample Transfer')) {
      tradeSampleTransferLabels.add(transferPackage.Label);
    }
    if (transferPackage.Type.includes('Testing Transfer')) {
      testingSampleTransferLabels.add(transferPackage.Label);
    }
  }

  console.log(
    `Failed package requests: ${packageResults.filter((x) => x.status !== 'fulfilled').length}`,
  );

  // Packages for the final manifest output page
  const eligibleWholesaleTransferPackageWrapper = new CompressedDataWrapper<ISimpleTransferPackageData>(
    'Eligible Wholesale Transfer Packages',
    [],
    transferPackageWrapper.indexedKey,
    transferPackageWrapper.keys,
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Locating wholesale packages...',
      level: 'success',
    },
  });

  // Find eligible packages that should be included in this report
  for (const transferPkg of transferPackageWrapper) {
    if (transferPkg.ETD < departureDateGt) {
      continue;
    }

    if (transferPkg.ETD > departureDateLt) {
      continue;
    }

    if (!transferPkg.Type.includes('Wholesale')) {
      continue;
    }

    eligibleWholesaleTransferPackageWrapper.add(transferPkg);
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Found ${eligibleWholesaleTransferPackageWrapper.data.length} wholesale packages`,
      level: 'success',
    },
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Building package history tree...',
      level: 'success',
    },
  });

  const stack: string[] = [...eligibleWholesaleTransferPackageWrapper].map((x) => x.Label);

  // The "manifest tree" is all packages that are upstream of a wholesale transfer package
  const eligibleWholesaleManifestTreeLabels = new Set<string>();

  // console.log(`Eligible package count: ${stack.length}`);

  while (true) {
    if (stack.length === 0) {
      break;
    }

    const nextLabel = stack.pop()!;

    let parentLabels: string[] | null = null;

    // Package might appear in both lists,
    // Prefer package lookup over transfer package
    const matchedPkg = mergedFindAndUnpackOrNull(nextLabel);
    if (matchedPkg) {
      parentLabels = await getParentPackageLabels(matchedPkg);
    }

    if (parentLabels) {
      parentLabels.map((parentLabel) => {
        if (!eligibleWholesaleManifestTreeLabels.has(parentLabel)) {
          stack.push(parentLabel);
        }
      });
    }

    eligibleWholesaleManifestTreeLabels.add(nextLabel);
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `${eligibleWholesaleManifestTreeLabels.size} packages in history tree`,
      level: 'success',
    },
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Loading remaining history data...',
      level: 'success',
    },
  });

  const treePackageWrapper = new CompressedDataWrapper<ISimplePackageData>(
    'Tree Packages',
    [],
    packageWrapper.indexedKey,
    packageWrapper.keys,
  );

  for (const label of eligibleWholesaleManifestTreeLabels) {
    const pkg = mergedFindAndUnpackOrNull(label);
    if (pkg) {
      treePackageWrapper.add(pkg);
    }
  }

  const packageHistoryRequests: Promise<any>[] = [];

  // Non-transfer packages need history loaded to build fractional cost data
  for (const pkg of treePackageWrapper) {
    if (pkg.childPackageLabelQuantityPairs || pkg.parentPackageLabels) {
      // History has already been parsed
      continue;
    }

    packageHistoryRequests.push(
      getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
          treePackageWrapper.update(
            pkg.Label,
            'parentPackageLabels',
            extractParentPackageLabelsFromHistory(history),
          );

          treePackageWrapper.update(
            pkg.Label,
            'childPackageLabelQuantityPairs',
            extractChildPackageTagQuantityPairsFromHistory(history),
          );
        })),
    );

    if (packageHistoryRequests.length % 100 === 0) {
      await Promise.allSettled(packageHistoryRequests);
    }
  }

  await Promise.allSettled(packageHistoryRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Finished loading history',
      level: 'success',
    },
  });

  const treeTransferPackageWrapper = new CompressedDataWrapper<ISimpleTransferPackageData>(
    'Tree Transfer Packages',
    [],
    transferPackageWrapper.indexedKey,
    transferPackageWrapper.keys,
  );

  for (const label of eligibleWholesaleManifestTreeLabels) {
    const pkg = mergedFindAndUnpackOrNull(label);

    if (pkg) {
      treeTransferPackageWrapper.add(pkg);
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Calculating cost distribution...',
      level: 'success',
    },
  });

  // Build a list of children for each package, this is used as the backup when
  // history is not available for a package
  const treeChildMap = new Map<string, Set<string>>();

  const FRACTIONAL_COST_KEY = 'fractionalCostMultiplierPairs';

  // Merge the two package types to prepare for fractional cost calculation
  const unifiedTreePackageWrapper = new CompressedDataWrapper<IMetadataSimplePackageData>(
    'Unified Tree Wrapper',
    [],
    treeTransferPackageWrapper.indexedKey,
    [...treeTransferPackageWrapper.keys, FRACTIONAL_COST_KEY],
  );

  for (const pkg of treePackageWrapper) {
    unifiedTreePackageWrapper.add(simplePackageNormalizer(pkg));
  }

  for (const transferPkg of treeTransferPackageWrapper) {
    unifiedTreePackageWrapper.add(simplePackageNormalizer(transferPkg));
  }

  for (const treePkg of unifiedTreePackageWrapper) {
    const parentPackageLabels = await getParentPackageLabels(treePkg);

    unifiedTreePackageWrapper.update(treePkg.Label, 'parentPackageLabels', parentPackageLabels);

    for (const parentLabel of parentPackageLabels) {
      if (treeChildMap.has(parentLabel)) {
        treeChildMap.get(parentLabel)!.add(treePkg.Label);
      } else {
        treeChildMap.set(parentLabel, new Set([treePkg.Label]));
      }
    }
  }

  let unmatchedParentCount = 0;
  let unmatchedChildLabelCount = 0;
  let unmatchedChildSetCount = 0;
  let fatalChildMismatchCount = 0;
  let usedBackupAlgorithmCount = 0;
  let successfulMatchCount = 0;
  let fullInheritanceBackupCount = 0;
  let inexactInheritanceBackupCount = 0;
  const duplicateLabelCount = 0;
  let emptiedChildLabelsCount = 0;
  const unmatchedChildPackages: string[] = [];
  const inexactInheritanceBackupLabels: string[] = [];
  let testOrTradeExcludedCount = 0;

  for (const pkg of unifiedTreePackageWrapper) {
    const pairs: [string, number][] = [];

    for (const parentLabel of pkg.parentPackageLabels!) {
      const parentPkg = mergedFindAndUnpackOrNull(parentLabel);

      if (!parentPkg) {
        // Parent package is not loaded. This can happend for packages that were
        // transferred into an owned facility from an unowned facility.
        ++unmatchedParentCount;
        continue;
      }

      if (parentPkg.childPackageLabelQuantityPairs) {
        // Calculate the sum of all child package material
        const total = parentPkg.childPackageLabelQuantityPairs
          .filter(([label, qty]) => {
            if (testingSampleTransferLabels.has(label)) {
              testOrTradeExcludedCount++;
              return false;
            }

            if (tradeSampleTransferLabels.has(label)) {
              testOrTradeExcludedCount++;
              return false;
            }

            return true;
          })
          .reduce((a, b) => a + b[1], 0);

        const matchingPair = parentPkg.childPackageLabelQuantityPairs.find(
          (x) => x[0] === pkg.Label,
        );

        if (!matchingPair) {
          // Child package indicated it came from a parent, but the parent's
          // contribution to the child could not be extracted. TODO investigate
          unmatchedChildLabelCount++;
          unmatchedChildPackages.push(pkg.Label);
          continue;
        }

        ++successfulMatchCount;

        pairs.push([parentPkg.Label, matchingPair[1] / total]);
      } else {
        // Packages that have left the facilitty have no history. If they are a parent package,
        // the a fallback calculation is needed to estimate fractional cost.
        ++usedBackupAlgorithmCount;
        const childLabels = treeChildMap.get(parentPkg.Label);

        if (!childLabels) {
          ++unmatchedChildSetCount;
          continue;
        } else {
          for (const label of childLabels) {
            if (tradeSampleTransferLabels.has(label)) {
              childLabels.delete(label);
            }
            if (testingSampleTransferLabels.has(label)) {
              childLabels.delete(label);
            }
          }

          if (childLabels.size === 0) {
            emptiedChildLabelsCount++;
          }

          if (!childLabels.has(pkg.Label)) {
            fatalChildMismatchCount++;
            continue;
          }

          if (childLabels.size === 1) {
            // 100% goes to the child. Accuracy is preserved.
            ++fullInheritanceBackupCount;
            pairs.push([parentLabel, 1]);
          } else {
            // This will be inexact.
            ++inexactInheritanceBackupCount;
            inexactInheritanceBackupLabels.push(parentLabel);
            pairs.push([parentLabel, 1 / childLabels.size]);
          }
        }
      }
    }

    unifiedTreePackageWrapper.update(pkg.Label, FRACTIONAL_COST_KEY, pairs);
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Completed cost calculation',
      level: 'success',
    },
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Organizing data for sheets export...',
      level: 'success',
    },
  });

  const keyIdx = unifiedTreePackageWrapper.columnIdxOrError('ProductionBatchNumber');
  unifiedTreePackageWrapper.sort((a, b) => {
    const aVal = a[keyIdx] ?? '';
    const bVal = b[keyIdx] ?? '';

    if (aVal === '' && bVal === '') {
      return 0;
    } if (aVal === '') {
      return 1;
    } if (bVal === '') {
      return -1;
    }
    return aVal.localeCompare(bVal);
  });

  const auditData = {
    unmatchedParentCount,
    unmatchedChildLabelCount,
    unmatchedChildSetCount,
    fatalChildMismatchCount,
    usedBackupAlgorithmCount,
    successfulMatchCount,
    duplicateLabelCount,
    fullInheritanceBackupCount,
    inexactInheritanceBackupCount,
    testOrTradeExcludedCount,
    testingSampleTransferCount: testingSampleTransferLabels.size,
    tradeSampleTransferCount: tradeSampleTransferLabels.size,
  };

  const ENABLE_CELL = `'${SheetTitles.OVERVIEW}'!C3`;

  const titles = ['Label', 'PB #', 'PB Cost', 'Computed Cost'];

  const inputCostColumnIndex = 2;
  const computedCostColumnIndex = 3;

  const worksheetMatrix: any[][] = [titles];

  // off-by-one index plus header row
  const OFFSET = 2;

  function decodeLabelToIndex(label: string): number {
    const idx = unifiedTreePackageWrapper.index.get(label);
    return idx! + OFFSET;
  }

  for (const [idx, pkg] of [...unifiedTreePackageWrapper].entries()) {
    if (!pkg.fractionalCostMultiplierPairs) {
      console.error(`Empty fractional pairs: ${pkg}`);
    }

    const expr: string = pkg
      .fractionalCostMultiplierPairs!.map(([parentLabel, multiplier]) => `(${getLetterFromIndex(computedCostColumnIndex)}${decodeLabelToIndex(
        parentLabel,
      )} * ${multiplier})`)
      .join('+');

    const inheritedCostExpression = expr.length > 0 ? `+(${expr})` : '';

    worksheetMatrix.push([
      pkg.Label,
      pkg.ProductionBatchNumber,
      (pkg.ProductionBatchNumber ?? '').length === 0 ? '0' : '',
      `=${getLetterFromIndex(inputCostColumnIndex)}${idx + OFFSET}${inheritedCostExpression}`,
    ]);
  }

  const cogsMatrix: any[][] = [
    ['Manifest #', 'Package', 'Item', 'Quantity', 'UOM', 'COGS', 'Unit COGS'],
  ];

  let idx = 0;
  for (const pkg of eligibleWholesaleTransferPackageWrapper) {
    // TODO figure out grouping for manifest coloring
    cogsMatrix.push([
      pkg.ManifestNumber,
      pkg.Label,
      pkg.ItemName,
      pkg.Quantity,
      pkg.UnitOfMeasureAbbreviation,
      `='${SheetTitles.WORKSHEET}'!${getLetterFromIndex(
        computedCostColumnIndex,
      )}${decodeLabelToIndex(pkg.Label)}`,
      pkg.UnitOfMeasureAbbreviation === 'ea'
        ? `=${getLetterFromIndex(5)}${idx + 2}/${getLetterFromIndex(3)}${idx + 2}`
        : '',
    ]);
    idx++;
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: 'Exporting to Google Sheets...',
      level: 'success',
    },
  });

  // await createDebugSheetOrError({
  //   spreadsheetName: "Cost Sheet",
  //   sheetTitles: [SheetTitles.WORKSHEET, SheetTitles.MANIFEST_COGS],
  //   sheetDataMatrixes: [worksheetMatrix, cogsMatrix],
  // });

  reportData[ReportType.COGS] = {
    auditData,
    worksheetMatrix,
    cogsMatrix,
  };
}

export async function createCogsSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error('Invalid authState');
  }

  if (!reportData[ReportType.COGS]) {
    throw new Error('Missing COGS data');
  }

  const sheetTitles = [
    SheetTitles.OVERVIEW,
    // SheetTitles.PRODUCTION_BATCH_COSTS,
    SheetTitles.WORKSHEET,
    SheetTitles.MANIFEST_COGS,
  ];

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `COGS - ${todayIsodate()}`,
      sheetTitles,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS,
  );

  if (!response.data.success) {
    throw new Error('Unable to create COGS sheet');
  }

  let formattingRequests: any = [
    addRowsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      length: 20,
    }),
    styleTopRowRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
    }),
  ];

  const { worksheetMatrix, cogsMatrix, auditData } = reportData[ReportType.COGS]!;

  const worksheetSheetId = sheetTitles.indexOf(SheetTitles.WORKSHEET);
  const manifestSheetId = sheetTitles.indexOf(SheetTitles.MANIFEST_COGS);

  formattingRequests = [
    ...formattingRequests,
    // Worksheet
    addRowsRequestFactory({ sheetId: worksheetSheetId, length: worksheetMatrix.length }),
    styleTopRowRequestFactory({ sheetId: worksheetSheetId }),
    freezeTopRowRequestFactory({ sheetId: worksheetSheetId }),
    // Manifest COGS
    addRowsRequestFactory({ sheetId: manifestSheetId, length: cogsMatrix.length }),
    styleTopRowRequestFactory({ sheetId: manifestSheetId }),
    freezeTopRowRequestFactory({ sheetId: manifestSheetId }),
  ];

  await messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: formattingRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS,
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [
        [],
        [],
        [null, 'Enable calculator:'],
        [],
        ...Object.entries(auditData).map(([key, value]) => ['', key, JSON.stringify(value)]),
      ],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS,
  );

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: 'Writing worksheet data...', level: 'success' },
  });

  await downloadCsvFile({
    csvFile: {
      filename: 'worksheet.csv',
      data: worksheetMatrix,
    },
  });

  await downloadCsvFile({
    csvFile: {
      filename: 'cogs.csv',
      data: cogsMatrix,
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.WORKSHEET,
    data: worksheetMatrix.map((row) => row.slice(row.length - 1)),
    options: {
      rangeStartColumn: getLetterFromIndex(worksheetMatrix[0].length - 1),
      pageSize: 1000,
      valueInputOption: 'USER_ENTERED',
      // batchWrite: true,
      maxParallelRequests: 50,
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.WORKSHEET,
    data: worksheetMatrix.map((row) => row.slice(0, row.length - 1)),
    options: {
      valueInputOption: 'RAW',
      batchWrite: true,
    },
  });

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: 'Writing manifest data...', level: 'success' },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.MANIFEST_COGS,
    data: cogsMatrix.map((row) => row.slice(row.length - 2)),
    options: {
      rangeStartColumn: getLetterFromIndex(cogsMatrix[0].length - 2),
      pageSize: 5000,
      valueInputOption: 'USER_ENTERED',
      // batchWrite: true,
      maxParallelRequests: 10,
    },
  });

  await writeDataSheet({
    spreadsheetId: response.data.result.spreadsheetId,
    spreadsheetTitle: SheetTitles.MANIFEST_COGS,
    data: cogsMatrix.map((row) => row.slice(0, row.length - 2)),
    options: {
      valueInputOption: 'RAW',
      batchWrite: true,
    },
  });

  store.commit(`reports/${ReportsMutations.SET_STATUS}`, {
    statusMessage: { text: 'Resizing sheets...', level: 'success' },
  });

  let resizeRequests: any[] = [
    autoResizeDimensionsRequestFactory({
      sheetId: sheetTitles.indexOf(SheetTitles.OVERVIEW),
      dimension: 'COLUMNS',
    }),
  ];

  resizeRequests = [
    ...resizeRequests,
    autoResizeDimensionsRequestFactory({
      sheetId: worksheetSheetId,
    }),
    autoResizeDimensionsRequestFactory({
      sheetId: manifestSheetId,
    }),
  ];

  // This is incredibly slow for huge sheets, don't wait for it to finish
  messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: resizeRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS,
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SheetTitles.OVERVIEW}'`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS,
  );

  return response.data.result;
}
