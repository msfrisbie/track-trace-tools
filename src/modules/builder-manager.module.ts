import { BuilderType, MessageType } from "@/consts";
import {
  IAtomicService,
  ICsvFile,
  IMetrcAdjustPackagePayload,
  IMetrcCreateItemsPayload,
  IMetrcCreatePackagesFromPackagesPayload,
  IMetrcCreatePlantBatchPackagesFromMotherPlantBatchPayload,
  IMetrcCreatePlantBatchPackagesFromMotherPlantPayload,
  IMetrcDestroyPlantsPayload,
  IMetrcFinishPackagesPayload,
  IMetrcHarvestPlantsPayload,
  IMetrcManicurePlantsPayload,
  IMetrcMovePackagesPayload,
  IMetrcMovePlantsPayload,
  IMetrcPromoteImmaturePlantsPayload,
  IMetrcReplacePlantBatchTagsPayload,
  IMetrcReplacePlantTagsPayload,
  IMetrcUnpackImmaturePlantsPayload,
  IMetrcUpdateTransferPayload,
} from "@/interfaces";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import store from "@/store/page-overlay/index";
import { PromoteImmaturePlantsBuilderActions } from "@/store/page-overlay/modules/promote-immature-plants-builder/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { debugLogFactory } from "@/utils/debug";
import _ from "lodash";
import { Subject, timer } from "rxjs";
import { IMetrcCreateTransferPayload } from "../interfaces";
import { TransferBuilderActions } from "../store/page-overlay/modules/transfer-builder/consts";
import { analyticsManager } from "./analytics-manager.module";
import { authManager } from "./auth-manager.module";
import { pageManager } from "./page-manager/page-manager.module";
import { toastManager } from "./toast-manager.module";

enum BuilderSubmitState {
  IDLE,
  SUBMIT_PROJECT_QUEUE,
}

type IEligibleRowType =
  | IMetrcHarvestPlantsPayload
  | IMetrcManicurePlantsPayload
  | IMetrcMovePlantsPayload
  | IMetrcMovePackagesPayload
  | IMetrcDestroyPlantsPayload
  | IMetrcUnpackImmaturePlantsPayload
  | IMetrcPromoteImmaturePlantsPayload
  | IMetrcCreatePackagesFromPackagesPayload
  | IMetrcFinishPackagesPayload
  | IMetrcCreatePlantBatchPackagesFromMotherPlantPayload
  | IMetrcCreatePlantBatchPackagesFromMotherPlantBatchPayload
  | IMetrcCreateTransferPayload
  | IMetrcCreateItemsPayload
  | IMetrcReplacePlantBatchTagsPayload
  | IMetrcReplacePlantTagsPayload
  | IMetrcAdjustPackagePayload
  | IMetrcUpdateTransferPayload;

const debugLog = debugLogFactory("builder-manager.module.ts");

export interface IBuilderProject {
  builderType: BuilderType;
  pendingRows: IEligibleRowType[];
  inflightRows: IEligibleRowType[];
  failedRows: IEligibleRowType[];
  successRows: IEligibleRowType[];
  pageSize: number;
}

const BUILDER_PROJECT_IDB_KEY = "builder_project";

const DEFAULT_SUBMIT_PAGE_SIZE = 10;
const SUBMIT_INTERVAL_DELAY_MS = 0;
const MOCK_PERCENT_FAILURE = 0;

class BuilderManager implements IAtomicService {
  builderSubmitState: BuilderSubmitState = BuilderSubmitState.SUBMIT_PROJECT_QUEUE;

  // TODO move this to Vuex
  activeBuilderProject: IBuilderProject | null = null;
  activeBuilderProjectUpdate: Subject<any> = new Subject<any>();

  async init() {
    await authManager.authStateOrError();

    // This persistence causes problems between tabs/licenses
    // TODO: rethink
    //
    // const persistedProjectData: string | null | undefined = await get(BUILDER_PROJECT_IDB_KEY);

    // if (persistedProjectData) {
    //     this.updateProject(JSON.parse(persistedProjectData));
    // }

    // This might be causing problems with multiple tabs
    // this.submit();
  }

  async updateProject(project: IBuilderProject | null) {
    this.activeBuilderProject = project;
    // await set(BUILDER_PROJECT_IDB_KEY, JSON.stringify(this.activeBuilderProject));
    this.activeBuilderProjectUpdate.next();

    if (
      store.state.settings?.preventActiveProjectPageLeave &&
      project &&
      (project?.pendingRows.length > 0 ||
        project?.inflightRows.length > 0 ||
        project?.failedRows.length > 0)
    ) {
      window.onbeforeunload = function () {
        return "";
      };
    } else {
      window.onbeforeunload = null;
    }
  }

  submitProject(
    rows: IEligibleRowType[],
    builderType: BuilderType,
    summary: Object,
    csvFiles: ICsvFile[],
    pageSize: number = DEFAULT_SUBMIT_PAGE_SIZE
  ): void {
    // Vue might be passing in Observers, collapse them into regular objects
    this.submitProjectImpl(
      _.cloneDeep(rows),
      builderType,
      _.cloneDeep(summary),
      _.cloneDeep(csvFiles),
      pageSize
    );
  }

  private async submitProjectImpl(
    rows: IEligibleRowType[],
    builderType: BuilderType,
    summary: Object,
    csvFiles: ICsvFile[],
    pageSize: number
  ) {
    if (!!this.activeBuilderProject) {
      throw new Error("Cannot overwrite existing project");
    }

    await this.updateProject({
      builderType,
      pageSize,
      pendingRows: rows,
      inflightRows: [],
      failedRows: [],
      successRows: [],
    });

    debugLog(async () => ["Updated project", rows]);

    debugLog(async () => ["Submitting..."]);

    this.submit();

    analyticsManager.track(MessageType.BUILDER_SUBMIT, {
      builderType,
      summary,
    });
  }

  async retryFailedRows() {
    if (!this.activeBuilderProject) {
      throw new Error("Project missing");
    }

    this.activeBuilderProject.pendingRows.push(
      ...this.activeBuilderProject.failedRows.splice(0, this.activeBuilderProject.failedRows.length)
    );
    this.updateProject(this.activeBuilderProject);

    this.submit();
  }

  destroyProject() {
    this.pause();

    // TODO check that the project is complete
    if (
      this.activeBuilderProject?.failedRows.length === 0 &&
      this.activeBuilderProject?.inflightRows.length === 0 &&
      this.activeBuilderProject?.pendingRows.length === 0
    ) {
      analyticsManager.track(MessageType.BUILDER_PROJECT_FINISHED);

      switch (this.activeBuilderProject?.builderType) {
        case BuilderType.CREATE_TRANSFER:
          store.dispatch(`transferBuilder/${TransferBuilderActions.RESET_TRANSFER_DATA}`);
          break;
        case BuilderType.PROMOTE_IMMATURE_PLANTS:
          store.dispatch(
            `promoteImmaturePlantsBuilder/${PromoteImmaturePlantsBuilderActions.RESET_PROMOTE_IMMATURE_PLANTS_DATA}`
          );
          break;
        case BuilderType.SPLIT_PACKAGE:
          store.dispatch(
            `splitPackageBuilder/${SplitPackageBuilderActions.RESET_SPLIT_PACKAGE_DATA}`
          );
          break;
        default:
          break;
      }
    } else {
      analyticsManager.track(MessageType.BUILDER_PROJECT_CANCELLED);
    }

    this.updateProject(null);

    pageManager.clickRefreshLinks();
  }

  pause() {
    this.builderSubmitState = BuilderSubmitState.IDLE;
  }

  async submit() {
    if (!this.activeBuilderProject) {
      this.pause();
      return;
    }

    if (this.activeBuilderProject?.inflightRows.length > 0) {
      throw new Error("Project has inflight rows");
    }

    this.activeBuilderProject.inflightRows = this.activeBuilderProject.pendingRows.splice(
      0,
      this.activeBuilderProject.pageSize
    );

    if (this.activeBuilderProject.inflightRows.length === 0) {
      this.pause();
      return;
    }

    debugLog(async () => [`Submitting ${this.activeBuilderProject?.inflightRows.length} rows...`]);

    let success = false;
    let error = null;

    try {
      const response = await this.submitRows(
        this.activeBuilderProject.inflightRows,
        this.activeBuilderProject.builderType
      );
      success = response.status === 200;
      if (!success && response instanceof Response) {
        response.text().then(
          (data) => {
            if (!data.length) {
              return;
            }
            let errorMessage = data;
            try {
              errorMessage = JSON.parse(data)["Message"] ?? data;
            } catch {}
            toastManager.openToast(errorMessage, {
              title: "T3 Submit Error",
              autoHideDelay: 30000,
              variant: "danger",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            });
          },
          () => {}
        );
      }
    } catch (e) {
      console.error(`Builder submit error`, e);
      error = e;
    }

    // Project may have been cancelled during await
    if (!this.activeBuilderProject) {
      this.pause();
      return;
    }

    if (success) {
      this.activeBuilderProject.successRows.push(...this.activeBuilderProject.inflightRows);
      debugLog(async () => [
        `Successfully submitted ${this.activeBuilderProject?.inflightRows.length} rows`,
      ]);

      analyticsManager.track(MessageType.BUILDER_BATCH_ACCEPTED, {
        builderType: this.activeBuilderProject.builderType,
        rows: this.activeBuilderProject.inflightRows.length,
      });
    } else {
      this.activeBuilderProject.failedRows.push(...this.activeBuilderProject.inflightRows);
      console.error(`Failed to submit ${this.activeBuilderProject.inflightRows.length} rows`);

      analyticsManager.track(MessageType.BUILDER_BATCH_FAILED, {
        builderType: this.activeBuilderProject.builderType,
        rows: this.activeBuilderProject.inflightRows.length,
        error,
      });
    }

    this.activeBuilderProject.inflightRows = [];

    // Write updated project to disk
    this.updateProject(this.activeBuilderProject);

    // 100ms breathing room between recursive calls
    timer(100).subscribe(() => this.submit());
  }

  async submitRows(rows: IEligibleRowType[], builderType: BuilderType) {
    let response = null;

    if (SUBMIT_INTERVAL_DELAY_MS > 0) {
      await timer(SUBMIT_INTERVAL_DELAY_MS).toPromise();
    }

    if (MOCK_PERCENT_FAILURE > 0) {
      if (Math.random() < MOCK_PERCENT_FAILURE) {
        return { status: 500 };
      }
    }

    switch (builderType) {
      case BuilderType.MOVE_PLANTS:
        response = await primaryMetrcRequestManager.movePlants(JSON.stringify(rows));
        break;
      case BuilderType.MOVE_PACKAGES:
        response = await primaryMetrcRequestManager.movePackages(JSON.stringify(rows));
        break;
      case BuilderType.HARVEST_PLANTS:
        response = await primaryMetrcRequestManager.harvestPlants(JSON.stringify(rows));
        break;
      case BuilderType.MANICURE_PLANTS:
        response = await primaryMetrcRequestManager.manicurePlants(JSON.stringify(rows));
        break;
      case BuilderType.DESTROY_PLANTS:
        response = await primaryMetrcRequestManager.destroyPlants(JSON.stringify(rows));
        break;
      case BuilderType.UNPACK_IMMATURE_PLANTS:
        response = await primaryMetrcRequestManager.unpackImmaturePlants(JSON.stringify(rows));
        break;
      case BuilderType.PACK_IMMATURE_PLANTS:
        response = await primaryMetrcRequestManager.packImmaturePlants(JSON.stringify(rows));
        break;
      case BuilderType.PROMOTE_IMMATURE_PLANTS:
        response = await primaryMetrcRequestManager.promoteImmaturePlants(JSON.stringify(rows));
        break;
      case BuilderType.MERGE_PACKAGES:
      case BuilderType.SPLIT_PACKAGE:
        response = await primaryMetrcRequestManager.createPackages(JSON.stringify(rows));
        break;
      case BuilderType.FINISH_PACKAGES:
        response = await primaryMetrcRequestManager.finishPackages(JSON.stringify(rows));
        break;
      case BuilderType.ADJUST_PACKAGE:
        response = await primaryMetrcRequestManager.adjustPackages(JSON.stringify(rows));
        break;
      case BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT:
        response = await primaryMetrcRequestManager.immaturePlantPackagesFromMotherPlant(
          JSON.stringify(rows)
        );
        break;
      case BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH:
        response = await primaryMetrcRequestManager.immaturePlantPackagesFromMotherPlantBatch(
          JSON.stringify(rows)
        );
        break;
      case BuilderType.CREATE_TRANSFER:
        response = await primaryMetrcRequestManager.createTransfers(JSON.stringify(rows));
        break;
      case BuilderType.UPDATE_TRANSFER:
        response = await primaryMetrcRequestManager.updateTransfers(JSON.stringify(rows));
        break;
      case BuilderType.CREATE_ITEMS:
        response = await primaryMetrcRequestManager.createItems(JSON.stringify(rows));
        break;
      case BuilderType.REPLACE_PLANT_TAGS:
        response = await primaryMetrcRequestManager.replacePlantTags(JSON.stringify(rows));
        break;
      case BuilderType.REPLACE_PLANT_BATCH_TAGS:
        response = await primaryMetrcRequestManager.replacePlantBatchTags(JSON.stringify(rows));
        break;
      default:
        throw new Error("Bad builder type: " + builderType);
    }

    if (!response) {
      throw new Error("Missing response");
    }

    return response;
  }
}

export let builderManager = new BuilderManager();
