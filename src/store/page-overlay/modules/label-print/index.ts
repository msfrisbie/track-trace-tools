import { AnalyticsEvent } from "@/consts";
import { ICsvFile, IPluginState, ITestResultBatchData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
import { AxiosResponse } from "axios";
import { ActionContext } from "vuex";
import {
  LabelEndpoint,
  LabelPrintActions,
  LabelPrintGetters,
  LabelPrintMutations,
  LabelPrintStatus,
} from "./consts";
import { ILabelEndpointConfig, ILabelPrintState } from "./interfaces";

const inMemoryState = {
  status: LabelPrintStatus.INITIAL,
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
  barcodeBarThickness: 1.0,
  labelMarginThickness: 1.0,
  debug: false,
  reversePrintOrder: false,
  generateMetadata: false,
  enablePromo: false,
  rotate: false,
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
    ) =>
      state.labelContentLayoutOptions.find(
        (x) => x.labelContentLayoutId === state.selectedContentLayoutId
      ),
    [LabelPrintGetters.SELECTED_LABEL_TEMPLATE_LAYOUT]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) =>
      state.labelTemplateLayoutOptions.find(
        (x) => x.labelTemplateLayoutId === state.selectedTemplateLayoutId
      ),
    [LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) =>
      getters[
        LabelPrintGetters.SELECTED_LABEL_CONTENT_LAYOUT
      ]?.labelContentLayoutConfig.labelContentLayoutElements.filter(
        (x: any) => !!x.labelContentDataKey
      ).length === 0,
    [LabelPrintGetters.IS_DEMO]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) => state.selectedLabelEndpoint === LabelEndpoint.DEMO_PACKAGES,
    [LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): ILabelEndpointConfig[] => [
      {
        id: LabelEndpoint.DEMO_PACKAGES,
        description: "Demo labels",
      },
      {
        id: LabelEndpoint.ACTIVE_PACKAGES,
        description: "Autogenerate labels for active packages",
      },
      {
        id: LabelEndpoint.INTRANSIT_PACKAGES,
        description: "Autogenerate labels for outgoing transfer packages",
      },
      {
        id: LabelEndpoint.RAW_LABEL_GENERATOR,
        description: "Use label CSV",
      },
    ],
    [LabelPrintGetters.ENABLE_GENERATION]: (
      state: ILabelPrintState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ): boolean => {
      if (state.status === LabelPrintStatus.INFLIGHT) {
        return false;
      }

      if (!state.selectedContentLayoutId) {
        return false;
      }

      if (!state.selectedLabelEndpoint) {
        return false;
      }

      if (!state.selectedTemplateLayoutId) {
        return false;
      }

      if (getters[LabelPrintGetters.IS_DEMO]) {
        return true;
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
        filename: `${selectedLayout.labelContentLayoutId}.csv`,
        data: [
          selectedLayout.labelContentLayoutConfig.labelContentLayoutElements.map(
            (x: any) => x.labelContentDataKey
          ),
        ],
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
        .data;
      const labelContentLayoutOptions = (await t3RequestManager.getLabelContentLayouts()).data.data;

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelTemplateLayoutOptions,
        labelContentLayoutOptions,
      });
    },
    [LabelPrintActions.DOWNLOAD_PDF]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {}: {}
    ) => {
      analyticsManager.track(AnalyticsEvent.LABEL_GENERATOR_DOWNLOAD_PDF);

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
      const renderingOptions = {
        barcodeBarThickness: ctx.state.barcodeBarThickness,
        labelMarginThickness: ctx.state.labelMarginThickness,
        debug: ctx.state.debug,
        enablePromo: ctx.state.enablePromo,
        reversePrintOrder: ctx.state.reversePrintOrder,
        rotationDegrees: ctx.state.rotate ? 90 : 0
      };

      analyticsManager.track(AnalyticsEvent.LABEL_GENERATOR_GENERATE_LABELS, {
        selectedLabelEndpoint: ctx.state.selectedLabelEndpoint,
        labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId,
        labelContentLayoutId: ctx.state.selectedContentLayoutId,
        renderingOptions
      });

      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelPdfBlobUrl: null,
        labelPdfFilename: null,
        errorText: null,
        status: LabelPrintStatus.INFLIGHT,
      });

      let response: AxiosResponse;
      let labelPdfBlobUrl: string | null = null;
      let labelPdfFilename: string | null = null;
      let errorText: string | null = null;

      const labelData = ctx.getters[LabelPrintGetters.PARSED_TAG_LIST];

      const csvData = ctx.getters[LabelPrintGetters.PARSED_CSV_DATA];

      let labelContentData: { [key: string]: string }[] | null = null;

      try {
        if (ctx.getters[LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC]) {
          labelContentData = Array(ctx.state.labelsPerTag).fill({});
        } else {
          switch (ctx.state.selectedLabelEndpoint) {
            case LabelEndpoint.ACTIVE_PACKAGES:
              if (ctx.state.generateMetadata) {
                const packageIds = (await primaryDataLoader.activePackages()).filter((x) => labelData.includes(x.Label)).map((x) => x.Id);

                const promises: Promise<any>[] = [];

                const richBatches: {packageId: number, testResultBatch: ITestResultBatchData}[] = [];

                for (const packageId of packageIds) {
                  promises.push(
                    primaryDataLoader.testResultBatchesByPackageId(packageId).then((testResultBatches) => {
                      richBatches.push(...testResultBatches.map((testResultBatch) => ({ packageId, testResultBatch })));
                    })
                  );

                  if (promises.length % 100) {
                    await Promise.allSettled(promises);
                  }
                }

                await Promise.allSettled(promises);

                // file ID -> package ID
                const labResultPairs:Map<number, number> = new Map();

                for (const { packageId, testResultBatch } of richBatches) {
                  for (const testResult of testResultBatch.Tests) {
                    // If PDF is missing, nothing to be done
                    if (!testResult.LabTestResultDocumentFileId) {
                      continue;
                    }

                    if (!labResultPairs.has(testResult.LabTestResultDocumentFileId)) {
                      labResultPairs.set(testResult.LabTestResultDocumentFileId, packageId);
                    }
                  }
                }

                const metadataPromises: Promise<any>[] = [];

                for (const [labTestResultDocumentFileId, packageId] of labResultPairs) {
                  metadataPromises.push(t3RequestManager.t3LabResultMetadata(packageId, labTestResultDocumentFileId));
                }

                await Promise.allSettled(metadataPromises);
              }

              const activePackageLabelContentDataResponse =
                await t3RequestManager.generateActivePackageLabelContentData({
                  labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                  labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                  data: labelData,
                });

              labelContentData = activePackageLabelContentDataResponse.data.labelContentData;
              break;
            case LabelEndpoint.INTRANSIT_PACKAGES:
              const intransitPackageLabelContentDataResponse =
                await t3RequestManager.generateInTransitPackageLabelContentData({
                  labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                  labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                  data: labelData,
                });

              labelContentData = intransitPackageLabelContentDataResponse.data.labelContentData;
              break;
            case LabelEndpoint.RAW_LABEL_GENERATOR:
              labelContentData = csvData;
              break;
            case LabelEndpoint.DEMO_PACKAGES:
              const demoPackageLabelContentDataResponse =
                await t3RequestManager.generateDemoPackageLabelContentData({
                  labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
                  labelContentLayoutId: ctx.state.selectedContentLayoutId!,
                  data: Array(parseInt(ctx.state.labelsPerTag.toString(), 10)).fill(
                    "DEADBEEFDEADBEEFDEADBEEF"
                  ),
                });

              labelContentData = demoPackageLabelContentDataResponse.data.labelContentData;
              break;
            default:
              throw new Error("Invalid label endpoint");
          }
        }

        if (!labelContentData) {
          throw new Error("Unable to assign labelContentData");
        }

        // if (ctx.state.reversePrintOrder) {
        //   labelContentData.reverse();
        // }

        response = await t3RequestManager.generateLabelPdf({
          labelTemplateLayoutId: ctx.state.selectedTemplateLayoutId!,
          labelContentLayoutId: ctx.state.selectedContentLayoutId!,
          labelContentData,
          renderingOptions
        });

        labelPdfBlobUrl = URL.createObjectURL(response.data);

        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="?([^"]+)"?/);
          if (matches && matches[1]) {
            labelPdfFilename = matches[1];
          }
        }

        ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
          labelPdfBlobUrl,
          labelPdfFilename,
          status: LabelPrintStatus.SUCCESS,
        });
      } catch (err: any) {
        try {
          const errorData = err.response?.data;

          if (errorData instanceof Blob) {
            const errorTextRaw = await errorData.text();
            try {
              errorText = JSON.stringify(JSON.parse(errorTextRaw), null, 2);
            } catch {
              errorText = errorTextRaw; // Not JSON, keep as plain text
            }
          } else {
            errorText = JSON.stringify(errorData, null, 2);
          }
        } catch {
          errorText = err.response?.data?.toString() || err.message || String(err);
        }

        ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
          errorText,
          status: LabelPrintStatus.ERROR,
        });
      }
    },
  },
};

export const labelPrintReducer = (state: ILabelPrintState): ILabelPrintState => ({
  ...state,
  ...inMemoryState,
});
