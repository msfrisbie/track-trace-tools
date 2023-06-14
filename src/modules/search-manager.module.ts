import {
  IAtomicService,
  IIndexedPackageData,
  IIndexedPlantData,
  ITransferData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { bufferCount, map, take } from "rxjs/operators";
import { primaryDataLoader } from "./data-loader/data-loader.module";

export interface ISelectedPlantMetadata {
  plantData: IIndexedPlantData;
  sectionName: string;
  priority: number;
}

export interface ISelectedPackageMetadata {
  packageData: IIndexedPackageData;
  sectionName: string;
  priority: number;
}

export interface ISelectedTransferMetadata {
  transferData: ITransferData;
  sectionName: string;
  priority: number;
}

// let timeoutId: any = null;

class SearchManager implements IAtomicService {
  public plantQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public packageQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public transferQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public selectedPackage: BehaviorSubject<ISelectedPackageMetadata | null> =
    new BehaviorSubject<ISelectedPackageMetadata | null>(null);
  public selectedPlant: BehaviorSubject<ISelectedPlantMetadata | null> =
    new BehaviorSubject<ISelectedPlantMetadata | null>(null);
    public selectedTransfer: BehaviorSubject<ISelectedTransferMetadata | null> =
      new BehaviorSubject<ISelectedTransferMetadata | null>(null);

  public packageSearchVisibility: BehaviorSubject<{
    showPackageSearchResults: boolean;
  }> = new BehaviorSubject<{
    showPackageSearchResults: boolean;
  }>({ showPackageSearchResults: false });
  public plantSearchVisibility: BehaviorSubject<{
    showPlantSearchResults: boolean;
  }> = new BehaviorSubject<{
    showPlantSearchResults: boolean;
  }>({ showPlantSearchResults: false });
  public transferSearchVisibility: BehaviorSubject<{
    showTransferSearchResults: boolean;
  }> = new BehaviorSubject<{
    showTransferSearchResults: boolean;
  }>({ showTransferSearchResults: false });

  async init() {
    this.plantSearchVisibility.subscribe(
      ({ showPlantSearchResults }: { showPlantSearchResults: boolean }) => {
        store.dispatch(`plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`, {
          showPlantSearchResults,
        });
      }
    );

    this.packageSearchVisibility.subscribe(
      ({ showPackageSearchResults }: { showPackageSearchResults: boolean }) => {
        store.dispatch(`packageSearch/${PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS}`, {
          showPackageSearchResults,
        });
      }
    );

    this.transferSearchVisibility.subscribe(
      ({ showTransferSearchResults }: { showTransferSearchResults: boolean }) => {
        store.dispatch(`transferSearch/${TransferSearchActions.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, {
          showTransferSearchResults,
        });
      }
    );

    this.packageSearchVisibility.next({
      showPackageSearchResults: !!store.state.packageSearch?.showPackageSearchResults,
    });
    this.plantSearchVisibility.next({
      showPlantSearchResults: !!store.state.plantSearch?.showPlantSearchResults,
    });
    this.transferSearchVisibility.next({
      showTransferSearchResults: !!store.state.transferSearch?.showTransferSearchResults,
    });
  }

  setPlantSearchVisibility({ showPlantSearchResults }: { showPlantSearchResults: boolean }) {
    this.plantSearchVisibility.next({ showPlantSearchResults });
  }

  setPackageSearchVisibility({ showPackageSearchResults }: { showPackageSearchResults: boolean }) {
    this.packageSearchVisibility.next({ showPackageSearchResults });
  }

  setTransferSearchVisibility({ showTransferSearchResults }: { showTransferSearchResults: boolean }) {
    this.transferSearchVisibility.next({ showTransferSearchResults });
  }

  maybeInitializeSelectedPlant(
    plantData: IIndexedPlantData,
    sectionName: string,
    priority: number
  ) {
    this.selectedPlant
      .asObservable()
      .pipe(take(1))
      .subscribe((selectedPlant) => {
        if (!selectedPlant || priority <= selectedPlant.priority) {
          this.selectedPlant.next({ plantData, sectionName, priority });
        }
      });
  }

  maybeInitializeSelectedPackage(
    packageData: IIndexedPackageData,
    sectionName: string,
    priority: number
  ) {
    this.selectedPackage
      .asObservable()
      .pipe(take(1))
      .subscribe((selectedPackage) => {
        if (!selectedPackage || priority <= selectedPackage.priority) {
          this.selectedPackage.next({ packageData, sectionName, priority });
        }
      });
  }

  maybeInitializeSelectedTransfer(
    transferData: ITransferData,
    sectionName: string,
    priority: number
  ) {
    this.selectedTransfer
      .asObservable()
      .pipe(take(1))
      .subscribe((selectedTransfer) => {
        if (!selectedTransfer || priority <= selectedTransfer.priority) {
          this.selectedTransfer.next({ transferData, sectionName, priority });
        }
      });
  }
}

export let searchManager = new SearchManager();
