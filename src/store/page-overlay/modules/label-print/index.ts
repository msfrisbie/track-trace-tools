import { IPluginState } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { AxiosResponse } from "axios";
import { ActionContext } from "vuex";
import { LabelEndpoint, LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "./consts";
import { ILabelEndpointConfig, ILabelPrintState } from "./interfaces";

const inMemoryState = {
  labelPdfBlobUrl: null,
  labelTemplateLayoutOptions: [],
  labelContentLayoutOptions: [],
  selectedTemplateLayout: null,
  selectedContentLayout: null,
  rawTagList: "",
  labelsPerTag: 1,
  selectedLabelEndpoint: LabelEndpoint.ACTIVE_PACKAGES,
};

const persistedState = {};

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
      console.log(JSON.stringify(data));

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
    [LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): ILabelEndpointConfig[] => [
      {
        id: LabelEndpoint.RAW_LABEL_GENERATOR,
        description: "Manually enter label values",
      },
      {
        id: LabelEndpoint.ACTIVE_PACKAGES,
        description: "Autogenerate from active packages",
      },
    ],
    [LabelPrintGetters.TAG_LIST_PARSE_ERRORS]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): string[] => {
      const errors: string[] = [];
      if (state.rawTagList.trim().length === 0) {
        errors.push("Must provide at least one tag");
      }
      return errors;
    },
    [LabelPrintGetters.PARSED_TAG_LIST]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): string[] => state.rawTagList.split(",").map((x: string) => x.trim()),

    // [LabelPrintGetters.ACTIVE_LABELS]: (
    //   state: ILabelPrintState,
    //   getters: any,
    //   rootState: IPluginState,
    //   rootGetters: any
    // ) =>
    //   state.labelDataList.filter(
    //     (x: ILabelData) => x.licenseNumber === rootState.pluginAuth.authState?.license
    //   ),
    // [LabelPrintGetters.TOTAL_LABELS]: (
    //   state: ILabelPrintState,
    //   getters: any,
    //   rootState: any,
    //   rootGetters: any
    // ) =>
    //   getters[LabelPrintGetters.ACTIVE_LABELS]
    //     .map((x: ILabelData) => x.count)
    //     .reduce((a: number, b: number) => a + b, 0),
  },
  actions: {
    [LabelPrintActions.UPDATE_LAYOUT_OPTIONS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {}: {}
    ) => {
      const labelTemplateLayoutOptions = (await t3RequestManager.getLabelTemplateLayouts()).data
        .labelTemplateLayouts;
      const labelContentLayoutOptions = (await t3RequestManager.getLabelContentLayouts()).data
        .labelContentLayouts;

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelTemplateLayoutOptions,
        labelContentLayoutOptions,
      });
    },
    [LabelPrintActions.GENERATE_LABEL_PDF]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {}: {}
    ) => {
      let response: AxiosResponse;

      switch (ctx.state.selectedLabelEndpoint) {
        case LabelEndpoint.ACTIVE_PACKAGES:
          response = await t3RequestManager.generateActivePackageLabelPdf({
            labelTemplateLayoutId: ctx.state.selectedTemplateLayout!.id,
            labelContentLayoutId: ctx.state.selectedContentLayout!.id,
            data: ctx.getters[LabelPrintGetters.PARSED_TAG_LIST],
          });
          break;
        default:
          throw new Error("Invalid label endpoint");
      }

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelPdfBlobUrl: URL.createObjectURL(response.data),
      });
    },
    // [LabelPrintActions.UPDATE_LABELS]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   {
    //     labelDataList,
    //   }: {
    //     labelDataList: ILabelData[];
    //   }
    // ) => {
    //   ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, { labelDataList });
    // },
    // [LabelPrintActions.GENERATE_LABEL_FIELDS]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   {} = {}
    // ) => {
    //   if (ctx.getters[LabelPrintGetters.TOTAL_LABELS] === 0) {
    //     return;
    //   }

    //   let plantBatches: IIndexedPlantBatchData[] = [];
    //   let packages: IIndexedPackageData[] = [];

    //   try {
    //     plantBatches = await primaryDataLoader.plantBatches();
    //   } catch (error) {
    //     console.error("Error loading plant batches:", error);
    //   }

    //   try {
    //     const activePackages = await primaryDataLoader.activePackages();
    //     const inTransitPackages = await primaryDataLoader.inTransitPackages();
    //     packages = [...activePackages, ...inTransitPackages];
    //   } catch (error) {
    //     console.error("Error loading packages:", error);
    //   }

    //   const labelDataList: ILabelData[] = ctx.state.labelDataList;

    //   for (const labelData of labelDataList) {
    //     const matchedPackage = packages.find((x) => x.Label === labelData.primaryValue);
    //     if (matchedPackage) {
    //       labelData.secondaryValue = `${matchedPackage.Quantity} ${matchedPackage.UnitOfMeasureAbbreviation} ${matchedPackage.Item.Name}`;
    //       continue;
    //     }

    //     const matchedPlantBatch = plantBatches.find((x) => x.Name === labelData.primaryValue);
    //     if (matchedPlantBatch) {
    //       labelData.secondaryValue = matchedPlantBatch.StrainName;
    //       continue;
    //     }
    //   }

    //   ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, { labelDataList });
    // },
    // [LabelPrintActions.PUSH_LABELS]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   {
    //     labelDataList,
    //   }: {
    //     labelDataList: ILabelData[];
    //   }
    // ) => {
    //   const mergedLabels = [...ctx.state.labelDataList, ...labelDataList];

    //   // Use a Set to ensure each primaryValue is unique
    //   const seenValues = new Set();
    //   const uniqueLabels = mergedLabels.filter((label) => {
    //     if (!seenValues.has(label.primaryValue)) {
    //       seenValues.add(label.primaryValue);
    //       return true;
    //     }
    //     return false;
    //   });

    //   uniqueLabels.sort((a, b) => a.primaryValue.localeCompare(b.primaryValue));

    //   ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
    //     labelDataList: uniqueLabels,
    //   });

    //   ctx.dispatch(LabelPrintActions.GENERATE_LABEL_FIELDS);
    // },
    // [LabelPrintActions.REMOVE_LABEL]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   { labelValue }: { labelValue: string }
    // ) => {
    //   ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
    //     labelDataList: ctx.state.labelDataList.filter((x) => x.primaryValue !== labelValue),
    //   });
    // },
    // [LabelPrintActions.RESET_LABELS]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   actionData: any = {}
    // ) => {
    //   ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
    //     labelDataList: ctx.getters[LabelPrintGetters.ACTIVE_LABELS].filter(
    //       (x: ILabelData) => x.licenseNumber !== ctx.rootState.pluginAuth.authState?.license
    //     ),
    //   });
    // },
    // [LabelPrintActions.PRINT_LABELS]: async (
    //   ctx: ActionContext<ILabelPrintState, IPluginState>,
    //   {
    //     labelDataList,
    //     templateId,
    //     layoutId,
    //     download,
    //   }: { labelDataList: ILabelData[]; templateId: string; layoutId: string; download: boolean }
    // ) => {
    //   t3RequestManager.generateLabelPdf({
    //     labelDataList,
    //     templateId,
    //     layoutId,
    //     download,
    //   });
    // },
  },
};

export const labelPrintReducer = (state: ILabelPrintState): ILabelPrintState => ({
  ...state,
  ...inMemoryState,
});
