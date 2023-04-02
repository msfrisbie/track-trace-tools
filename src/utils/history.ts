import { METRC_TAG_REGEX_PATTERN } from "@/consts";
import { IPackageHistoryData } from "@/interfaces";

function extractParentPackageLabelOrNull(description: string): string | null {
  const parentMatcher = new RegExp(`from Package (${METRC_TAG_REGEX_PATTERN})`);
  const match = description.match(parentMatcher);

  return match ? match[1] : null;
}

function extractChildPackageLabelOrNull(description: string): string | null {
  const childMatcher = new RegExp(`for Package (${METRC_TAG_REGEX_PATTERN})`);
  const match = description.match(childMatcher);

  return match ? match[1] : null;
}

function extractTestSamplePackageLabelOrNull(description: string): string | null {
  const testSampleMatcher = new RegExp(
    `Related Package's \\((${METRC_TAG_REGEX_PATTERN})\\) Lab Testing set to`
  );
  const match = description.match(testSampleMatcher);

  return match ? match[1] : null;
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
