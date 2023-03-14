import {
  DATA_LOAD_FETCH_TIMEOUT_MS,
  DATA_LOAD_PAGE_SIZE,
  HarvestState,
  IdbKeyPiece,
  PackageState,
  PlantState,
  TagState,
  TransferState,
} from "@/consts";
import {
  IAtomicService,
  IAuthState,
  ICollectionResponse,
  ICsvUploadResult,
  IDataLoadOptions,
  IDestinationData,
  IExtractedITagOrderData,
  IHarvestData,
  IHarvestFilter,
  IHarvestHistoryData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedTagData,
  IIndexedTransferData,
  IItemData,
  ILocationData,
  IPackageData,
  IPackageHistoryData,
  IPackageOptions,
  IPaginationOptions,
  IPlantBatchData,
  IPlantBatchOptions,
  IPlantData,
  IPlantOptions,
  ISalesReceiptData,
  IStrainData,
  ITagData,
  ITagFilter,
  ITagOrderData,
  ITestResultData,
  ITransferData,
  ITransferFilter,
  ITransferHistoryData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { databaseInterface } from "@/modules/database-interface.module";
import {
  MetrcRequestManager,
  primaryMetrcRequestManager,
} from "@/modules/metrc-request-manager.module";
import { mockDataManager } from "@/modules/mock-data-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { CsvUpload } from "@/types";
import { buildBody, streamFactory } from "@/utils/data-loader";
import { debugLogFactory } from "@/utils/debug";
import { extract, ExtractedData, ExtractionType } from "@/utils/html";
import { get } from "idb-keyval";
import { Subject, timer } from "rxjs";
import { map, take } from "rxjs/operators";
import { IPackageFilter } from "../../interfaces";
import { DataLoadError, DataLoadErrorType } from "./data-loader-error";

const debugLog = debugLogFactory("data-loader.module.ts");

export const dataLoaderCache: Map<string, DataLoader> = new Map();

export async function getDataLoader(
  spoofedAuthState: IAuthState | null = null
): Promise<DataLoader> {
  if (spoofedAuthState?.license && dataLoaderCache.has(spoofedAuthState.license)) {
    return dataLoaderCache.get(spoofedAuthState.license) as DataLoader;
  } else {
    const dataLoader = new DataLoader();
    const authState: IAuthState = spoofedAuthState || (await authManager.authStateOrError());
    dataLoader.init(authState);

    dataLoaderCache.set(authState.license, dataLoader);

    return dataLoader;
  }
}

export class DataLoader implements IAtomicService {
  private _availableTags: Promise<IIndexedTagData[]> | null = null;
  private _usedTags: Promise<IIndexedTagData[]> | null = null;
  private _voidedTags: Promise<IIndexedTagData[]> | null = null;
  private _activePackages: Promise<IIndexedPackageData[]> | null = null;
  private _inactivePackages: Promise<IIndexedPackageData[]> | null = null;
  private _inTransitPackages: Promise<IIndexedPackageData[]> | null = null;
  private _previousTagOrders: Promise<ITagOrderData[]> | null = null;
  private _incomingTransfers: Promise<IIndexedTransferData[]> | null = null;
  private _outgoingTransfers: Promise<IIndexedTransferData[]> | null = null;
  private _rejectedTransfers: Promise<IIndexedTransferData[]> | null = null;
  private _locations: Promise<ILocationData[]> | null = null;
  private _strains: Promise<IStrainData[]> | null = null;
  private _items: Promise<IItemData[]> | null = null;
  private _activeHarvests: Promise<IIndexedHarvestData[]> | null = null;

  private _countPayload: string = buildBody({ page: 0, pageSize: 5 });

  private _metrcRequestManager: MetrcRequestManager | null = null;

  /**
   * init() should contain eagerly loaded data pieces
   */
  async init(spoofedAuthState: IAuthState | null = null) {
    if (spoofedAuthState) {
      const spoofedMetrcRequestManager = new MetrcRequestManager();
      spoofedMetrcRequestManager.init(spoofedAuthState);
      this._metrcRequestManager = spoofedMetrcRequestManager;
    } else {
      this._metrcRequestManager = primaryMetrcRequestManager;
    }

    dataLoaderCache.set((spoofedAuthState || (await authManager.authStateOrError())).license, this);

    // await authManager.authStateOrError();

    //   await scriptContextManager.metrc();

    //   if (await get(await this.licenseKey(IdbKeyPiece.PACKAGE_MODAL_HTML_TIMESTAMP))) {
    //     pageManager.enableQuickPackageButton();
    //   }

    //   if (await get(await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP))) {
    //     pageManager.enableQuickTransferButton();
    //   }

    //   if (await get(await this.licenseKey(IdbKeyPiece.TRANSFER_TEMPLATE_MODAL_HTML_TIMESTAMP))) {
    //     pageManager.enableQuickTransferTemplateButton();
    //   }

    //   const now = Date.now();

    //   // Eagerly load transfer modal
    //   const transferTimestamp: number = (await get(
    //     await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP)
    //   )) as number;
    //   // if (!transferTimestamp || ((now - transferTimestamp) > 1000 * 60 * 5)) {
    //   if (true || !transferTimestamp || now - transferTimestamp > 1000 * 60 * 5) {
    //     const response = await this.metrcRequestManagerOrError.getNewTransferHTML();
    //     const html: string = await response.text();

    //     await set(await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML), html);
    //     await set(await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP), now);

    //     pageManager.enableQuickTransferButton();
    //   }

    //   // Eagerly load package modal
    //   const packageTimestamp: number = (await get(
    //     await this.licenseKey(IdbKeyPiece.PACKAGE_MODAL_HTML_TIMESTAMP)
    //   )) as number;
    //   if (!packageTimestamp || now - packageTimestamp > 1000 * 60 * 5) {
    //     const response = await this.metrcRequestManagerOrError.getNewPackageHTML();
    //     const html: string = await response.text();

    //     await set(await this.licenseKey(IdbKeyPiece.PACKAGE_MODAL_HTML), html);
    //     await set(await this.licenseKey(IdbKeyPiece.PACKAGE_MODAL_HTML_TIMESTAMP), now);

    //     pageManager.enableQuickPackageButton();
    //   }

    //   // Eagerly load transfer template modal
    //   const transferTemplateTimestamp: number = (await get(
    //     await this.licenseKey(IdbKeyPiece.TRANSFER_TEMPLATE_MODAL_HTML_TIMESTAMP)
    //   )) as number;
    //   if (!transferTemplateTimestamp || now - transferTemplateTimestamp > 1000 * 60 * 5) {
    //     const response = await this.metrcRequestManagerOrError.getNewTransferTemplateHTML();
    //     const html: string = await response.text();

    //     await set(await this.licenseKey(IdbKeyPiece.TRANSFER_TEMPLATE_MODAL_HTML), html);
    //     await set(await this.licenseKey(IdbKeyPiece.TRANSFER_TEMPLATE_MODAL_HTML_TIMESTAMP), now);

    //     pageManager.enableQuickTransferTemplateButton();
    //   }
  }

  get metrcRequestManagerOrError() {
    if (!this._metrcRequestManager) {
      throw new Error("MetrcRequestManager not available");
    }

    return this._metrcRequestManager;
  }

  async licenseKey(key: IdbKeyPiece) {
    const authState = await authManager.authStateOrError();

    return `${key}_${authState.license}`;
  }

  async transferModalHtml(): Promise<string | null> {
    return get(await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML)) as Promise<string | null>;
  }

  async packageModalHtml(): Promise<string | null> {
    return get(await this.licenseKey(IdbKeyPiece.PACKAGE_MODAL_HTML)) as Promise<string | null>;
  }

  async transferTemplateModalHtml(): Promise<string | null> {
    return get(await this.licenseKey(IdbKeyPiece.TRANSFER_TEMPLATE_MODAL_HTML)) as Promise<
      string | null
    >;
  }

  /**
   * Count methods. Uses the Total field in the Metrc response payload to assess total collection size.
   *
   * These dispatch a single lightweight request and therefore are not cached.
   */

  private async extractTotalOrNull(responsePromise: Promise<Response>): Promise<number | null> {
    let total: number | null = null;

    try {
      const json = await (await responsePromise).json();

      if (typeof json.Total !== "number") {
        throw new Error("Could not extract Total");
      }

      total = json.Total;
    } catch (e) {
      debugLog(async () => [(e as Error).toString()]);
    }

    return total;
  }

  async availableTagCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getAvailableTags(this._countPayload)
    );
  }
  async usedTagCount(): Promise<number | null> {
    return this.extractTotalOrNull(this.metrcRequestManagerOrError.getUsedTags(this._countPayload));
  }
  async voidedTagCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getVoidedTags(this._countPayload)
    );
  }

  async activePackageCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getActivePackages(this._countPayload)
    );
  }
  async inactivePackageCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInactivePackages(this._countPayload)
    );
  }
  async intransitPackageCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInTransitPackages(this._countPayload)
    );
  }

  async incomingTransferCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getIncomingTransfers(this._countPayload)
    );
  }
  async outgoingTransferCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getOutgoingTransfers(this._countPayload)
    );
  }
  async rejectedTransferCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getRejectedTransfers(this._countPayload)
    );
  }

  async itemCount(): Promise<number | null> {
    return this.extractTotalOrNull(this.metrcRequestManagerOrError.getItems(this._countPayload));
  }
  async locationCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getLocations(this._countPayload)
    );
  }
  async strainCount(): Promise<number | null> {
    return this.extractTotalOrNull(this.metrcRequestManagerOrError.getStrains(this._countPayload));
  }

  async activePlantBatchCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getPlantBatches(this._countPayload)
    );
  }
  async inactivePlantBatchCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInactivePlantBatches(this._countPayload)
    );
  }

  async vegetativePlantCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getVegetativePlants(this._countPayload)
    );
  }
  async floweringPlantCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getFloweringPlants(this._countPayload)
    );
  }
  async inactivePlantCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInactivePlants(this._countPayload)
    );
  }

  async activeHarvestCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getActiveHarvests(this._countPayload)
    );
  }
  async inactiveHarvestCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInactiveHarvests(this._countPayload)
    );
  }

  async activeSalesCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getActiveSalesReceipts(this._countPayload)
    );
  }
  async inactiveSalesCount(): Promise<number | null> {
    return this.extractTotalOrNull(
      this.metrcRequestManagerOrError.getInactiveSalesReceipts(this._countPayload)
    );
  }

  /**
   *
   * Primary load methods
   *
   */

  async availableTags({ useCache = true }: { useCache?: boolean }): Promise<IIndexedTagData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockTags.enabled) {
      return mockDataManager.mockTags();
    }

    if (!this._availableTags || !useCache) {
      this._availableTags = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Available tag fetch timed out")
        );

        try {
          const tags: IIndexedTagData[] = (await this.loadAvailableTags()).map((tag) => ({
            ...tag,
            TagState: TagState.AVAILABLE,
            TagMatcher: "",
          }));

          databaseInterface.indexTags(tags, TagState.AVAILABLE);

          subscription.unsubscribe();
          resolve(tags);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._availableTags = null;
        }
      });
    }

    return this._availableTags;
  }

  async availableTag(tag: string): Promise<IIndexedTagData> {
    if (store.state.mockDataMode) {
      // TODO
    }

    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Available tag fetch timed out")
      );

      try {
        const tagData: IIndexedTagData = {
          ...(await this.loadAvailableTag(tag)),
          TagState: TagState.AVAILABLE,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(tagData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async usedTags(): Promise<IIndexedTagData[]> {
    if (!this._usedTags) {
      this._usedTags = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Used tag fetch timed out")
        );

        try {
          const tags: IIndexedTagData[] = (await this.loadUsedTags()).map((tag) => ({
            ...tag,
            TagState: TagState.USED,
            TagMatcher: "",
          }));

          databaseInterface.indexTags(tags, TagState.USED);

          subscription.unsubscribe();
          resolve(tags);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._usedTags = null;
        }
      });
    }

    return this._usedTags;
  }

  async voidedTags(): Promise<IIndexedTagData[]> {
    if (!this._voidedTags) {
      this._voidedTags = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Voided tag fetch timed out")
        );

        try {
          const tags: IIndexedTagData[] = (await this.loadVoidedTags()).map((tag) => ({
            ...tag,
            TagState: TagState.VOIDED,
            TagMatcher: "",
          }));

          databaseInterface.indexTags(tags, TagState.VOIDED);

          subscription.unsubscribe();
          resolve(tags);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._voidedTags = null;
        }
      });
    }

    return this._voidedTags;
  }

  async vegetativePlants(options: IPlantOptions = {}): Promise<IIndexedPlantData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPlants.enabled) {
      // @ts-ignore
      return mockDataManager.mockPlants(options);
    }

    // This does NOT cache the result
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Vegetative plant fetch timed out")
      );

      try {
        const plants = (await this.loadVegetativePlants(options)).map((x) => ({
          ...x,
          PlantState: PlantState.VEGETATIVE,
          TagMatcher: "",
        }));

        subscription.unsubscribe();
        resolve(plants);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async floweringPlants(options: IPlantOptions = {}): Promise<IIndexedPlantData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPlants.enabled) {
      // @ts-ignore
      return mockDataManager.mockPlants(options);
    }

    // This does NOT cache the result
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Flowering plant fetch timed out")
      );

      try {
        const plants = (await this.loadFloweringPlants(options)).map((x) => ({
          ...x,
          PlantState: PlantState.FLOWERING,
          TagMatcher: "",
        }));

        subscription.unsubscribe();
        resolve(plants);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async inactivePlants(options: IPlantOptions): Promise<IPlantData[]> {
    console.log("inactive plants");

    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPlants.enabled) {
      return mockDataManager.mockPlants(options);
    }

    // This does NOT cache the result
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Inactive plant fetch timed out")
      );

      try {
        const plants = await this.loadInactivePlants(options);

        subscription.unsubscribe();
        resolve(plants);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async plantBatches(options: IPlantBatchOptions): Promise<IPlantBatchData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPlantBatches.enabled) {
      return mockDataManager.mockPlantBatches(options);
    }

    // This does NOT cache the result
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Plant batch fetch timed out")
      );

      try {
        const plants = await this.loadPlantBatches(options);

        subscription.unsubscribe();
        resolve(plants);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async onDemandPackageFilter(packageFilter: IPackageFilter): Promise<IIndexedPackageData[]> {
    if (
      packageFilter.itemName === null &&
      packageFilter.locationName === null &&
      packageFilter.isEmpty === null
    ) {
      console.error("No filters applied, exiting");
      return [];
    }

    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return mockDataManager.mockPackages();
    }

    // "Row 1" should not match "Row 10"
    if (packageFilter.locationName) {
      packageFilter.locationNameExact = true;
    }

    const body = buildBody(
      {
        page: 0,
        pageSize: DATA_LOAD_PAGE_SIZE,
      },
      {
        packageFilter,
      }
    );

    const activePackagesResponse = await primaryMetrcRequestManager.getActivePackages(body);

    if (activePackagesResponse.status === 200) {
      const responseData: ICollectionResponse<IPackageData> = await activePackagesResponse.json();

      const activePackages: IIndexedPackageData[] = responseData["Data"].map((x) => ({
        ...x,
        PackageState: PackageState.ACTIVE,
        TagMatcher: "",
        LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
      }));

      return activePackages;
    }

    throw new Error("Active packages request failed.");
  }

  onDemandPlantSearchBody({ queryString }: { queryString: string }): string {
    return JSON.stringify({
      request: {
        take: DATA_LOAD_PAGE_SIZE,
        skip: 0,
        page: 1,
        pageSize: DATA_LOAD_PAGE_SIZE,
        filter: {
          logic: "or",
          filters: [
            { field: "Label", operator: "contains", value: queryString },
            { field: "LocationName", operator: "contains", value: queryString },
            { field: "StrainName", operator: "contains", value: queryString },
          ],
        },
        group: [],
      },
    });
  }

  async onDemandFloweringPlantSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPlantData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      // @ts-ignore
      return mockDataManager.mockPlants({ filters: {} }).map((x) => ({
        ...x,
        TagMatcher: "",
        PlantState: PlantState.FLOWERING,
      }));
    }

    let plants: IIndexedPlantData[] = [];

    const body = this.onDemandPlantSearchBody({ queryString });

    const floweringPlantsResponse = await primaryMetrcRequestManager.getFloweringPlants(body);

    if (floweringPlantsResponse.status === 200) {
      const responseData: ICollectionResponse<IPlantData> = await floweringPlantsResponse.json();

      const floweringPlants: IIndexedPlantData[] = responseData["Data"].map((x) => ({
        ...x,
        PlantState: PlantState.FLOWERING,
        TagMatcher: "",
      }));

      plants = [...plants, ...floweringPlants];
    } else {
      console.error("Flowering plants request failed.");
    }

    return plants;
  }

  async onDemandVegetativePlantSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPlantData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      // @ts-ignore
      return [];
    }

    let plants: IIndexedPlantData[] = [];

    const body = this.onDemandPlantSearchBody({ queryString });
    const vegetativePlantsResponse = await primaryMetrcRequestManager.getVegetativePlants(body);

    if (vegetativePlantsResponse.status === 200) {
      const responseData: ICollectionResponse<IPlantData> = await vegetativePlantsResponse.json();

      const vegetativePlants: IIndexedPlantData[] = responseData["Data"].map((x) => ({
        ...x,
        PlantState: PlantState.VEGETATIVE,
        TagMatcher: "",
      }));

      plants = [...plants, ...vegetativePlants];
    } else {
      console.error("Vegetative plants request failed.");
    }
    return plants;
  }

  async onDemandInactivePlantSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPlantData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      // @ts-ignore
      return [];
    }

    let plants: IIndexedPlantData[] = [];

    const body = this.onDemandPlantSearchBody({ queryString });
    const inactivePlantsResponse = await primaryMetrcRequestManager.getInactivePlants(body);

    if (inactivePlantsResponse.status === 200) {
      const responseData: ICollectionResponse<IPlantData> = await inactivePlantsResponse.json();

      const inactivePlants: IIndexedPlantData[] = responseData["Data"].map((x) => ({
        ...x,
        PlantState: PlantState.INACTIVE,
        TagMatcher: "",
      }));

      plants = [...plants, ...inactivePlants];
    } else {
      console.error("Inactive plants request failed.");
    }

    return plants;
  }

  async onDemandPackageItemSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPackageData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return mockDataManager.mockPackages();
    }

    let packages: IIndexedPackageData[] = [];

    const body = buildBody(
      {
        page: 0,
        pageSize: DATA_LOAD_PAGE_SIZE,
      },
      {
        operator: "or",
        packageFilter: {
          itemStrainName: queryString,
          itemName: queryString,
        },
      }
    );

    const activePackagesResponse = await primaryMetrcRequestManager.getActivePackages(body);

    if (activePackagesResponse.status === 200) {
      const responseData: ICollectionResponse<IPackageData> = await activePackagesResponse.json();

      const activePackages: IIndexedPackageData[] = responseData["Data"].map((x) => ({
        ...x,
        PackageState: PackageState.ACTIVE,
        TagMatcher: "",
        LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
      }));

      packages = [...packages, ...activePackages];
    } else {
      console.error("Active packages request failed.");
    }

    return packages;
  }

  onDemandPackageSearchBody({ queryString }: { queryString: string }): string {
    return JSON.stringify({
      request: {
        take: DATA_LOAD_PAGE_SIZE,
        skip: 0,
        page: 1,
        pageSize: DATA_LOAD_PAGE_SIZE,
        filter: {
          logic: "or",
          filters: [
            { field: "Label", operator: "contains", value: queryString },
            { field: "Item.ProductCategoryName", operator: "contains", value: queryString },
            { field: "LocationName", operator: "contains", value: queryString },
            { field: "SourcePackageLabels", operator: "contains", value: queryString },
            { field: "SourceHarvestNames", operator: "contains", value: queryString },
            { field: "Item.StrainName", operator: "contains", value: queryString },
            { field: "Item.Name", operator: "contains", value: queryString },
          ],
        },
        group: [],
      },
    });
  }

  async onDemandActivePackageSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPackageData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return mockDataManager.mockPackages();
    }

    let packages: IIndexedPackageData[] = [];

    const body = this.onDemandPackageSearchBody({ queryString });

    const activePackagesResponse = await primaryMetrcRequestManager.getActivePackages(body);

    if (activePackagesResponse.status === 200) {
      const responseData: ICollectionResponse<IPackageData> = await activePackagesResponse.json();

      const activePackages: IIndexedPackageData[] = responseData["Data"].map((x) => ({
        ...x,
        PackageState: PackageState.ACTIVE,
        TagMatcher: "",
        LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
      }));

      packages = [...packages, ...activePackages];
    } else {
      console.error("Active packages request failed.");
    }

    return packages;
  }

  async onDemandInactivePackageSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPackageData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return [];
    }

    let packages: IIndexedPackageData[] = [];

    const body = this.onDemandPackageSearchBody({ queryString });

    const inactivePackagesResponse = await primaryMetrcRequestManager.getInactivePackages(body);

    if (inactivePackagesResponse.status === 200) {
      const responseData: ICollectionResponse<IPackageData> = await inactivePackagesResponse.json();

      const activePackages: IIndexedPackageData[] = responseData["Data"].map((x) => ({
        ...x,
        PackageState: PackageState.INACTIVE,
        TagMatcher: "",
        LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
      }));

      packages = [...packages, ...activePackages];
    } else {
      console.error("Inactive packages request failed.");
    }

    return packages;
  }

  async onDemandInTransitPackageSearch({
    queryString,
  }: {
    queryString: string;
  }): Promise<IIndexedPackageData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return [];
    }

    let packages: IIndexedPackageData[] = [];

    const body = this.onDemandPackageSearchBody({ queryString });

    const inTransitPackagesResponse = await primaryMetrcRequestManager.getInTransitPackages(body);

    if (inTransitPackagesResponse.status === 200) {
      const responseData: ICollectionResponse<IPackageData> =
        await inTransitPackagesResponse.json();

      const activePackages: IIndexedPackageData[] = responseData["Data"].map((x) => ({
        ...x,
        PackageState: PackageState.IN_TRANSIT,
        TagMatcher: "",
        LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
      }));

      packages = [...packages, ...activePackages];
    } else {
      console.error("In transit packages request failed.");
    }

    return packages;
  }

  async activePackages(resetCache: boolean = false): Promise<IIndexedPackageData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPackages.enabled) {
      return mockDataManager.mockPackages();
    }

    if (resetCache) {
      this._activePackages = null;
    }

    if (!this._activePackages) {
      this._activePackages = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Active package fetch timed out")
        );

        try {
          const activePackages = (await this.loadActivePackages()).map((pkg) => ({
            ...pkg,
            PackageState: PackageState.ACTIVE,
            TagMatcher: "",
            LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
          }));

          // databaseInterface.indexPackages(activePackages, PackageState.ACTIVE);

          subscription.unsubscribe();
          resolve(activePackages);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._activePackages = null;
        }
      });
    }

    return this._activePackages;
  }

  async activePackage(label: string): Promise<IIndexedPackageData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Active package fetch timed out")
      );

      try {
        const packageData: IIndexedPackageData = {
          ...(await this.loadActivePackage(label)),
          PackageState: PackageState.ACTIVE,
          TagMatcher: "",
          LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
        };

        subscription.unsubscribe();
        resolve(packageData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async inactivePackages(resetCache: boolean = false): Promise<IIndexedPackageData[]> {
    if (resetCache) {
      this._inactivePackages = null;
    }

    if (!this._inactivePackages) {
      this._inactivePackages = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Inactive package fetch timed out")
        );

        try {
          const inactivePackages: IIndexedPackageData[] = (await this.loadInactivePackages()).map(
            (pkg) => ({
              ...pkg,
              PackageState: PackageState.INACTIVE,
              TagMatcher: "",
              LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
            })
          );

          // databaseInterface.indexPackages(inactivePackages, PackageState.INACTIVE);

          subscription.unsubscribe();
          resolve(inactivePackages);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._inactivePackages = null;
        }
      });
    }

    return this._inactivePackages;
  }

  async transferDestinations(transferId: number): Promise<IDestinationData[]> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Departed packages fetch timed out")
      );

      try {
        const transferDestinations: IDestinationData[] = await this.loadTransferDestinations(
          transferId
        );

        subscription.unsubscribe();
        resolve(transferDestinations);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async destinationPackages(destinationId: number): Promise<IIndexedPackageData[]> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Departed packages fetch timed out")
      );

      try {
        const destinationPackages: IIndexedPackageData[] = (
          await this.loadDestinationPackages(destinationId)
        ).map((pkg) => ({
          ...pkg,
          PackageState: PackageState.DEPARTED_FACILITY,
          TagMatcher: "",
          LicenseNumber: "",
        }));

        subscription.unsubscribe();
        resolve(destinationPackages);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async inactivePackage(label: string): Promise<IIndexedPackageData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Inactive package fetch timed out")
      );

      try {
        const packageData: IIndexedPackageData = {
          ...(await this.loadInactivePackage(label)),
          PackageState: PackageState.INACTIVE,
          TagMatcher: "",
          LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
        };

        subscription.unsubscribe();
        resolve(packageData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async inTransitPackages(resetCache: boolean = false): Promise<IIndexedPackageData[]> {
    if (resetCache) {
      this._inTransitPackages = null;
    }

    if (!this._inTransitPackages) {
      this._inTransitPackages = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("In transit package fetch timed out")
        );

        try {
          const inTransitPackages: IIndexedPackageData[] = (await this.loadInTransitPackages()).map(
            (pkg) => ({
              ...pkg,
              PackageState: PackageState.IN_TRANSIT,
              TagMatcher: "",
              LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
            })
          );

          // databaseInterface.indexPackages(inTransitPackages, PackageState.IN_TRANSIT);

          subscription.unsubscribe();
          resolve(inTransitPackages);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._inTransitPackages = null;
        }
      });
    }

    return this._inTransitPackages;
  }

  async inTransitPackage(label: string): Promise<IIndexedPackageData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("In Transit package fetch timed out")
      );

      try {
        const packageData: IIndexedPackageData = {
          ...(await this.loadInTransitPackage(label)),
          PackageState: PackageState.IN_TRANSIT,
          TagMatcher: "",
          LicenseNumber: primaryMetrcRequestManager.authStateOrError.license,
        };

        subscription.unsubscribe();
        resolve(packageData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async incomingTransfers(resetCache: boolean = false): Promise<IIndexedTransferData[]> {
    if (resetCache) {
      this._incomingTransfers = null;
    }

    if (!this._incomingTransfers) {
      this._incomingTransfers = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Incoming transfer fetch timed out")
        );

        try {
          const incomingTransfers: IIndexedTransferData[] = (
            await this.loadIncomingTransfers()
          ).map((transfer) => ({
            ...transfer,
            TransferState: TransferState.INCOMING,
            TagMatcher: "",
          }));

          databaseInterface.indexTransfers(incomingTransfers, TransferState.INCOMING);

          subscription.unsubscribe();
          resolve(incomingTransfers);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._incomingTransfers = null;
        }
      });
    }

    return this._incomingTransfers;
  }

  async incomingInactiveTransfers(resetCache: boolean = false): Promise<IIndexedTransferData[]> {
    if (resetCache) {
      this._incomingTransfers = null;
    }

    if (!this._incomingTransfers) {
      this._incomingTransfers = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Incoming transfer fetch timed out")
        );

        try {
          const incomingTransfers: IIndexedTransferData[] = (
            await this.loadIncomingTransfers()
          ).map((transfer) => ({
            ...transfer,
            TransferState: TransferState.INCOMING_INACTIVE,
            TagMatcher: "",
          }));

          databaseInterface.indexTransfers(incomingTransfers, TransferState.INCOMING);

          subscription.unsubscribe();
          resolve(incomingTransfers);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._incomingTransfers = null;
        }
      });
    }

    return this._incomingTransfers;
  }

  async incomingTransfer(manifestNumber: string): Promise<IIndexedTransferData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Transfer fetch timed out")
      );

      try {
        const transferData: IIndexedTransferData = {
          ...(await this.loadIncomingTransfer(manifestNumber)),
          TransferState: TransferState.INCOMING,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(transferData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async outgoingTransfers(resetCache: boolean = false): Promise<IIndexedTransferData[]> {
    if (resetCache) {
      this._outgoingTransfers = null;
    }

    if (!this._outgoingTransfers) {
      this._outgoingTransfers = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Outgoing transfer fetch timed out")
        );

        try {
          const outgoingTransfers: IIndexedTransferData[] = (
            await this.loadOutgoingTransfers()
          ).map((transfer) => ({
            ...transfer,
            TransferState: TransferState.OUTGOING,
            TagMatcher: "",
          }));

          databaseInterface.indexTransfers(outgoingTransfers, TransferState.OUTGOING);

          subscription.unsubscribe();
          resolve(outgoingTransfers);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._outgoingTransfers = null;
        }
      });
    }

    return this._outgoingTransfers;
  }

  async outgoingInactiveTransfers(resetCache: boolean = false): Promise<IIndexedTransferData[]> {
    if (resetCache) {
      this._outgoingTransfers = null;
    }

    if (!this._outgoingTransfers) {
      this._outgoingTransfers = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Outgoing transfer fetch timed out")
        );

        try {
          const outgoingTransfers: IIndexedTransferData[] = (
            await this.loadOutgoingTransfers()
          ).map((transfer) => ({
            ...transfer,
            TransferState: TransferState.OUTGOING_INACTIVE,
            TagMatcher: "",
          }));

          databaseInterface.indexTransfers(outgoingTransfers, TransferState.OUTGOING);

          subscription.unsubscribe();
          resolve(outgoingTransfers);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._outgoingTransfers = null;
        }
      });
    }

    return this._outgoingTransfers;
  }

  async outgoingTransfer(manifestNumber: string): Promise<IIndexedTransferData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Transfer fetch timed out")
      );

      try {
        const transferData: IIndexedTransferData = {
          ...(await this.loadOutgoingTransfer(manifestNumber)),
          TransferState: TransferState.OUTGOING,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(transferData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async rejectedTransfers(resetCache: boolean = false): Promise<IIndexedTransferData[]> {
    if (resetCache) {
      this._rejectedTransfers = null;
    }

    if (!this._rejectedTransfers) {
      this._rejectedTransfers = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Return transfer fetch timed out")
        );

        try {
          const rejectedTransfers: IIndexedTransferData[] = (
            await this.loadRejectedTransfers()
          ).map((transfer) => ({
            ...transfer,
            TransferState: TransferState.REJECTED,
            TagMatcher: "",
          }));

          databaseInterface.indexTransfers(rejectedTransfers, TransferState.REJECTED);

          subscription.unsubscribe();
          resolve(rejectedTransfers);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._rejectedTransfers = null;
        }
      });
    }

    return this._rejectedTransfers;
  }

  async rejectedTransfer(manifestNumber: string): Promise<IIndexedTransferData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Transfer fetch timed out")
      );

      try {
        const transferData: IIndexedTransferData = {
          ...(await this.loadRejectedTransfer(manifestNumber)),
          TransferState: TransferState.REJECTED,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(transferData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async locations(): Promise<ILocationData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockLocations.enabled) {
      return mockDataManager.mockLocations();
    }

    if (!this._locations) {
      this._locations = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Location fetch timed out")
        );

        try {
          const locations = await this.loadLocations();

          subscription.unsubscribe();
          resolve(locations);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._locations = null;
        }
      });
    }

    return this._locations;
  }

  async strains(resetCache: boolean = false): Promise<IStrainData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockStrains.enabled) {
      return mockDataManager.mockStrains();
    }

    if (resetCache) {
      this._strains = null;
    }

    if (!this._strains) {
      this._strains = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Strain fetch timed out")
        );

        try {
          const strains = await this.loadStrains();

          subscription.unsubscribe();
          resolve(strains);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._strains = null;
        }
      });
    }

    return this._strains;
  }

  async items(): Promise<IItemData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockItems.enabled) {
      return mockDataManager.mockItems();
    }

    if (!this._items) {
      this._items = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Item fetch timed out")
        );

        try {
          const items = await this.loadItems();

          subscription.unsubscribe();
          resolve(items);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._items = null;
        }
      });
    }

    return this._items;
  }

  async activeHarvestByName(name: string): Promise<IIndexedHarvestData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Active harvest fetch timed out")
      );

      try {
        const harvestData: IIndexedHarvestData = {
          ...(await this.loadActiveHarvestByName(name)),
          HarvestState: HarvestState.ACTIVE,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(harvestData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async inactiveHarvestByName(name: string): Promise<IIndexedHarvestData> {
    return new Promise(async (resolve, reject) => {
      const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
        reject("Active harvest fetch timed out")
      );

      try {
        const harvestData: IIndexedHarvestData = {
          ...(await this.loadInactiveHarvestByName(name)),
          HarvestState: HarvestState.INACTIVE,
          TagMatcher: "",
        };

        subscription.unsubscribe();
        resolve(harvestData);
      } catch (e) {
        subscription.unsubscribe();
        reject(e);
      }
    });
  }

  async activeHarvests(): Promise<IIndexedHarvestData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockHarvests.enabled) {
      return mockDataManager.mockHarvests();
    }

    if (!this._activeHarvests) {
      this._activeHarvests = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Harvest fetch timed out")
        );

        try {
          const harvests: IIndexedHarvestData[] = (await this.loadActiveHarvests()).map(
            (harvest) => ({
              ...harvest,
              HarvestState: HarvestState.ACTIVE,
              TagMatcher: "",
            })
          );

          subscription.unsubscribe();
          resolve(harvests);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._activeHarvests = null;
        }
      });
    }

    return this._activeHarvests;
  }

  async activeSalesReceipts(): Promise<ISalesReceiptData[]> {
    const activeSalesReceipts: Promise<ISalesReceiptData[]> = new Promise(
      async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Active sales receipt fetch timed out")
        );

        try {
          const activeSalesReceipts = await this.loadActiveSalesReceipts();

          subscription.unsubscribe();
          resolve(activeSalesReceipts);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
        }
      }
    );

    return activeSalesReceipts;
  }

  async testResultsByPackageId(packageId: number): Promise<ITestResultData[]> {
    const page = 0;
    const body = buildBody({ page, pageSize: DATA_LOAD_PAGE_SIZE });

    const response = await this.metrcRequestManagerOrError.getTestResults(body, packageId);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITestResultData> = await response.json();

    return responseData.Data;
  }

  async previousTagOrders(): Promise<ITagOrderData[]> {
    if (!this._previousTagOrders) {
      this._previousTagOrders = new Promise(async (resolve, reject) => {
        const subscription = timer(DATA_LOAD_FETCH_TIMEOUT_MS).subscribe(() =>
          reject("Tag orders fetch timed out")
        );

        try {
          subscription.unsubscribe();
          resolve(await this.loadAllPreviousTagOrders());
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._previousTagOrders = null;
        }
      });
    }

    return this._previousTagOrders;
  }

  async lookupTagId(tag: string) {
    for (let tagData of await this.availableTags({})) {
      if (tag === tagData.Label) {
        return tagData.Id;
      }
    }

    throw `Tag ${tag} not found`;
  }

  async lookupPackageId(tag: string) {
    // for (let packageData of await this.activePackages()) {
    //   if (tag === packageData.Label) {
    //     return packageData.Id;
    //   }
    // }

    throw `Package ${tag} not found`;
  }

  async getExtractedITagOrderModalData(): Promise<IExtractedITagOrderData> {
    const response = await this.metrcRequestManagerOrError.getTagOrderHTML();
    const html: string = await response.text();

    const result: ExtractedData | null = extract(ExtractionType.TAG_ORDER_DATA, html);

    if (!result || !result.tagOrderData) {
      return {
        maxPlantOrderSize: 0,
        maxPackageOrderSize: 0,
        contactInfo: {
          contactName: "",
          phoneNumber: "",
          address: {
            address1: "",
            address2: "",
            city: "",
            state: "",
            zip: "",
          },
        },
      };
    }

    return result.tagOrderData;
  }

  /**
   *
   * Streams
   *
   */

  transferDestinationStream(
    dataLoadOptions: IDataLoadOptions = {},
    transferId: number
  ): Subject<ICollectionResponse<IDestinationData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getTransferDestinations(body, transferId);
    };

    return streamFactory<IDestinationData>(dataLoadOptions, responseFactory);
  }

  destinationPackagesStream(
    dataLoadOptions: IDataLoadOptions = {},
    destinationId: number
  ): Subject<ICollectionResponse<IPackageData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getDestinationPackages(body, destinationId);
    };

    return streamFactory<IPackageData>(dataLoadOptions, responseFactory);
  }

  activePackagesStream(options: IPackageOptions = {}): Subject<ICollectionResponse<IPackageData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getActivePackages(body);
    };

    return streamFactory<IPackageData>(options, responseFactory);
  }

  inactivePackagesStream(
    options: IPackageOptions = {}
  ): Subject<ICollectionResponse<IPackageData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getInactivePackages(body);
    };

    return streamFactory<IPackageData>(options, responseFactory);
  }

  inTransitPackagesStream(
    options: IPackageOptions = {}
  ): Subject<ICollectionResponse<IPackageData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getInTransitPackages(body);
    };

    return streamFactory<IPackageData>(options, responseFactory);
  }

  vegetativePlantsStream(options: IPlantOptions): Subject<ICollectionResponse<IPlantData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(
        paginationOptions,
        { plantFilter: options.filter },
        { plantSort: { Label: "asc" } }
      );

      return this.metrcRequestManagerOrError.getVegetativePlants(body);
    };

    return streamFactory<IPlantData>(options, responseFactory);
  }

  floweringPlantsStream(options: IPlantOptions): Subject<ICollectionResponse<IPlantData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(
        paginationOptions,
        { plantFilter: options.filter },
        { plantSort: { Label: "asc" } }
      );

      return this.metrcRequestManagerOrError.getFloweringPlants(body);
    };

    return streamFactory<IPlantData>(options, responseFactory);
  }

  inactivePlantsStream(options: IPlantOptions): Subject<ICollectionResponse<IPlantData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(
        paginationOptions,
        { plantFilter: options.filter },
        { plantSort: { Label: "asc" } }
      );

      return this.metrcRequestManagerOrError.getInactivePlants(body);
    };

    return streamFactory<IPlantData>(options, responseFactory);
  }

  activeHarvestsStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<IHarvestData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getActiveHarvests(body);
    };

    return streamFactory<IHarvestData>(dataLoadOptions, responseFactory);
  }

  incomingTransfersStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<ITransferData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getIncomingTransfers(body);
    };

    return streamFactory<ITransferData>(dataLoadOptions, responseFactory);
  }

  outgoingTransfersStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<ITransferData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getOutgoingTransfers(body);
    };

    return streamFactory<ITransferData>(dataLoadOptions, responseFactory);
  }

  outgoingInactiveTransfersStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<ITransferData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getOutgoingInactiveTransfers(body);
    };

    return streamFactory<ITransferData>(dataLoadOptions, responseFactory);
  }

  rejectedTransfersStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<ITransferData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getRejectedTransfers(body);
    };

    return streamFactory<ITransferData>(dataLoadOptions, responseFactory);
  }

  availableTagsStream(
    dataLoadOptions: IDataLoadOptions = {}
  ): Subject<ICollectionResponse<ITagData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getAvailableTags(body);
    };

    return streamFactory<ITagData>(dataLoadOptions, responseFactory);
  }

  usedTagsStream(dataLoadOptions: IDataLoadOptions = {}): Subject<ICollectionResponse<ITagData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getUsedTags(body);
    };

    return streamFactory<ITagData>(dataLoadOptions, responseFactory);
  }

  voidedTagsStream(dataLoadOptions: IDataLoadOptions = {}): Subject<ICollectionResponse<ITagData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getVoidedTags(body);
    };

    return streamFactory<ITagData>(dataLoadOptions, responseFactory);
  }

  plantBatchesStream(options: IPlantBatchOptions): Subject<ICollectionResponse<IPlantBatchData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(
        paginationOptions,
        { plantBatchFilter: options.filter },
        { plantBatchSort: { Name: "asc" } }
      );

      return this.metrcRequestManagerOrError.getPlantBatches(body);
    };

    return streamFactory<IPlantBatchData>(options, responseFactory);
  }

  activeSalesReceiptsStream(
    dataLoadOptions: IDataLoadOptions = { pageSize: DATA_LOAD_PAGE_SIZE }
  ): Subject<ICollectionResponse<ISalesReceiptData>> {
    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions, null, {
        salesReceiptSort: { RecordedDateTime: "asc" },
      });

      return this.metrcRequestManagerOrError.getActiveSalesReceipts(body);
    };

    return streamFactory<ISalesReceiptData>(dataLoadOptions, responseFactory);
  }

  /**
   * load() methods
   *
   * These are used
   */

  private async loadTransferDestinations(transferId: number): Promise<IDestinationData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading transfer destinations...");

    let transferDestinations: IDestinationData[] = [];

    await this.transferDestinationStream({}, transferId).forEach(
      (next: ICollectionResponse<IDestinationData>) => {
        transferDestinations = [...transferDestinations, ...next.Data];
      }
    );

    console.log(`Loaded ${transferDestinations.length} transferDestinations`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return transferDestinations;
  }

  private async loadDestinationPackages(destinationId: number): Promise<IPackageData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading destination packages...");

    let destinationPackages: IPackageData[] = [];

    await this.destinationPackagesStream({}, destinationId).forEach(
      (next: ICollectionResponse<IPackageData>) => {
        destinationPackages = [...destinationPackages, ...next.Data];
      }
    );

    console.log(`Loaded ${destinationPackages.length} destinationPackages`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return destinationPackages;
  }

  private async loadIncomingTransfer(manifestNumber: string): Promise<ITransferData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const transferFilter: ITransferFilter = {
      manifestNumber,
    };

    const body = buildBody({ page, pageSize: 1 }, { transferFilter });

    const response = await this.metrcRequestManagerOrError.getIncomingTransfers(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITransferData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${manifestNumber} is not available`
        );
      } else {
        throw new Error("Returned multiple transfers");
      }
    }

    return responseData.Data[0];
  }

  private async loadOutgoingTransfer(manifestNumber: string): Promise<ITransferData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const transferFilter: ITransferFilter = {
      manifestNumber,
    };

    const body = buildBody({ page, pageSize: 1 }, { transferFilter });

    const response = await this.metrcRequestManagerOrError.getOutgoingTransfers(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITransferData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${manifestNumber} is not available`
        );
      } else {
        throw new Error("Returned multiple transfers");
      }
    }

    return responseData.Data[0];
  }

  private async loadRejectedTransfer(manifestNumber: string): Promise<ITransferData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const transferFilter: ITransferFilter = {
      manifestNumber,
    };

    const body = buildBody({ page, pageSize: 1 }, { transferFilter });

    const response = await this.metrcRequestManagerOrError.getRejectedTransfers(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITransferData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${manifestNumber} is not available`
        );
      } else {
        throw new Error("Returned multiple transfers");
      }
    }

    return responseData.Data[0];
  }

  private async loadActiveHarvestByName(harvestName: string): Promise<IHarvestData> {
    if (store.state.mockDataMode) {
    }

    await authManager.authStateOrError();

    const page = 0;

    const harvestFilter: IHarvestFilter = {
      harvestName,
    };

    const body = buildBody({ page, pageSize: 1 }, { harvestFilter });

    const response = await this.metrcRequestManagerOrError.getActiveHarvests(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IHarvestData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${harvestName} is not available`
        );
      } else {
        throw new Error("Returned multiple harvests");
      }
    }

    return responseData.Data[0];
  }

  private async loadInactiveHarvestByName(harvestName: string): Promise<IHarvestData> {
    if (store.state.mockDataMode) {
    }

    await authManager.authStateOrError();

    const page = 0;

    const harvestFilter: IHarvestFilter = {
      harvestName,
    };

    const body = buildBody({ page, pageSize: 1 }, { harvestFilter });

    const response = await this.metrcRequestManagerOrError.getInactiveHarvests(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IHarvestData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${harvestName} is not available`
        );
      } else {
        throw new Error("Returned multiple harvests");
      }
    }

    return responseData.Data[0];
  }

  private async loadActivePackage(label: string): Promise<IPackageData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const packageFilter: IPackageFilter = {
      label,
    };

    const body = buildBody({ page, pageSize: 1 }, { packageFilter });

    const response = await this.metrcRequestManagerOrError.getActivePackages(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IPackageData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${label} is not available`
        );
      } else {
        throw new Error("Returned multiple packages");
      }
    }

    return responseData.Data[0];
  }

  private async loadActivePackages(): Promise<IPackageData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading active packages...");

    let activePackages: IPackageData[] = [];

    await this.activePackagesStream().forEach((next: ICollectionResponse<IPackageData>) => {
      activePackages = [...activePackages, ...next.Data];
    });

    console.log(`Loaded ${activePackages.length} activePackages`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return activePackages;
  }

  private async loadInactivePackage(label: string): Promise<IPackageData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const packageFilter: IPackageFilter = {
      label,
    };

    const body = buildBody({ page, pageSize: 1 }, { packageFilter });

    const response = await this.metrcRequestManagerOrError.getInactivePackages(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IPackageData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${label} is not available`
        );
      } else {
        throw new Error("Returned multiple packages");
      }
    }

    return responseData.Data[0];
  }

  private async loadInactivePackages(): Promise<IPackageData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading inactive packages...");

    let inactivePackages: IPackageData[] = [];

    await this.inactivePackagesStream().forEach((next: ICollectionResponse<IPackageData>) => {
      inactivePackages = [...inactivePackages, ...next.Data];
    });

    console.log(`Loaded ${inactivePackages.length} inactivePackages`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return inactivePackages;
  }

  private async loadInTransitPackage(label: string): Promise<IPackageData> {
    if (store.state.mockDataMode) {
      // TODO
      // return mockDataManager.mockTags().filter(tagData => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const packageFilter: IPackageFilter = {
      label,
    };

    const body = buildBody({ page, pageSize: 1 }, { packageFilter });

    const response = await this.metrcRequestManagerOrError.getInTransitPackages(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IPackageData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${label} is not available`
        );
      } else {
        throw new Error("Returned multiple packages");
      }
    }

    return responseData.Data[0];
  }

  private async loadInTransitPackages(): Promise<IPackageData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading in transit packages...");

    let inTransitPackages: IPackageData[] = [];

    await this.inTransitPackagesStream().forEach((next: ICollectionResponse<IPackageData>) => {
      inTransitPackages = [...inTransitPackages, ...next.Data];
    });

    console.log(`Loaded ${inTransitPackages.length} inTransitPackages`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return inTransitPackages;
  }

  private async loadIncomingTransfers(): Promise<ITransferData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading incoming transfers...");

    let incomingTransfers: ITransferData[] = [];

    await this.incomingTransfersStream().forEach((next: ICollectionResponse<ITransferData>) => {
      incomingTransfers = [...incomingTransfers, ...next.Data];
    });

    console.log(`Loaded ${incomingTransfers.length} incomingTransfers`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return incomingTransfers;
  }

  private async loadOutgoingTransfers(): Promise<ITransferData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading outgoing transfers...");

    let outgoingTransfers: ITransferData[] = [];

    await this.outgoingTransfersStream().forEach((next: ICollectionResponse<ITransferData>) => {
      outgoingTransfers = [...outgoingTransfers, ...next.Data];
    });

    console.log(`Loaded ${outgoingTransfers.length} outgoingTransfers`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return outgoingTransfers;
  }

  private async loadOutgoingInactiveTransfers(): Promise<ITransferData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading outgoing inactive transfers...");

    let outgoingTransfers: ITransferData[] = [];

    await this.outgoingInactiveTransfersStream().forEach(
      (next: ICollectionResponse<ITransferData>) => {
        outgoingTransfers = [...outgoingTransfers, ...next.Data];
      }
    );

    console.log(`Loaded ${outgoingTransfers.length} outgoingInactiveTransfers`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return outgoingTransfers;
  }

  private async loadRejectedTransfers(): Promise<ITransferData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading rejected transfers...");

    let rejectedTransfers: ITransferData[] = [];

    await this.rejectedTransfersStream().forEach((next: ICollectionResponse<ITransferData>) => {
      rejectedTransfers = [...rejectedTransfers, ...next.Data];
    });

    console.log(`Loaded ${rejectedTransfers.length} rejectedTransfers`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return rejectedTransfers;
  }

  private async loadActiveHarvests(): Promise<IHarvestData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading harvests...");

    let harvests: IHarvestData[] = [];

    await this.activeHarvestsStream().forEach((next: ICollectionResponse<IHarvestData>) => {
      harvests = [...harvests, ...next.Data];
    });

    console.log(`Loaded ${harvests.length} harvests`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return harvests;
  }

  private async loadLocations(): Promise<ILocationData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading locations...");

    let locations: ILocationData[] = [];

    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getLocations(body);
    };

    const subject = streamFactory<ILocationData>({}, responseFactory);

    await subject.forEach((next: ICollectionResponse<ILocationData>) => {
      locations = [...locations, ...next.Data];
    });

    console.log(`Loaded ${locations.length} locations`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return locations;
  }

  private async loadItems(): Promise<IItemData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading items...");

    let items: IItemData[] = [];

    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getItems(body);
    };

    const subject = streamFactory<IItemData>({}, responseFactory);

    await subject.forEach((next: ICollectionResponse<IItemData>) => {
      items = [...items, ...next.Data];
    });

    console.log(`Loaded ${items.length} items`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return items;
  }

  private async loadStrains(): Promise<IStrainData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading strains...");

    let strains: IStrainData[] = [];

    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getStrains(body);
    };

    const subject = streamFactory<IStrainData>({}, responseFactory);

    await subject.forEach((next: ICollectionResponse<IStrainData>) => {
      strains = [...strains, ...next.Data];
    });

    console.log(`Loaded ${strains.length} strains`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return strains;
  }

  private async loadVegetativePlants(options: IPlantOptions): Promise<IPlantData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading vegetative plants...");

    let plants: IPlantData[] = [];

    await this.vegetativePlantsStream(options).forEach((next: ICollectionResponse<IPlantData>) => {
      plants = [...plants, ...next.Data];
    });

    console.log(`Loaded ${plants.length} vegetative plants`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return plants;
  }

  private async loadFloweringPlants(options: IPlantOptions): Promise<IPlantData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading flowering plants...");

    let plants: IPlantData[] = [];

    await this.floweringPlantsStream(options).forEach((next: ICollectionResponse<IPlantData>) => {
      plants = [...plants, ...next.Data];
    });

    console.log(`Loaded ${plants.length} flowering plants`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return plants;
  }

  private async loadInactivePlants(options: IPlantOptions): Promise<IPlantData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading inactive plants...");

    let plants: IPlantData[] = [];

    await this.inactivePlantsStream(options).forEach((next: ICollectionResponse<IPlantData>) => {
      plants = [...plants, ...next.Data];
    });

    console.log(`Loaded ${plants.length} inactive plants`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return plants;
  }

  private async loadPlantBatches(options: IPlantBatchOptions): Promise<IPlantBatchData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading plant batches...");

    let plantBatches: IPlantBatchData[] = [];

    await this.plantBatchesStream(options).forEach((next: ICollectionResponse<IPlantBatchData>) => {
      plantBatches = [...plantBatches, ...next.Data];
    });

    console.log(`Loaded ${plantBatches.length} plant batches`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return plantBatches;
  }

  // Only loads single page of receipts
  async loadActiveSalesReceipts(): Promise<ISalesReceiptData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading sales receipts...");

    let salesReceipts: ISalesReceiptData[] = [];

    await this.activeSalesReceiptsStream()
      .pipe(
        take(1),
        map((next) => (salesReceipts = next.Data))
      )
      .toPromise();

    console.log(`Loaded ${salesReceipts.length} sales receipts`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return salesReceipts;
  }

  private async loadAvailableTag(label: string): Promise<ITagData> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockTags.enabled) {
      return mockDataManager.mockTags().filter((tagData) => tagData.Label === label)[0];
    }

    await authManager.authStateOrError();

    const page = 0;

    const tagFilter: ITagFilter = {
      label,
    };

    const body = buildBody({ page, pageSize: 1 }, { tagFilter });

    const response = await this.metrcRequestManagerOrError.getAvailableTags(body);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITagData> = await response.json();

    if (responseData.Data.length !== 1) {
      if (responseData.Data.length === 0) {
        throw new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          `Metrc indicated ${label} is not available`
        );
      } else {
        throw new Error("Returned multiple tags");
      }
    }

    return responseData.Data[0];
  }

  private async loadAvailableTags(dataLoadOptions: IDataLoadOptions = {}): Promise<ITagData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading tags...");

    let availableTags: ITagData[] = [];

    await this.availableTagsStream(dataLoadOptions).forEach(
      (next: ICollectionResponse<ITagData>) => {
        availableTags = [...availableTags, ...next.Data];
      }
    );

    console.log(`Loaded ${availableTags.length} availableTags`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return availableTags;
  }

  private async loadUsedTags(dataLoadOptions: IDataLoadOptions = {}): Promise<ITagData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading tags...");

    let usedTags: ITagData[] = [];

    await this.usedTagsStream().forEach((next: ICollectionResponse<ITagData>) => {
      usedTags = [...usedTags, ...next.Data];
    });

    console.log(`Loaded ${usedTags.length} usedTags`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return usedTags;
  }

  private async loadVoidedTags(dataLoadOptions: IDataLoadOptions = {}): Promise<ITagData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading tags...");

    let voidedTags: ITagData[] = [];

    await this.voidedTagsStream().forEach((next: ICollectionResponse<ITagData>) => {
      voidedTags = [...voidedTags, ...next.Data];
    });

    console.log(`Loaded ${voidedTags.length} voidedTags`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return voidedTags;
  }

  async packageHarvestHistoryByPackageId(packageId: number): Promise<IHarvestHistoryData[]> {
    const page = 0;
    const body = buildBody({ page, pageSize: DATA_LOAD_PAGE_SIZE });

    const response = await this.metrcRequestManagerOrError.getPackageHarvestHistory(
      body,
      packageId,
      3000
    );

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IHarvestHistoryData> = await response.json();

    return responseData.Data;
  }

  async packageHistoryByPackageId(packageId: number): Promise<IPackageHistoryData[]> {
    const page = 0;
    const body = buildBody({ page, pageSize: DATA_LOAD_PAGE_SIZE });

    const response = await this.metrcRequestManagerOrError.getPackageHistory(body, packageId);

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<IPackageHistoryData> = await response.json();

    return responseData.Data;
  }

  async transferHistoryByOutGoingTransferId(
    manifestNumber: number
  ): Promise<ITransferHistoryData[]> {
    const page = 0;
    const body = buildBody({ page, pageSize: DATA_LOAD_PAGE_SIZE });

    const response = await this.metrcRequestManagerOrError.getTransferHistory(
      body,
      manifestNumber,
      3000
    );

    if (response.status !== 200) {
      throw new Error("Request failed");
    }

    const responseData: ICollectionResponse<ITransferHistoryData> = await response.json();

    return responseData.Data;
  }

  /**
   *
   * Deprecated methods
   *
   */

  private async loadAllPreviousTagOrders(): Promise<ITagOrderData[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading tag orders...");

    let previousTagOrders: ITagOrderData[] = [];

    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getTagOrderHistory(body);
    };

    const subject = streamFactory<ITagOrderData>({}, responseFactory);

    await subject.forEach((next: ICollectionResponse<ITagOrderData>) => {
      previousTagOrders = [...previousTagOrders, ...next.Data];
    });

    console.log(`Loaded ${previousTagOrders.length} previous tag orders`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return previousTagOrders;
  }

  async loadAllCsvUploads(csvUpload: CsvUpload): Promise<ICsvUploadResult[]> {
    await authManager.authStateOrError();

    store.commit(MutationType.SET_LOADING_MESSAGE, "Loading csv uploads...");

    let csvUploads: ICsvUploadResult[] = [];

    const responseFactory = (paginationOptions: IPaginationOptions): Promise<Response> => {
      const body = buildBody(paginationOptions);

      return this.metrcRequestManagerOrError.getDataImportHistory(body, csvUpload);
    };

    const subject = streamFactory<ICsvUploadResult>({}, responseFactory);

    await subject.forEach((next: ICollectionResponse<ICsvUploadResult>) => {
      csvUploads = [...csvUploads, ...next.Data];
    });

    console.log(`Loaded ${csvUploads.length} csv uploads`);

    store.commit(MutationType.SET_LOADING_MESSAGE, null);

    return csvUploads;
  }

  /**
   *
   * End deprecated methods
   *
   */
}

export let primaryDataLoader = new DataLoader();
