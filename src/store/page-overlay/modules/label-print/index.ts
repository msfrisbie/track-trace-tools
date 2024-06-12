import { IIndexedPackageData, IIndexedPlantBatchData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { ActionContext } from "vuex";
import { LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "./consts";
import { ILabelData, ILabelPrintState } from "./interfaces";

const inMemoryState = {};

const persistedState = {
  labelDataList: [],
};

const defaultState: ILabelPrintState = {
  ...inMemoryState,
  ...persistedState,
};

export const labelPrintModule = {
  state: () => defaultState,
  mutations: {
    [LabelPrintMutations.LABEL_PRINT_MUTATION](
      state: ILabelPrintState,
      data: Partial<ILabelPrintState>
    ) {
      (Object.keys(data) as Array<keyof ILabelPrintState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [LabelPrintGetters.TOTAL_LABELS]: (
      state: ILabelPrintState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => state.labelDataList.map((x) => x.count).reduce((a, b) => a + b, 0),
  },
  actions: {
    [LabelPrintActions.UPDATE_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {
        labelDataList,
      }: {
        labelDataList: ILabelData[];
      }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, { labelDataList });
    },
    [LabelPrintActions.GENERATE_LABEL_FIELDS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {} = {}
    ) => {
      let plantBatches: IIndexedPlantBatchData[] = [];
      let packages: IIndexedPackageData[] = [];

      try {
        plantBatches = await primaryDataLoader.plantBatches();
      } catch (error) {
        console.error("Error loading plant batches:", error);
      }

      try {
        const activePackages = await primaryDataLoader.activePackages();
        const inTransitPackages = await primaryDataLoader.inTransitPackages();
        packages = [...activePackages, ...inTransitPackages];
      } catch (error) {
        console.error("Error loading packages:", error);
      }

      const labelDataList: ILabelData[] = ctx.state.labelDataList;

      for (const labelData of labelDataList) {
        const matchedPackage = packages.find((x) => x.Label === labelData.primaryValue);
        if (matchedPackage) {
          labelData.secondaryValue = matchedPackage.Item.Name;
          continue;
        }

        const matchedPlantBatch = plantBatches.find((x) => x.Name);
        if (matchedPlantBatch) {
          labelData.secondaryValue = matchedPlantBatch.StrainName;
          continue;
        }
      }

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, { labelDataList });
    },
    [LabelPrintActions.PUSH_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {
        labelDataList,
      }: {
        labelDataList: ILabelData[];
      }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: [...ctx.state.labelDataList, ...labelDataList],
      });
    },
    [LabelPrintActions.REMOVE_LABEL]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      { labelValue }: { labelValue: string }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: ctx.state.labelDataList.filter((x) => x.primaryValue !== labelValue),
      });
    },
    [LabelPrintActions.RESET_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      actionData: any = {}
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: [],
      });
    },
    [LabelPrintActions.PRINT_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {
        labelDataList,
        templateId,
        download,
      }: { labelDataList: ILabelData[]; templateId: string; download: boolean }
    ) => {
      t3RequestManager.generateLabelPdf({
        labelDataList,
        templateId,
        download,
      });
    },
  },
};

export const labelPrintReducer = (state: ILabelPrintState): ILabelPrintState => ({
  ...state,
  ...inMemoryState,
});
