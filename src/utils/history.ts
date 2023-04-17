import { METRC_TAG_REGEX_PATTERN } from "@/consts";
import { IPackageHistoryData } from "@/interfaces";

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

export function extractPackagedPlantBatchNameOrNull(description: string): string | null {
  const matcher = new RegExp(`Plant Batch: (${METRC_TAG_REGEX_PATTERN})`);
  const match = description.match(matcher);

  return match ? match[1] : null;
}

export function extractMotherPlantBatchNameOrNull(description: string): string | null {
  const matcher = new RegExp(`from Mother Plant in Plant Batch: "(${METRC_TAG_REGEX_PATTERN})"`);
  const match = description.match(matcher);

  return match ? match[1] : null;
}

export function extractTagQuantityPairOrNull(description: string): {
  tag: string;
  quantity: number;
} | null {
  const pairMatcher = new RegExp(`Used ([\\d,\\.]+) .* for Package (${METRC_TAG_REGEX_PATTERN})`);

  const match = description.match(pairMatcher);

  return match
    ? {
        tag: match[2] as string,
        // @ts-ignore
        quantity: parseFloat(match[1].replaceAll(",", "")),
      }
    : null;
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

export function extractTagQuantityPairsFromHistory(historyList: IPackageHistoryData[]): {
  tag: string;
  quantity: number;
}[] {
  const pairs: {
    tag: string;
    quantity: number;
  }[] = [];

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
