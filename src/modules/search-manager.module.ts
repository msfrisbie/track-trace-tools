import {
  IAtomicService,
  IIndexedPackageData,
  IIndexedPlantData,
  ITransferData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
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
  public selectedPackage: BehaviorSubject<ISelectedPackageMetadata | null> =
    new BehaviorSubject<ISelectedPackageMetadata | null>(null);
  public selectedPlant: BehaviorSubject<ISelectedPlantMetadata | null> =
    new BehaviorSubject<ISelectedPlantMetadata | null>(null);
  public packageSearchVisibility: BehaviorSubject<{
    showPackageSearchResults: boolean;
  }> = new BehaviorSubject<{
    showPackageSearchResults: boolean;
  }>({ showPackageSearchResults: false });

  public transferSearchVisibility: BehaviorSubject<{
    showTransferSearchResults: boolean;
  }> = new BehaviorSubject<{
    showTransferSearchResults: boolean;
  }>({ showTransferSearchResults: false });

  public plantSearchVisibility: BehaviorSubject<{
    showPlantSearchResults: boolean;
  }> = new BehaviorSubject<{
    showPlantSearchResults: boolean;
  }>({ showPlantSearchResults: false });

  public plantIndexInFlight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public activePackageIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public inactivePackageIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public inTransitPackageIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  public transferQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public selectedTransfer: BehaviorSubject<ISelectedTransferMetadata | null> =
    new BehaviorSubject<ISelectedTransferMetadata | null>(null);
  public incomingTransferIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public outgoingTransferIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public rejectedTransferIndexInflight: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

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

    this.plantSearchVisibility.next({
      showPlantSearchResults: !!store.state.plantSearch?.showPlantSearchResults,
    });

    this.packageSearchVisibility.next({
      showPackageSearchResults: !!store.state.packageSearch?.showPackageSearchResults,
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

  setTransferSearchVisibility({
    showTransferSearchResults,
  }: {
    showTransferSearchResults: boolean;
  }) {
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
        console.log({ selectedPackage: selectedPackage?.packageData.Label });
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

  mergedPackageIndex() {
    return combineLatest([
      this.activePackageIndexInflight.asObservable(),
      this.inactivePackageIndexInflight.asObservable(),
      this.inTransitPackageIndexInflight.asObservable(),
    ]);
  }

  packageIndexInflight(): Observable<boolean> {
    return this.mergedPackageIndex().pipe(
      map((inflightStatusList: boolean[]) => {
        return inflightStatusList.includes(true);
      })
    );
  }

  packageIndexUpdated(): Observable<boolean> {
    return this.mergedPackageIndex().pipe(
      bufferCount(2, 1),
      map((buffer: boolean[][]) => {
        if (buffer.length !== 2 || buffer[0].length !== buffer[1].length) {
          throw new Error("Something is wrong with mergedPackageIndex tracking");
        }

        let [oldValue, newValue] = buffer;

        // Check that a value went from true -> false
        for (let i = 0; i < oldValue.length; ++i) {
          if (oldValue[i] && !newValue[i]) {
            return true;
          }
        }

        return false;
      })
    );
  }

  async indexPackages() {
    await authManager.authStateOrError();

    // primaryDataLoader calls will generate successive requests,
    // which will be interleaved, delaying the promise resolve.
    // This await ordering forces the requests to be dispatched
    // in the order they were created.
    try {
      this.activePackageIndexInflight.next(true);
      await primaryDataLoader.activePackages();
    } catch (e) {
      console.error(e);
    } finally {
      this.activePackageIndexInflight.next(false);
    }

    try {
      this.inactivePackageIndexInflight.next(true);
      await primaryDataLoader.inactivePackages();
    } catch (e) {
      console.error(e);
    } finally {
      this.inactivePackageIndexInflight.next(false);
    }

    try {
      this.inTransitPackageIndexInflight.next(true);
      await primaryDataLoader.inTransitPackages(true);
    } catch (e) {
      console.error(e);
    } finally {
      this.inTransitPackageIndexInflight.next(false);
    }
  }

  mergedTransferIndex() {
    return combineLatest([
      this.incomingTransferIndexInflight.asObservable(),
      this.outgoingTransferIndexInflight.asObservable(),
      this.rejectedTransferIndexInflight.asObservable(),
    ]);
  }

  transferIndexInflight(): Observable<boolean> {
    return this.mergedTransferIndex().pipe(
      map((inflightStatusList: boolean[]) => {
        return inflightStatusList.includes(true);
      })
    );
  }

  transferIndexUpdated(): Observable<boolean> {
    return this.mergedTransferIndex().pipe(
      bufferCount(2, 1),
      map((buffer: boolean[][]) => {
        if (buffer.length !== 2 || buffer[0].length !== buffer[1].length) {
          throw new Error("Something is wrong with mergedTransferIndex tracking");
        }

        let [oldValue, newValue] = buffer;

        // Check that a value went from true -> false
        for (let i = 0; i < oldValue.length; ++i) {
          if (oldValue[i] && !newValue[i]) {
            return true;
          }
        }

        return false;
      })
    );
  }

  async indexTransfers() {
    await authManager.authStateOrError();

    // primaryDataLoader calls will generate successive requests,
    // which will be interleaved, delaying the promise resolve.
    // This await ordering forces the requests to be dispatched
    // in the order they were created.
    try {
      this.incomingTransferIndexInflight.next(true);
      await primaryDataLoader.incomingTransfers(true);
    } catch (e) {
      console.error(e);
    } finally {
      this.incomingTransferIndexInflight.next(false);
    }

    try {
      this.outgoingTransferIndexInflight.next(true);
      await primaryDataLoader.outgoingTransfers(true);
    } catch (e) {
      console.error(e);
    } finally {
      this.outgoingTransferIndexInflight.next(false);
    }

    try {
      this.rejectedTransferIndexInflight.next(true);
      await primaryDataLoader.rejectedTransfers(true);
    } catch (e) {
      console.error(e);
    } finally {
      this.rejectedTransferIndexInflight.next(false);
    }
  }
}

export let searchManager = new SearchManager();
