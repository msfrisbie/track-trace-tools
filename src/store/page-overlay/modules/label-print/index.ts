import { IPluginState } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { AxiosResponse } from "axios";
import { ActionContext } from "vuex";
import { LabelEndpoint, LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "./consts";
import { ILabelEndpointConfig, ILabelPrintState } from "./interfaces";

const inMemoryState = {
  labelPdfBlobUrl: null,
  labelPdfFilename: null,
  labelTemplateLayoutOptions: [],
  labelContentLayoutOptions: [],
  rawTagList: "",
  errorText: null,
};

const persistedState = {
  selectedTemplateLayoutId: null,
  selectedContentLayoutId: null,
  labelsPerTag: 1,
  selectedLabelEndpoint: LabelEndpoint.ACTIVE_PACKAGES,
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
    [LabelPrintGetters.ENABLE_GENERATION]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): boolean => {
      if (!state.selectedContentLayoutId) {
        return false;
      }

      if (!state.selectedLabelEndpoint) {
        return false;
      }

      if (!state.selectedTemplateLayoutId) {
        return false;
      }

      if (getters[LabelPrintGetters.TAG_LIST_PARSE_ERRORS].length > 0) {
        return false;
      }

      if (!state.labelsPerTag) {
        return false;
      }

      return true;
    },
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
    ): string[] =>
      state.rawTagList
        .split(/[\n,]+/)
        .map((x: string) => x.trim())
        .filter((x) => x !== ""),
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
    [LabelPrintActions.DOWNLOAD_PDF]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {}: {}
    ) => {
      const link = document.createElement("a");
      link.href = ctx.state.labelPdfBlobUrl!;
      link.setAttribute("download", ctx.state.labelPdfFilename || "t3-labels.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [LabelPrintActions.GENERATE_LABEL_PDF]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {}: {}
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelPdfBlobUrl: null,
        labelPdfFilename: null,
        errorText: null,
      });

      let response: AxiosResponse;
      let labelPdfBlobUrl: string | null = null;
      let labelPdfFilename: string | null = null;
      let errorText: string | null = null;

      switch (ctx.state.selectedLabelEndpoint) {
        case LabelEndpoint.ACTIVE_PACKAGES:
          try {
            const labelData = ctx.getters[LabelPrintGetters.PARSED_TAG_LIST].flatMap((x: string) =>
              Array(parseInt(ctx.state.labelsPerTag.toString(), 10)).fill(x)
            );

            response = await t3RequestManager.generateActivePackageLabelPdf({
              labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
              labelContentLayoutId: ctx.state.selectedContentLayoutId!,
              data: labelData,
            });

            labelPdfBlobUrl = URL.createObjectURL(response.data);

            const contentDisposition = response.headers["content-disposition"];
            if (contentDisposition) {
              const matches = contentDisposition.match(/filename="?([^"]+)"?/);
              if (matches && matches[1]) {
                labelPdfFilename = matches[1];
              }
            }
          } catch (err: any) {
            errorText = await err.response.data.text();
          }

          break;
        default:
          throw new Error("Invalid label endpoint");
      }

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelPdfBlobUrl,
        labelPdfFilename,
        errorText,
      });
    },
  },
};

export const labelPrintReducer = (state: ILabelPrintState): ILabelPrintState => ({
  ...state,
  ...inMemoryState,
});
