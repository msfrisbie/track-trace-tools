import { IIndexedTagData, IPluginState, ITagFilter } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";

interface ITagsReportFormFilters {
  includeAvailable: boolean;
  includeUsed: boolean;
  includeVoided: boolean;
  includePackage: boolean;
  includePlant: boolean;
}

export const tagsFormFiltersFactory: () => ITagsReportFormFilters = () => ({
  includeAvailable: true,
  includeUsed: false,
  includeVoided: false,
  includePackage: true,
  includePlant: true,
});

export function addTagsReport({
  reportConfig,
  tagsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  tagsFormFilters: ITagsReportFormFilters;
  fields: IFieldData[];
}) {
  const tagFilter: ITagFilter = {};

  tagFilter.includeAvailable = tagsFormFilters.includeAvailable;
  tagFilter.includeUsed = tagsFormFilters.includeUsed;
  tagFilter.includeVoided = tagsFormFilters.includeVoided;
  tagFilter.includePlant = tagsFormFilters.includePlant;
  tagFilter.includePackage = tagsFormFilters.includePackage;

  reportConfig[ReportType.TAGS] = {
    tagFilter,
    fields,
  };
}

export async function maybeLoadTagsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const tagConfig = reportConfig[ReportType.TAGS];
  if (tagConfig?.tagFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading tags...", level: "success" },
    });

    let tags: IIndexedTagData[] = [];

    if (tagConfig.tagFilter.includeAvailable) {
      try {
        tags = [...tags, ...(await primaryDataLoader.availableTags())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load active tags.", level: "warning" },
        });
      }
    }

    if (tagConfig.tagFilter.includeUsed) {
      try {
        tags = [...tags, ...(await primaryDataLoader.usedTags())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load used tags.", level: "warning" },
        });
      }
    }

    if (tagConfig.tagFilter.includeVoided) {
      try {
        tags = [...tags, ...(await primaryDataLoader.voidedTags())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load voided tags.", level: "warning" },
        });
      }
    }

    // This filter is expensive, only conditionally apply if necessary
    if (!tagConfig.tagFilter.includePlant || !tagConfig.tagFilter.includePackage) {
      tags = tags.filter((tag) => {
        if (!tagConfig.tagFilter.includePlant) {
          if (tag.TagTypeName.includes("Plant")) {
            return false;
          }
        }

        if (!tagConfig.tagFilter.includePackage) {
          if (tag.TagTypeName.includes("Package")) {
            return false;
          }
        }

        return true;
      });
    }

    reportData[ReportType.TAGS] = {
      tags,
    };
  }
}
