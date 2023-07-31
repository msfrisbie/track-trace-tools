import { IAtomicService, IAuthState } from "@/interfaces";
import { buildBody } from "@/utils/data-loader";
import { todayIsodate } from "@/utils/date";
import { debugLogFactory } from "@/utils/debug";
import { timer } from "rxjs";
import { take } from "rxjs/operators";
import { authManager } from "./auth-manager.module";
import { DataLoader } from "./data-loader/data-loader.module";
import { facilityManager } from "./facility-manager.module";
import { primaryMetrcRequestManager } from "./metrc-request-manager.module";
import { upsertManager } from "./upsert-manager.module";

const debugLog = debugLogFactory("telemetry-manager.module.ts");

const HEALTHY_RESPONSE_CODES = [200];

class TelemetryManager implements IAtomicService {
  async init() {
    // this.startTelemetryCollection();
  }

  async startTelemetryCollection() {
    // Wait 20s to gather telemetry
    // Send every 4 minutes for 20 minutes
    //
    // This is important, as stale sessions can start sending weird telemetry
    timer(20000, 4 * 60 * 1000)
      .pipe(take(5))
      .subscribe(async () => {
        if (!(await authManager.authStateOrNull())) {
          console.log("No auth state, exiting");
          return;
        }

        await this.sendTestRequests();

        // Wait until telemetry is finished collecting to get facility metadata
        this.maybeCollectAndSendFacilityMetadata();
      });
  }

  async sendTestRequests() {
    await authManager.authStateOrError();

    const payload = buildBody({ page: 0, pageSize: 20 });

    // TODO telemetry when not logged in

    const t0_flowering: number = performance.now();
    primaryMetrcRequestManager
      .getFloweringPlants(
        payload
        // , { retries: 0 }
      )
      .then(
        async (response) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_flowering, true, response.status);
        },
        (error) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_flowering, false, undefined, error);
        }
      );

    await timer(3000).toPromise();

    const t0_packages: number = performance.now();
    primaryMetrcRequestManager
      .getActivePackages(
        payload
        //, { retries: 0 }
      )
      .then(
        (response) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_packages, true, response.status);
        },
        (error) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_packages, false, undefined, error);
        }
      );

    await timer(3000).toPromise();

    const t0_transfers: number = performance.now();
    primaryMetrcRequestManager
      .getIncomingTransfers(
        payload
        // { retries: 0 }
      )
      .then(
        (response) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_transfers, true, response.status);
        },
        (error) => {
          this.sendTelemetryAndUpdateMetrcStatus(t0_transfers, false, undefined, error);
        }
      );
  }

  async maybeCollectAndSendFacilityMetadata() {
    const key: string = `facilitymetadata-${todayIsodate()}`;
    const sendIntervalMs: number = 12 * 60 * 60 * 1000; // Twice per day;

    const authState = await authManager.authStateOrError();

    const facilities = await facilityManager.ownedFacilitiesOrError();

    for (let facility of facilities) {
      debugLog(async () => ["Evaluating", facility.licenseNumber]);
      const spoofedAuthState: IAuthState = {
        ...authState,
        license: facility.licenseNumber,
      };

      const scopedDataLoader = new DataLoader();
      await scopedDataLoader.init(spoofedAuthState);

      if (
        !(await upsertManager.willSendKeyval({
          key,
          sendIntervalMs,
          authState: spoofedAuthState,
        }))
      ) {
        debugLog(async () => ["Keyval will not send, skipping data collection"]);
        continue;
      }

      let data = {};

      const availableTags: number | null = await scopedDataLoader.availableTagCount();

      if (availableTags !== null) {
        data = {
          ...data,
          availableTags,
        };
      }

      const usedTags: number | null = await scopedDataLoader.usedTagCount();

      if (usedTags !== null) {
        data = {
          ...data,
          usedTags,
        };
      }

      const voidedTags: number | null = await scopedDataLoader.voidedTagCount();

      if (voidedTags !== null) {
        data = {
          ...data,
          voidedTags,
        };
      }

      const activePackages: number | null = await scopedDataLoader.activePackageCount();

      if (activePackages !== null) {
        data = {
          ...data,
          activePackages,
        };
      }

      const inactivePackages: number | null = await scopedDataLoader.inactivePackageCount();

      if (inactivePackages !== null) {
        data = {
          ...data,
          inactivePackages,
        };
      }

      const incomingTransfers: number | null = await scopedDataLoader.incomingTransferCount();

      if (incomingTransfers !== null) {
        data = {
          ...data,
          incomingTransfers,
        };
      }

      const outgoingTransfers: number | null = await scopedDataLoader.outgoingTransferCount();

      if (outgoingTransfers !== null) {
        data = {
          ...data,
          outgoingTransfers,
        };
      }

      const rejectedTransfers: number | null = await scopedDataLoader.rejectedTransferCount();

      if (rejectedTransfers !== null) {
        data = {
          ...data,
          rejectedTransfers,
        };
      }

      const items: number | null = await scopedDataLoader.itemCount();

      if (items !== null) {
        data = {
          ...data,
          items,
        };
      }

      const locations: number | null = await scopedDataLoader.locationCount();

      if (locations !== null) {
        data = {
          ...data,
          locations,
        };
      }

      const strains: number | null = await scopedDataLoader.strainCount();

      if (strains !== null) {
        data = {
          ...data,
          strains,
        };
      }

      const activePlantBatches: number | null = await scopedDataLoader.activePlantBatchCount();

      if (activePlantBatches !== null) {
        data = {
          ...data,
          activePlantBatches,
        };
      }

      const inactivePlantBatches: number | null = await scopedDataLoader.inactivePlantBatchCount();

      if (inactivePlantBatches !== null) {
        data = {
          ...data,
          inactivePlantBatches,
        };
      }

      const vegetativePlants: number | null = await scopedDataLoader.vegetativePlantCount();

      if (vegetativePlants !== null) {
        data = {
          ...data,
          vegetativePlants,
        };
      }

      const floweringPlants: number | null = await scopedDataLoader.floweringPlantCount();

      if (floweringPlants !== null) {
        data = {
          ...data,
          floweringPlants,
        };
      }

      const activeHarvests: number | null = await scopedDataLoader.activeHarvestCount();

      if (activeHarvests !== null) {
        data = {
          ...data,
          activeHarvests,
        };
      }

      const inactiveHarvests: number | null = await scopedDataLoader.inactiveHarvestCount();

      if (inactiveHarvests !== null) {
        data = {
          ...data,
          inactiveHarvests,
        };
      }

      const activeSales: number | null = await scopedDataLoader.activeSalesCount();

      if (activeSales !== null) {
        data = {
          ...data,
          activeSales,
        };
      }

      const inactiveSales: number | null = await scopedDataLoader.inactiveSalesCount();

      if (inactiveSales !== null) {
        data = {
          ...data,
          inactiveSales,
        };
      }

      if (Object.keys(data).length > 0) {
        upsertManager.maybeSendKeyval({
          key,
          category: "FACILITY_METADATA",
          dataType: "json",
          data,
          authState: spoofedAuthState,
          sendIntervalMs,
        });
      } else {
        debugLog(async () => ["Empty metadata object"]);
      }

      // Wait 15 seconds in between request batches
      await timer(15000).toPromise();
    }
  }

  sendTelemetryAndUpdateMetrcStatus(
    t0: number,
    success: boolean,
    statusCode: number | undefined = undefined,
    errorMessage: string | undefined = undefined
  ) {}
}

export let telemetryManager = new TelemetryManager();
