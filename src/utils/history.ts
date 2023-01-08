import { METRC_TAG_REGEX_PATTERN } from "@/consts";
import { IPackageHistoryData } from "@/interfaces";

function extractParentPackageLabelOrNull(description: string): string | null {
  const parentMatcher = new RegExp(`/from Package (${METRC_TAG_REGEX_PATTERN})/`);
  const match = description.match(parentMatcher);

  return match ? match[0] : null;
}

function extractChildPackageLabelOrNull(description: string): string | null {
    const parentMatcher = new RegExp(`/for Package (${METRC_TAG_REGEX_PATTERN})/`);
    const match = description.match(parentMatcher);
  
    return match ? match[0] : null;
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

export function extractChildPackageLabelsFromHistory(
    historyList: IPackageHistoryData[]
  ): string[] {
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
  
