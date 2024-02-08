import { IdbKeyPiece } from "@/consts";
import {
  IAdjustPackageReason,
  IAtomicService,
  IItemCategory,
  IMetrcDriverData,
  IMetrcFacilityData,
  IMetrcTransferType,
  IMetrcVehicleData,
  IPlantBatchGrowthPhase,
  IPlantBatchType,
  IRemediatePackageMethod,
  ITagData,
  IUnitOfMeasure,
  IWasteMethod,
  IWasteReason,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { mockDataManager } from "@/modules/mock-data-manager.module";
import store from "@/store/page-overlay/index";
import { debugLogFactory } from "@/utils/debug";
import { ExtractionType, extract } from "@/utils/html";
import { AxiosResponse } from "axios";
import { get, keys, set } from "idb-keyval";
import _ from "lodash-es";
import { timer } from "rxjs";
import { primaryDataLoader } from "./data-loader/data-loader.module";

const DYNAMIC_CONST_TIMEOUT_MS = 30000;

const TRANSFER_MODAL_HTML_EXPIRATION_MS: number = 1000 * 60 * 60 * 24;

const DEFAULT_UNITS_OF_MEASURE: IUnitOfMeasure[] = [
  {
    Id: 1,
    IsBaseUnit: true,
    QuantityType: "CountBased",
    Name: "Each",
    Abbreviation: "ea",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 7,
    IsBaseUnit: true,
    QuantityType: "VolumeBased",
    Name: "Fluid Ounces",
    Abbreviation: "fl oz",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 8,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Gallons",
    Abbreviation: "gal",
    FromBaseFactor: 0.0078125,
    ToBaseFactor: 128,
    IsArchived: false,
  },
  {
    Id: 4,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Grams",
    Abbreviation: "g",
    FromBaseFactor: 28.349523125,
    ToBaseFactor: 0.035273961949580414,
    IsArchived: false,
  },
  {
    Id: 6,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Kilograms",
    Abbreviation: "kg",
    FromBaseFactor: 0.028349523125,
    ToBaseFactor: 35.27396194958041,
    IsArchived: false,
  },
  {
    Id: 9,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Liters",
    Abbreviation: "l",
    FromBaseFactor: 0.0295735295625,
    ToBaseFactor: 33.814022701842994,
    IsArchived: false,
  },
  {
    Id: 5,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Milligrams",
    Abbreviation: "mg",
    FromBaseFactor: 28349.523125,
    ToBaseFactor: 0.00003527396194958041,
    IsArchived: false,
  },
  {
    Id: 10,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Milliliters",
    Abbreviation: "ml",
    FromBaseFactor: 29.5735295625,
    ToBaseFactor: 0.033814022701843,
    IsArchived: false,
  },
  {
    Id: 2,
    IsBaseUnit: true,
    QuantityType: "WeightBased",
    Name: "Ounces",
    Abbreviation: "oz",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 11,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Pints",
    Abbreviation: "pt",
    FromBaseFactor: 0.0625,
    ToBaseFactor: 16,
    IsArchived: false,
  },
  {
    Id: 3,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Pounds",
    Abbreviation: "lb",
    FromBaseFactor: 0.0625,
    ToBaseFactor: 16,
    IsArchived: false,
  },
  {
    Id: 12,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Quarts",
    Abbreviation: "qt",
    FromBaseFactor: 0.03125,
    ToBaseFactor: 32,
    IsArchived: false,
  },
];

interface ICreateItemRepeaterData {
  ItemCategories: IItemCategory[];
  UnitsOfMeasure: IUnitOfMeasure[];
}

interface IWasteByLocationRepeaterData {
  PlantWasteMethods: IWasteMethod[];
  ActionReasons: IWasteReason[];
}

interface IAdjustPackageRepeaterData {
  ActionReasons: IAdjustPackageReason[];
}

interface IRemediatePackageRepeaterData {
  RemediationMethods: IRemediatePackageMethod[];
}

interface ICreatePlantingsFromPackageRepeaterData {
  PlantBatchTypes: IPlantBatchType[];
}

interface IChangePlantBatchGrowthPhaseRepeaterData {
  GrowthPhases: IPlantBatchGrowthPhase[];
  GroupTags: [
    {
      Tags: ITagData[];
    }
  ];
}

interface IMovePackageRepeaterData {}

// CreateStrain doesn't actually contain anything interesting
interface ICreateStrainRepeaterData {}

interface INewTransferRepeaterData {
  Adding: boolean;
  DefaultPhoneNumberForQuestions: string;
  Details: null;
  DestinationFacilities: number[];
  TransporterFacilities: number[];
  Drivers: IMetrcDriverData[];
  Vehicles: IMetrcVehicleData[];
  Facilities: { [key: string]: IMetrcFacilityData };
  TransferTypes: IMetrcTransferType[];
}

const debugLog = debugLogFactory("dynamic-consts-manager.module.ts");

class DynamicConstsManager implements IAtomicService {
  private _newTransferModalText: Promise<string> | null = null;

  private _newPackageModalText: Promise<string> | null = null;

  private _movePackageRepeaterdata: Promise<any> | null = null;

  private _createItemRepeaterData: Promise<any> | null = null;

  private _createStrainRepeaterData: Promise<any> | null = null;

  private _wasteByLocationRepeaterData: Promise<any> | null = null;

  private _adjustPackageRepeaterData: Promise<any> | null = null;

  private _remediatePackageRepeaterData: Promise<any> | null = null;

  private _createPlantingsFromPackagesRepeaterData: Promise<any> | null = null;

  private _changePlantBatchGrowthPhaseRepeaterData: Promise<any> | null = null;

  private _newTransferRepeaterData: Promise<any> | null = null;

  private _cachedParsedTemplateRepeaterData: any = null;

  private _cachedFacilities: IMetrcFacilityData[] | null = null;

  private _cachedFacilityMap: Map<string, IMetrcFacilityData> | null = null;

  private _cachedDestinationFacilities: IMetrcFacilityData[] | null = null;

  private _cachedTransportFacilities: IMetrcFacilityData[] | null = null;

  async init() {
    // Allow 5s for the page to settle down
    await timer(5000).toPromise();

    // Eagerly load pages
    this.createItemRepeaterData();
  }

  private async licenseKey(key: IdbKeyPiece) {
    const authState = await authManager.authStateOrError();

    return `${key}_${authState.license}`;
  }

  private async movePackageRepeaterData(): Promise<IMovePackageRepeaterData> {
    if (!this._movePackageRepeaterdata) {
      this._movePackageRepeaterdata = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Item categories fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getMovePackagesHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("movePackageRepeaterdata: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._movePackageRepeaterdata = null;
        }
      });
    }

    return this._movePackageRepeaterdata;
  }

  private async createItemRepeaterData(): Promise<ICreateItemRepeaterData> {
    if (!this._createItemRepeaterData) {
      this._createItemRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Item categories fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getNewItemHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("createItemRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._createItemRepeaterData = null;
        }
      });
    }

    return this._createItemRepeaterData;
  }

  private async createStrainRepeaterData(): Promise<ICreateStrainRepeaterData> {
    if (!this._createStrainRepeaterData) {
      this._createStrainRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Strain categories fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getNewStrainHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("createStrainRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._createStrainRepeaterData = null;
        }
      });
    }

    return this._createStrainRepeaterData;
  }

  private async wasteByLocationRepeaterData(): Promise<IWasteByLocationRepeaterData> {
    if (!this._wasteByLocationRepeaterData) {
      this._wasteByLocationRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Item categories fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getWasteByLocationHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("wasteByLocationRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._wasteByLocationRepeaterData = null;
        }
      });
    }

    return this._wasteByLocationRepeaterData;
  }

  private async adjustPackageRepeaterData(): Promise<IAdjustPackageRepeaterData> {
    if (!this._adjustPackageRepeaterData) {
      this._adjustPackageRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Adjust package fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getAdjustPackageHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("adjustPackageRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._adjustPackageRepeaterData = null;
        }
      });
    }

    return this._adjustPackageRepeaterData;
  }

  private async remediatePackageRepeaterData(): Promise<IRemediatePackageRepeaterData> {
    if (!this._remediatePackageRepeaterData) {
      this._remediatePackageRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Remediate package fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getRemediatePackageHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error("remediatePackageRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._remediatePackageRepeaterData = null;
        }
      });
    }

    return this._remediatePackageRepeaterData;
  }

  private async createPlantingsFromPackageRepeaterData(): Promise<ICreatePlantingsFromPackageRepeaterData> {
    if (!this._createPlantingsFromPackagesRepeaterData) {
      this._createPlantingsFromPackagesRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Create plantings fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getCreatePlantingsFromPackageHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error(
              "createPlantingsFromPackageRepeaterData: Failed to extract repeaterData"
            );
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._createPlantingsFromPackagesRepeaterData = null;
        }
      });
    }

    return this._createPlantingsFromPackagesRepeaterData;
  }

  private async changePlantBatchGrowthPhaseRepeaterData(
    allowCache: boolean = true
  ): Promise<IChangePlantBatchGrowthPhaseRepeaterData> {
    if (!this._changePlantBatchGrowthPhaseRepeaterData || !allowCache) {
      this._changePlantBatchGrowthPhaseRepeaterData = new Promise(async (resolve, reject) => {
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS).subscribe(() =>
          reject("Change plant batch growth phase fetch timed out")
        );

        try {
          const html = await primaryMetrcRequestManager
            .getChangePlantBatchGrowthPhaseHTML()
            .then((response) => response.data);

          const extractedData = extract(ExtractionType.REPEATER_DATA, html);

          const parsedRepeaterData = extractedData?.repeaterData?.parsedRepeaterData;

          if (!parsedRepeaterData) {
            throw new Error(
              "changePlantBatchGrowthPhaseRepeaterData: Failed to extract repeaterData"
            );
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._changePlantBatchGrowthPhaseRepeaterData = null;
        }
      });
    }

    return this._changePlantBatchGrowthPhaseRepeaterData;
  }

  private async isNewTransferModalCached(): Promise<boolean> {
    const currentKeys = await keys();

    const htmlKey = await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML);

    const isCached = currentKeys.includes(htmlKey);

    debugLog(async () => ["isCached", isCached]);

    return isCached;
  }

  private async isNewTransferModalCacheExpired(): Promise<boolean> {
    const now = Date.now();

    const expirationKey = await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP);

    const transferTimestamp: number = (await get(expirationKey)) as number;

    const isExpired =
      !transferTimestamp || now - transferTimestamp > TRANSFER_MODAL_HTML_EXPIRATION_MS;

    debugLog(async () => ["isExpired", isExpired]);

    return isExpired;
  }

  // There should only ever be a single request.
  private async newTransferModalRequest() {
    if (!this._newTransferModalText) {
      debugLog(async () => ["Sending transfer modal request"]);

      // toastManager.openToast(
      //   "T3 is storing the New Transfer form so it can be reused. The page may be slow for a few seconds.",
      //   {
      //     title: "Loading transfer data",
      //     autoHideDelay: 5000,
      //     variant: "primary",
      //     appendToast: true,
      //     toaster: "ttt-toaster",
      //     solid: true,
      //   }
      // );

      this._newTransferModalText = primaryMetrcRequestManager
        .getNewTransferHTML()
        .then((response: AxiosResponse) => response.data);
    }

    return this._newTransferModalText;
  }

  // There should only ever be a single request.
  private async newPackageModalRequest() {
    if (!this._newPackageModalText) {
      debugLog(async () => ["Sending package modal request"]);
      this._newPackageModalText = primaryMetrcRequestManager
        .getNewPackageHTML()
        .then((response: AxiosResponse) => response.data);
    }

    return this._newPackageModalText;
  }

  // This should use a shared promise to indicate inflight load
  async transferTemplateHTML(): Promise<string> {
    // if (clientBuildManager.clientConfig?.overrides?.transferTemplateHtmlUrl) {
    //   return clientBuildManager.clientConfig.overrides.transferTemplateHtmlUrl;
    // }

    return this.newTransferModalRequest();

    // Caching is no longer required since packages are lazy-loaded
    //
    // // If it's expired but cached, return the cache and refetch
    // if (await this.isNewTransferModalCached()) {
    //   this.refreshNewTransferModalCacheIfExpired();
    // } else {
    //   // Not cached, must fetch in real time
    //   await this.refreshTransferTemplateHTMLCache();
    // }

    // const htmlKey = await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML);

    // return get(htmlKey) as Promise<string>;
  }

  private async refreshNewTransferModalCacheIfExpired() {
    if (await this.isNewTransferModalCacheExpired()) {
      // Trigger a refresh, but don't wait for it
      this.refreshTransferTemplateHTMLCache();
    }
  }

  private async refreshTransferTemplateHTMLCache() {
    debugLog(async () => ["refreshing cache"]);

    const html = await this.newTransferModalRequest();

    const htmlKey = await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML);
    const expirationKey = await this.licenseKey(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP);

    await set(htmlKey, html);
    await set(expirationKey, Date.now());

    this._newTransferModalText = null;

    return html;
  }

  private async newTransferRepeaterData(): Promise<INewTransferRepeaterData> {
    if (!this._newTransferRepeaterData) {
      this._newTransferRepeaterData = new Promise(async (resolve, reject) => {
        // This payload is huge, double the allowed timeout
        const subscription = timer(DYNAMIC_CONST_TIMEOUT_MS * 2).subscribe(() =>
          reject("New transfer fetch timed out")
        );

        try {
          let parsedRepeaterData;

          // The cost of loading the HTML from indexeDB and re-parsing it is huge,
          // cache the result in memory
          if (this._cachedParsedTemplateRepeaterData) {
            parsedRepeaterData = this._cachedParsedTemplateRepeaterData;
          } else {
            const html = await this.transferTemplateHTML();

            const extractedData = extract(ExtractionType.REPEATER_DATA, html);

            parsedRepeaterData = _.cloneDeep(extractedData?.repeaterData?.parsedRepeaterData);

            this._cachedParsedTemplateRepeaterData = parsedRepeaterData;
          }

          if (!parsedRepeaterData) {
            throw new Error("newTransferRepeaterData: Failed to extract repeaterData");
          }

          subscription.unsubscribe();
          resolve(parsedRepeaterData);
        } catch (e) {
          subscription.unsubscribe();
          reject(e);
          this._newTransferRepeaterData = null;
        }
      });
    }

    return this._newTransferRepeaterData;
  }

  async itemCategories(): Promise<IItemCategory[]> {
    const repeaterData = await this.createItemRepeaterData();

    if (repeaterData.ItemCategories) {
      return repeaterData.ItemCategories;
    }

    throw new Error("Item categories unable to load");
  }

  async unitsOfMeasure(): Promise<IUnitOfMeasure[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockUnitsOfMeasure.enabled) {
      return mockDataManager.mockUnitsOfMeasure();
    }

    try {
      const repeaterData = await this.createItemRepeaterData();

      if (repeaterData.UnitsOfMeasure) {
        return repeaterData.UnitsOfMeasure;
      }

      throw new Error("Unable to match units");
    } catch {
      return DEFAULT_UNITS_OF_MEASURE;
    }

    // throw new Error('Units of measure unable to load');
  }

  async unitsOfWeight(): Promise<IUnitOfMeasure[]> {
    return (await this.unitsOfMeasure())
      .filter((unitOfMeasure) =>
        ["Pounds", "Grams", "Kilograms", "Milligrams", "Ounces"].includes(unitOfMeasure.Name)
      )
      .sort((a, b) => (a.Name === "Pounds" ? -1 : 1));
  }

  async wasteReasons(): Promise<IWasteReason[]> {
    const repeaterData = await this.wasteByLocationRepeaterData();

    if (repeaterData.ActionReasons) {
      return repeaterData.ActionReasons;
    }

    throw new Error("Waste reasons unable to load");
  }

  async wasteMethods(): Promise<IWasteMethod[]> {
    const repeaterData = await this.wasteByLocationRepeaterData();

    if (repeaterData.PlantWasteMethods) {
      return repeaterData.PlantWasteMethods;
    }

    throw new Error("Waste methods unable to load");
  }

  async adjustPackageReasons(): Promise<IAdjustPackageReason[]> {
    const repeaterData = await this.adjustPackageRepeaterData();

    if (repeaterData.ActionReasons) {
      return repeaterData.ActionReasons;
    }

    throw new Error("Adjust package reasons unable to load");
  }

  async remediatePackageMethods(): Promise<IRemediatePackageMethod[]> {
    const repeaterData = await this.remediatePackageRepeaterData();

    if (repeaterData.RemediationMethods) {
      return repeaterData.RemediationMethods;
    }

    throw new Error("Remediate package methods unable to load");
  }

  async plantBatchTypes(): Promise<IPlantBatchType[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockPlantBatchTypes.enabled) {
      return mockDataManager.mockPlantBatchTypes();
    }

    const repeaterData = await this.createPlantingsFromPackageRepeaterData();

    if (repeaterData.PlantBatchTypes) {
      return repeaterData.PlantBatchTypes;
    }

    throw new Error("Plant batch types unable to load");
  }

  async availablePlantTags(): Promise<ITagData[]> {
    const repeaterData = await this.changePlantBatchGrowthPhaseRepeaterData(false);

    if (repeaterData.GroupTags) {
      // Force sort, since who knows what Metrc is returning
      return repeaterData.GroupTags[0].Tags.sort((a, b) => a.Label.localeCompare(b.Label));
    }

    throw new Error("Growth phase tags unable to load");
  }

  async plantBatchGrowthPhases(): Promise<IPlantBatchGrowthPhase[]> {
    if (
      store.state.mockDataMode &&
      store.state.flags?.mockedFlags.mockPlantBatchGrowthPhases.enabled
    ) {
      return mockDataManager.mockPlantBatchGrowthPhases();
    }

    const repeaterData = await this.changePlantBatchGrowthPhaseRepeaterData();

    if (repeaterData.GrowthPhases) {
      return repeaterData.GrowthPhases;
    }

    throw new Error("Plant batch growth phases unable to load");
  }

  async defaultPhoneNumberForQuestions(): Promise<string> {
    if (
      store.state.mockDataMode &&
      store.state.flags?.mockedFlags.mockDefaultPhoneNumberForQuestions.enabled
    ) {
      return mockDataManager.mockDefaultPhoneNumberForQuestions();
    }

    const repeaterData = await this.newTransferRepeaterData();

    // If it's not present, that's OK - just return an empty string
    return repeaterData.DefaultPhoneNumberForQuestions || "";
  }

  async facilityUsesLocationForPackages(): Promise<boolean> {
    if (
      store.state.mockDataMode &&
      store.state.flags?.mockedFlags.mockFacilityUsesLocationForPackages.enabled
    ) {
      return mockDataManager.mockFacilityUsesLocationForPackages();
    }

    try {
      const packages = [
        ...(await primaryDataLoader.activePackageSample()),
        ...(await primaryDataLoader.inactivePackageSample()),
      ];

      if (packages.length > 0) {
        return packages[0].LocationName !== null;
      }

      return primaryMetrcRequestManager
        .getPackagesHTML()
        .then((response) => response.data)
        .then((body: string) => body.includes("Change Locations"));
    } catch (e) {
      console.error(e);
      // Worst case, we show the location picker when it's not needed.
      // The API ignores the location field, so we assume this behavior
      // is mirrored for the web.
      return true;
    }

    // This is a much slower implementation
    //   const div = document.createElement("div");
    //   div.innerHTML = await this.newPackageModalRequest();

    //   const labels: string[] = [...div.querySelectorAll(".control-label")].map((x: any) =>
    //     x.innerText.trim()
    //   );

    //   debugLog(async () => [{ labels }]);

    //   const hasLocationLabel = labels.indexOf("Location") > -1;

    //   debugLog(async () => [{ hasLocationLabel }]);

    //   return hasLocationLabel;
  }

  async facilities(): Promise<IMetrcFacilityData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockFacilities.enabled) {
      return mockDataManager.mockFacilities();
    }

    if (!this._cachedFacilities) {
      this._cachedFacilities = [
        ...(await primaryDataLoader.transferTransporterFacilities()),
        ...(await primaryDataLoader.transferDestinationFacilities()),
      ];
    }

    return this._cachedFacilities;
  }

  async facilityMap(): Promise<Map<string, IMetrcFacilityData>> {
    if (!this._cachedFacilityMap) {
      const facilities = await this.facilities();

      this._cachedFacilityMap = new Map<string, IMetrcFacilityData>(
        facilities.map((facility) => [facility.LicenseNumber, facility])
      );
    }

    return this._cachedFacilityMap;
  }

  async destinationFacilities(): Promise<IMetrcFacilityData[]> {
    if (
      store.state.mockDataMode &&
      store.state.flags?.mockedFlags.mockDestinationFacilities.enabled
    ) {
      return mockDataManager.mockDestinationFacilities();
    }

    if (!this._cachedDestinationFacilities) {
      const repeaterData = await this.newTransferRepeaterData();

      if (repeaterData.Facilities) {
        const destinationIds: Set<number> = new Set(repeaterData.DestinationFacilities);

        this._cachedDestinationFacilities = (await this.facilities()).filter(
          (facilityData: IMetrcFacilityData) => destinationIds.has(facilityData.Id)
        );
      } else {
        throw new Error("Destination facilities unable to load");
      }
    }

    return this._cachedDestinationFacilities;
  }

  async transporterFacilities(): Promise<IMetrcFacilityData[]> {
    if (
      store.state.mockDataMode &&
      store.state.flags?.mockedFlags.mockTransporterFacilities.enabled
    ) {
      return mockDataManager.mockTransporterFacilities();
    }

    if (!this._cachedTransportFacilities) {
      const repeaterData = await this.newTransferRepeaterData();

      if (repeaterData.Facilities) {
        const transporterIds: Set<number> = new Set(repeaterData.TransporterFacilities);

        this._cachedTransportFacilities = (await this.facilities()).filter(
          (facilityData: IMetrcFacilityData) => transporterIds.has(facilityData.Id)
        );
      } else {
        throw new Error("Transporter facilities unable to load");
      }
    }

    return this._cachedTransportFacilities;
  }

  async transferTypes(): Promise<IMetrcTransferType[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockTransferTypes.enabled) {
      return mockDataManager.mockTransferTypes();
    }

    const repeaterData = await this.newTransferRepeaterData();

    if (repeaterData.TransferTypes) {
      return repeaterData.TransferTypes;
    }

    throw new Error("Transfer types unable to load");
  }

  async drivers(): Promise<IMetrcDriverData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockDrivers.enabled) {
      return mockDataManager.mockDrivers();
    }

    const repeaterData = await this.newTransferRepeaterData();

    console.log({ repeaterData });

    if (repeaterData.Drivers) {
      return repeaterData.Drivers;
    }

    throw new Error("Drivers unable to load");
  }

  async vehicles(): Promise<IMetrcVehicleData[]> {
    if (store.state.mockDataMode && store.state.flags?.mockedFlags.mockVehicles.enabled) {
      return mockDataManager.mockVehicles();
    }

    const repeaterData = await this.newTransferRepeaterData();

    if (repeaterData.Vehicles) {
      return repeaterData.Vehicles;
    }

    throw new Error("Vehicles unable to load");
  }
}

export const dynamicConstsManager = new DynamicConstsManager();
