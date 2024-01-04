import { IIndexedPackageData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { readCsvFile } from "@/utils/file";
import { ActionContext } from "vuex";
import { LabCsvActions, LabCsvGetters, LabCsvMutations, LabCsvStatus } from "./consts";
import { ILabCsvState } from "./interfaces";

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
      state.statusMessages = [statusMessage, ...state.statusMessages];
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
        pkg: state.packages.find((x) => x.Label === packageLabel),
        filename,
        file: state.files.find((x) => x.filename === filename),
      })),
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
            text: `[${rowIdentifier}]: missing COA filename`,
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

        if (pkg.testResults && pkg.testResults.length > 0) {
          // ctx.commit(LabCsvMutations.RECORD_MESSAGE, {
          //   text: `Package ${pkg.Label} does not have any test results`,
          //   variant: "danger",
          // });
          // TODO check that test results do not have existing PDFs, add warning
        }
      }

      // TODO check for duplicates

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        packages: filteredPackages,
      });

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        status: LabCsvStatus.UPLOADED_CSV,
      });
    },
    [LabCsvActions.RESET]: async (ctx: ActionContext<ILabCsvState, IPluginState>, data: any) => {
      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, defaultState);
    },
    [LabCsvActions.SELECT_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: { files: File[] }
    ) => {
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

      // TODO validate filenames against expected filenames

      ctx.commit(LabCsvMutations.LAB_CSV_MUTATION, {
        status: LabCsvStatus.UPLOADED_COAS,
        statusMessages: [{ text: `${ctx.state.files.length} COAs selected`, variant: "primary" }],
      });
    },
    [LabCsvActions.UPLOAD_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: any
    ) => {},
    [LabCsvActions.ASSIGN_COA_FILES]: async (
      ctx: ActionContext<ILabCsvState, IPluginState>,
      data: { files: File[] }
    ) => {},
  },
};

export const labCsvReducer = (state: ILabCsvState): ILabCsvState => ({
  ...state,
  ...inMemoryState,
});
