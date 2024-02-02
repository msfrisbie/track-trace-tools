import { BuilderType, MessageType } from "@/consts";
import { IIndexedPackageData, IMetrcAssignCoaPayload, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { isDevelopment } from "@/modules/environment.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { readCsvFile } from "@/utils/file";
import _ from "lodash-es";
import { ActionContext } from "vuex";
import { LabCsvActions, LabCsvGetters, LabCsvMutations, LabCsvStatus } from "./consts";
import { ILabCsvState, IRichPackageLabData } from "./interfaces";

const inMemoryState = {
  status: LabCsvStatus.INITIAL,
  statusMessages: [],
  csvData: [],
  files: [],
  packages: [],
};

const persistedState = {};

const defaultState: ILabCsvState = {
  ...inMemoryState,
  ...persistedState,
};

export const labCsvModule = {
  state: () => defaultState,
  mutations: {
    [LabCsvMutations.LAB_CSV_MUTATION](state: ILabCsvState, data: Partial<ILabCsvState>) {
      (Object.keys(data) as Array<keyof ILabCsvState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
    [LabCsvMutations.RECORD_MESSAGE](
      state: ILabCsvState,
      statusMessage: { text: string; variant: string }
    ) {
      state.statusMessages = [...state.statusMessages, statusMessage];
    },
    [LabCsvMutations.SET_METRC_FILE_ID](
      state: ILabCsvState,
      data: { filename: string; metrcFileId: string }
    ) {
      for (const file of state.files) {
        if (file.filename === data.filename) {
          file.metrcFileId = data.metrcFileId;
          return;
        }
      }

      throw new Error(`No file update performed, could not match ${data.filename}`);
    },
  },
  getters: {
    [LabCsvGetters.HAS_ERRORS]: (
      state: ILabCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => state.statusMessages.filter((x) => x.variant === "danger").length > 0,
    [LabCsvGetters.RICH_PACKAGE_LAB_DATA]: (
      state: ILabCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) =>
      state.csvData.map(([sampleId, packageLabel, filename]) => ({
        packageLabel,
        pkg: state.packages.find((x) => x.Label === packageLabel) ?? null,
        filename,
        file: state.files.find((x) => x.filename === filename) ?? null,
      })) as IRichPackageLabData[],
    [LabCsvGetters.SHOW_OUTPUT_TABLE]: (
      state: ILabCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => ![LabCsvStatus.INITIAL, LabCsvStatus.INFLIGHT].includes(state.status),
  },
  actions: {
    [LabCsvActions.LAB_CSV_ACTION]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: string[][]
    ) => {
      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, data);
    },
    [LabCsvActions.LOAD_CSV]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: { file: File }
    ) => {
      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.ASSIGN_LAB_COA,
        action: "Begin load CSV",
      });

      const csvData = (await readCsvFile(data.file)).filter((x) => x.some((y) => y.length > 0));

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        status: LabCsvStatus.INFLIGHT,
        csvData,
        statusMessages: [{ text: "Loading package data...", variant: "primary" }],
      });

      const packages = await primaryDataLoader.activePackages();
      const filteredPackages: IIndexedPackageData[] = [];

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, { statusMessages: [] });

      // Check CSV is well formed

      if (csvData.length === 0) {
        ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
          text: "CSV has zero rows",
          variant: "danger",
        });
      }

      for (const [idx, [sampleId, packageLabel, coaFilename]] of csvData.entries()) {
        const pkg = packages.find((x) => x.Label === packageLabel);

        let rowIdentifier = `Row ${idx + 1}`;
        if (sampleId) {
          rowIdentifier += ` / ${sampleId}`;
        }

        if (!pkg) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `[${rowIdentifier}]: unable to match "${packageLabel}" to active package`,
            variant: "danger",
          });
        } else {
          filteredPackages.push(pkg);
        }

        if (!coaFilename) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `[${rowIdentifier}]: missing COA PDF file name`,
            variant: "danger",
          });
        }
      }

      const promises: Promise<any>[] = [];

      for (const pkg of filteredPackages) {
        promises.push(
          primaryDataLoader.testResultsByPackageId(pkg.Id).then((testResults) => {
            pkg.testResults = testResults;
          })
        );

        if (promises.length % 100) {
          await Promise.allSettled(promises);
        }
      }

      await Promise.allSettled(promises);

      // Check that all packages have at least one test result

      for (const pkg of filteredPackages) {
        if (!pkg.testResults || pkg.testResults.length === 0) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `Package ${pkg.Label} does not have any test results`,
            variant: "danger",
          });
        }

        if (
          pkg.testResults &&
          pkg.testResults.length > 0 &&
          pkg.testResults.find((x) => typeof x.LabTestResultDocumentFileId === "number")
        ) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `Package ${pkg.Label} appears to already have a COA attached`,
            variant: "warning",
          });
        }
      }

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        packages: filteredPackages,
      });

      if (ctx.getters[LabCsvGetters.HAS_ERRORS]) {
        ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
          status: LabCsvStatus.UPLOADED_CSV,
          messages: [
            {
              text: `Invalid CSV. Fix the issues and re-upload to continue.`,
              variant: "danger",
            },
          ],
        });
      } else {
        const uniqueExpectedFilesnames = new Set(
          ctx.getters[LabCsvGetters.RICH_PACKAGE_LAB_DATA].map(
            (x: IRichPackageLabData) => x.filename
          )
        );

        ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
          status: LabCsvStatus.UPLOADED_CSV,
          messages: [
            {
              text: `Valid CSV uploaded. Upload the ${uniqueExpectedFilesnames.size} matching COA PDFs to continue.`,
              variant: "primary",
            },
          ],
        });
      }
    },
    [LabCsvActions.RESET]: async (ctx: ActionContext<ILabCsvState, IPluginState>, data: any) => {
      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, defaultState);
    },
    [LabCsvActions.SELECT_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: { files: File[] }
    ) => {
      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.ASSIGN_LAB_COA,
        action: "Select COA files",
      });

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        status: LabCsvStatus.INFLIGHT,
        statusMessages: [{ text: "Loading package data...", variant: "primary" }],
      });

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        files: data.files.map((file) => ({
          file,
          filename: file.name,
          metrcFileId: null,
        })),
      } as Partial<ILabCsvState>);

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, { statusMessages: [] });

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        status: LabCsvStatus.SELECTED_COAS,
        statusMessages: [{ text: `${ctx.state.files.length} COAs selected`, variant: "primary" }],
      });

      const richData: IRichPackageLabData[] = ctx.getters[LabCsvGetters.RICH_PACKAGE_LAB_DATA];

      for (const richPackageLabData of richData) {
        if (!richPackageLabData.file) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `Package ${richPackageLabData.packageLabel} expects COA ${richPackageLabData.filename}, but this file was not selected`,
            variant: "danger",
          });
        }
      }

      const expectedFilenames = richData.map((x) => x.filename);

      for (const filedata of ctx.state.files) {
        if (!expectedFilenames.includes(filedata.filename)) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `COA PDF ${filedata.filename} was selected, but this does not match any row in the CSV`,
            variant: "warning",
          });
        }
      }
    },
    [LabCsvActions.UPLOAD_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: any
    ) => {
      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.ASSIGN_LAB_COA,
        action: "Upload COA files",
      });

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        // status: LabCsvStatus.INFLIGHT,
        statusMessages: [{ text: "Uploading COA PDFs...", variant: "primary" }],
      });

      for (const filedata of ctx.state.files) {
        const formData = new FormData();

        formData.append("uploadFiles-0", filedata.file);

        try {
          const response = await primaryMetrcRequestManager.uploadLabDocument(formData);

          if (response.status !== 200) {
            ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
              text: `Failed to upload ${filedata.filename}`,
              variant: "danger",
            });
          } else {
            ctx.commit(LabCsvMutations.SET_METRC_FILE_ID, {
              filename: filedata.filename,
              metrcFileId: isDevelopment() ? Math.random().toString() : response.data,
            });
          }
        } catch (e) {
          ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
            text: `Failed to upload files, try again - (${(e as Error).toString()})`,
            variant: "warning",
          });
          ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
            status: LabCsvStatus.SELECTED_COAS,
          });
          return;
        }
      }

      if (!ctx.getters[LabCsvGetters.HAS_ERRORS]) {
        ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
          status: LabCsvStatus.UPLOADED_COAS,
          statusMessages: [
            { text: "COA PDFs successfully uploaded, ready to submit", variant: "primary" },
          ],
        });
      }
    },
    [LabCsvActions.ASSIGN_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: any
    ) => {
      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.ASSIGN_LAB_COA,
        action: "Assign COA files",
      });

      const richDataList: IRichPackageLabData[] = ctx.getters[LabCsvGetters.RICH_PACKAGE_LAB_DATA];

      const rows: IMetrcAssignCoaPayload[] = [];

      for (const richData of richDataList) {
        console.log(richData);

        const uniqueLabTestResultIds: string[] = [
          ...new Set(richData.pkg!.testResults?.map((x) => x.LabTestResultId.toString())),
        ];

        for (const uniqueLabTestResultId of uniqueLabTestResultIds) {
          rows.push({
            LabTestResultDocumentId: richData.file!.metrcFileId!.toString(),
            Id: uniqueLabTestResultId,
          });
        }
      }

      builderManager.submitProject(
        _.cloneDeep(rows),
        BuilderType.ASSIGN_LAB_COA,
        {
          labTestCount: rows.length,
          coaCount: richDataList.length,
        },
        [],
        1
      );

      ctx.dispatch(LabCsvActions.RESET);
    },
  },
};

export const labCsvReducer = (state: ILabCsvState): ILabCsvState => ({
  ...state,
  ...inMemoryState,
});
