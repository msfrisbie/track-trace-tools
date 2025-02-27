import { ICsvFile, IPluginState } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
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
  rawCsvMatrix: null,
  errorText: null,
};

const persistedState = {
  selectedTemplateLayoutId: null,
  selectedContentLayoutId: null,
  labelsPerTag: 1,
  barcodeBarThickness: 0.94,
  labelMarginThickness: 1.0,
  debug: false,
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
    [LabelPrintGetters.SELECTED_LABEL_CONTENT_LAYOUT]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) => state.labelContentLayoutOptions.find((x) => x.id === state.selectedContentLayoutId),
    [LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) =>
      getters[LabelPrintGetters.SELECTED_LABEL_CONTENT_LAYOUT]?.elements.filter(
        (x: any) => !!x.labelContentDataKey
      ).length === 0,
    [LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): ILabelEndpointConfig[] => [
      {
        id: LabelEndpoint.ACTIVE_PACKAGES,
        description: "Autogenerate labels from active packages",
      },
      {
        id: LabelEndpoint.INTRANSIT_PACKAGES,
        description: "Autogenerate labels from in transit packages",
      },
      {
        id: LabelEndpoint.RAW_LABEL_GENERATOR,
        description: "Manually provide label values",
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

      if (!getters[LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC]) {
        switch (state.selectedLabelEndpoint) {
          case LabelEndpoint.ACTIVE_PACKAGES:
          case LabelEndpoint.INTRANSIT_PACKAGES:
            if (getters[LabelPrintGetters.TAG_LIST_PARSE_ERRORS].length > 0) {
              return false;
            }
            break;
          case LabelEndpoint.RAW_LABEL_GENERATOR:
            if (!state.rawCsvMatrix) {
              return false;
            }
            break;
          default:
            return false;
        }
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
        .filter((x) => x !== "")
        .flatMap((x: string) => Array(state.labelsPerTag).fill(x)),
    [LabelPrintGetters.PARSED_CSV_DATA]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): { [key: string]: string }[] => {
      if (!state.rawCsvMatrix) {
        return [];
      }

      const labelCount = state.labelsPerTag;

      return state.rawCsvMatrix!.slice(1).flatMap((row) =>
        Array(labelCount)
          .fill(null)
          .map(() =>
            Object.fromEntries(row.map((cell, index) => [state.rawCsvMatrix![0][index], cell]))
          )
      );
    },
  },
  actions: {
    [LabelPrintActions.DOWNLOAD_CSV_TEMPLATE]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      const selectedLayout = ctx.getters[LabelPrintGetters.SELECTED_LABEL_CONTENT_LAYOUT];

      if (!selectedLayout) {
        throw new Error("No layout config selected");
      }

      const csvFile: ICsvFile = {
        filename: `${selectedLayout.id}.csv`,
        data: [selectedLayout.elements.map((x: any) => x.labelContentDataKey)],
      };

      downloadCsvFile({ csvFile });
    },
    [LabelPrintActions.LOAD_CSV]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      const rawCsvMatrix = await readCsvFile(data.file);

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        rawCsvMatrix,
      });
    },

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

      const labelData = ctx.getters[LabelPrintGetters.PARSED_TAG_LIST];

      const csvData = ctx.getters[LabelPrintGetters.PARSED_CSV_DATA];

      try {
        if (ctx.getters[LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC]) {
          response = await t3RequestManager.generateLabelPdf({
            labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
            labelContentLayoutId: ctx.state.selectedContentLayoutId!,
            labelContentData: Array(ctx.state.labelsPerTag).fill({}),
            renderingOptions: {
              barcodeBarThickness: ctx.state.barcodeBarThickness,
              labelMarginThickness: ctx.state.labelMarginThickness,
            },
            debug: ctx.state.debug,
          });
        } else {
          switch (ctx.state.selectedLabelEndpoint) {
            case LabelEndpoint.ACTIVE_PACKAGES:
              response = await t3RequestManager.generateActivePackageLabelPdf({
                labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                data: labelData,
                renderingOptions: {
                  barcodeBarThickness: ctx.state.barcodeBarThickness,
                  labelMarginThickness: ctx.state.labelMarginThickness,
                },
                debug: ctx.state.debug,
              });
              break;
            case LabelEndpoint.INTRANSIT_PACKAGES:
              response = await t3RequestManager.generateInTransitPackageLabelPdf({
                labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                data: labelData,
                renderingOptions: {
                  barcodeBarThickness: ctx.state.barcodeBarThickness,
                  labelMarginThickness: ctx.state.labelMarginThickness,
                },
                debug: ctx.state.debug,
              });
              break;
            case LabelEndpoint.RAW_LABEL_GENERATOR:
              response = await t3RequestManager.generateLabelPdf({
                labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                labelContentData: csvData,
                renderingOptions: {
                  barcodeBarThickness: ctx.state.barcodeBarThickness,
                  labelMarginThickness: ctx.state.labelMarginThickness,
                },
                debug: ctx.state.debug,
              });
              break;
            default:
              throw new Error("Invalid label endpoint");
          }
        }

        labelPdfBlobUrl = URL.createObjectURL(response.data);

        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="?([^"]+)"?/);
          if (matches && matches[1]) {
            labelPdfFilename = matches[1];
          }
        }
      } catch (err: any) {
        // Axios forces the response to a blob, but this blob contains JSON
        // when an error is returned. Need to conditinally extract the blob,
        // then format to json, and also handle any other network errors.
        try {
          const errorBlob = err.response?.data;
          if (errorBlob instanceof Blob) {
            const errorTextRaw = await errorBlob.text(); // Read the Blob as text
            try {
              errorText = JSON.stringify(JSON.parse(errorTextRaw), null, 2); // Format if it's JSON
            } catch {
              errorText = errorTextRaw; // Otherwise, keep it as plain text
            }
          } else {
            errorText = JSON.stringify(await err.response.json(), null, 2);
          }
        } catch {
          errorText = err.response?.data?.toString() || err?.message || err.toString();
        }
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
