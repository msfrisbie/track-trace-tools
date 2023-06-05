import {
  METRC_TAG_REGEX_PATTERN,
  PLANT_BATCH_NAME_REGEX_PATTERN,
  ZERO_PADDED_MANIFEST_NUMBER_REGEX_PATTERN,
} from "@/consts";
import { IPackageHistoryData } from "@/interfaces";

// Single history entry methods

export function extractInitialPackageQuantityAndUnitOrNull(
  description: string
): [number, string] | null {
  const matcher = new RegExp(`^Packaged ([0-9,\.]+) ([a-zA-Z\s]+) of`);
  const match = description.match(matcher);

  return match ? [parseFloat(match[1].replaceAll(',', '')), match[2]] : null;
}

export function extractParentPackageLabelOrNull(description: string): string | null {
  const parentMatcher = new RegExp(`from Package (${METRC_TAG_REGEX_PATTERN})`);
  const match = description.match(parentMatcher);

  return match ? match[1] : null;
}

export function extractChildPackageLabelOrNull(description: string): string | null {
  const childMatcher = new RegExp(`for Package (${METRC_TAG_REGEX_PATTERN})`);
  const match = description.match(childMatcher);

  return match ? match[1] : null;
}

export function extractTestSamplePackageLabelOrNull(description: string): string | null {
  const testSampleMatcher = new RegExp(
    `Related Package's \\((${METRC_TAG_REGEX_PATTERN})\\) Lab Testing set to`
  );
  const match = description.match(testSampleMatcher);

  return match ? match[1] : null;
}

export function extractPlantBatchNameOrNull(description: string): string | null {
  const matchers = [
    // Order is important here: first match will be retunred
    new RegExp(`Plant Batch: (${PLANT_BATCH_NAME_REGEX_PATTERN}) > ${METRC_TAG_REGEX_PATTERN}`),
    new RegExp(`Plant Batch: "(${PLANT_BATCH_NAME_REGEX_PATTERN})" > ${METRC_TAG_REGEX_PATTERN}`),
    new RegExp(`Plant Batch: (${PLANT_BATCH_NAME_REGEX_PATTERN})`),
    new RegExp(`Plant Batch \\((${PLANT_BATCH_NAME_REGEX_PATTERN})\\)`),
    new RegExp(`Plant Batch: "(${PLANT_BATCH_NAME_REGEX_PATTERN})"`),
    new RegExp(`Plant Batch "(${PLANT_BATCH_NAME_REGEX_PATTERN})"`),
  ];
  for (const matcher of matchers) {
    const match = description.match(matcher);

    if (match) {
      return match[1];
    }
  }

  return null;
}

export function extractPlantLabelOrNull(description: string): string | null {
  const matchers = [
    new RegExp(`Plant "(${METRC_TAG_REGEX_PATTERN})"`),
    new RegExp(`Plant: ${PLANT_BATCH_NAME_REGEX_PATTERN} > (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Plant: "${PLANT_BATCH_NAME_REGEX_PATTERN}" > (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`from Plant (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Plant (${METRC_TAG_REGEX_PATTERN})`),
  ];
  for (const matcher of matchers) {
    const match = description.match(matcher);

    if (match) {
      return match[1];
    }
  }

  return null;
}

export function extractPackageLabelOrNull(description: string): string | null {
  const matchers = [
    new RegExp(`Plant Batch Package "(${METRC_TAG_REGEX_PATTERN})"`),
    new RegExp(`Plant Batch: ${PLANT_BATCH_NAME_REGEX_PATTERN} > (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Plant Batch: "${PLANT_BATCH_NAME_REGEX_PATTERN}" > (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Related Package's \\((${METRC_TAG_REGEX_PATTERN})\\) Lab Testing set to`),
    new RegExp(`for Package (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`from Package (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Packaged into (${METRC_TAG_REGEX_PATTERN})`),
    new RegExp(`Package (${METRC_TAG_REGEX_PATTERN})`),
  ];
  for (const matcher of matchers) {
    const match = description.match(matcher);

    if (match) {
      return match[1];
    }
  }

  return null;
}

export function extractOutgoingTransferManifestNumberOrNull(description: string): string | null {
  const matchers: RegExp[] = [
    new RegExp(`Manifest # (${ZERO_PADDED_MANIFEST_NUMBER_REGEX_PATTERN})`),
  ];
  for (const matcher of matchers) {
    const match = description.match(matcher);

    if (match) {
      return match[1];
    }
  }

  return null;
}

export function extractHarvestNameOrNull(description: string): string | null {
  const matchers: RegExp[] = [new RegExp(`Harvest "([^"]+)"`)];
  for (const matcher of matchers) {
    const match = description.match(matcher);

    if (match) {
      return match[1];
    }
  }

  return null;
}

export function extractTagQuantityPairOrNull(description: string): [string, number] | null {
  const pairMatcher = new RegExp(`Used ([\\d,\\.]+) .* for Package (${METRC_TAG_REGEX_PATTERN})`);

  const match = description.match(pairMatcher);

  return match
    ? [
        match[2] as string,
        // @ts-ignore
        parseFloat(match[1].replaceAll(",", "")),
      ]
    : null;
}

// Full history methods

export function extractInitialPackageQuantityAndUnitOrError(
  historyList: IPackageHistoryData[]
): [number, string] {
  for (const history of historyList) {
    for (const description of history.Descriptions) {
      const match = extractInitialPackageQuantityAndUnitOrNull(description);

      if (match) {
        return match;
      }
    }
  }

  throw new Error("Could not locate initial quantity");
}

export function extractParentPackageLabelsFromHistory(
  historyList: IPackageHistoryData[]
): string[] {
  const parentPackageLabels = [];

  for (const history of historyList) {
    for (const description of history.Descriptions) {
      const parentPackageLabel = extractParentPackageLabelOrNull(description);

      if (parentPackageLabel) {
        parentPackageLabels.push(parentPackageLabel);
      }
    }
  }

  return parentPackageLabels;
}

export function extractChildPackageLabelsFromHistory(historyList: IPackageHistoryData[]): string[] {
  const childPackageLabels = [];

  for (const history of historyList) {
    for (const description of history.Descriptions) {
      const childPackageLabel = extractChildPackageLabelOrNull(description);

      if (childPackageLabel) {
        childPackageLabels.push(childPackageLabel);
      }
    }
  }

  return childPackageLabels;
}

export function extractTestSamplePackageLabelsFromHistory(
  historyList: IPackageHistoryData[]
): string[] {
  const testSamplePackageLabels = [];

  for (const history of historyList) {
    for (const description of history.Descriptions) {
      const testSamplePackageLabel = extractTestSamplePackageLabelOrNull(description);

      if (testSamplePackageLabel) {
        testSamplePackageLabels.push(testSamplePackageLabel);
      }
    }
  }

  return testSamplePackageLabels;
}

export function extractTagQuantityPairsFromHistory(
  historyList: IPackageHistoryData[]
): [string, number][] {
  const pairs: [string, number][] = [];

  for (const history of historyList) {
    for (const description of history.Descriptions) {
      const result = extractTagQuantityPairOrNull(description);

      if (result) {
        pairs.push(result);
      }
    }
  }

  return pairs;
}
