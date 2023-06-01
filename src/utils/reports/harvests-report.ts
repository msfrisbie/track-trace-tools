import { IHarvestFilter, IIndexedHarvestData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface IHarvestsReportFormFilters {
  harvestDateGt: string;
  harvestDateLt: string;
  shouldFilterHarvestDateGt: boolean;
  shouldFilterHarvestDateLt: boolean;
  includeActive: boolean;
  includeInactive: boolean;
}

export const harvestsFormFiltersFactory: () => IHarvestsReportFormFilters = () => ({
  harvestDateGt: todayIsodate(),
  harvestDateLt: todayIsodate(),
  shouldFilterHarvestDateGt: false,
  shouldFilterHarvestDateLt: false,
  includeActive: true,
  includeInactive: false,
});

export function addHarvestsReport({
  reportConfig,
  harvestsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  harvestsFormFilters: IHarvestsReportFormFilters;
  fields: IFieldData[];
}) {
  const harvestFilter: IHarvestFilter = {};

  harvestFilter.includeActive = harvestsFormFilters.includeActive;
  harvestFilter.includeInactive = harvestsFormFilters.includeInactive;

  harvestFilter.harvestDateGt = harvestsFormFilters.shouldFilterHarvestDateGt
    ? harvestsFormFilters.harvestDateGt
    : null;

  harvestFilter.harvestDateLt = harvestsFormFilters.shouldFilterHarvestDateLt
    ? harvestsFormFilters.harvestDateLt
    : null;

  reportConfig[ReportType.HARVESTS] = {
    harvestFilter,
    fields,
  };
}

export async function maybeLoadHarvestsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const harvestConfig = reportConfig[ReportType.HARVESTS];
  if (harvestConfig?.harvestFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading harvests...", level: "success" },
    });

    let harvests: IIndexedHarvestData[] = [];

    if (harvestConfig.harvestFilter.includeActive) {
      try {
        harvests = [...harvests, ...(await primaryDataLoader.activeHarvests())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load active harvests.", level: "warning" },
        });
      }
    }

    if (harvestConfig.harvestFilter.includeInactive) {
      try {
        harvests = [...harvests, ...(await primaryDataLoader.inactiveHarvests())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive harvests.", level: "warning" },
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

    reportData[ReportType.HARVESTS] = {
      harvests,
    };
  }
}
