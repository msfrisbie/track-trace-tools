import {
  IAtomicService,
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedTagData,
  ITagData,
  ITransferData,
} from "@/interfaces";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { BehaviorSubject } from "rxjs";
import { take } from "rxjs/operators";

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

export interface ISelectedTagMetadata {
  tagData: ITagData;
  sectionName: string;
  priority: number;
}

// let timeoutId: any = null;

class SearchManager implements IAtomicService {
  public plantQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");	
  public packageQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");	
  public transferQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public tagQueryString: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public selectedPackage: BehaviorSubject<ISelectedPackageMetadata | null> =
    new BehaviorSubject<ISelectedPackageMetadata | null>(null);
  public selectedPlant: BehaviorSubject<ISelectedPlantMetadata | null> =
    new BehaviorSubject<ISelectedPlantMetadata | null>(null);
  public selectedTransfer: BehaviorSubject<ISelectedTransferMetadata | null> =
    new BehaviorSubject<ISelectedTransferMetadata | null>(null);
  public selectedTag: BehaviorSubject<ISelectedTagMetadata | null> =
    new BehaviorSubject<ISelectedTagMetadata | null>(null);

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
  public tagSearchVisibility: BehaviorSubject<{
    showTagSearchResults: boolean;
  }> = new BehaviorSubject<{
    showTagSearchResults: boolean;
  }>({ showTagSearchResults: false });

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
    
    this.tagSearchVisibility.subscribe(
      ({ showTagSearchResults }: { showTagSearchResults: boolean }) => {
        store.dispatch(`tagSearch/${TagSearchActions.SET_SHOW_TAG_SEARCH_RESULTS}`, {
          showTagSearchResults,
        });
      }
    );

    this.packageSearchVisibility.next({
      showPackageSearchResults: !!store.state.packageSearch.showPackageSearchResults,
    });
    this.plantSearchVisibility.next({
      showPlantSearchResults: !!store.state.plantSearch.showPlantSearchResults,
    });
    this.transferSearchVisibility.next({
      showTransferSearchResults: !!store.state.transferSearch.showTransferSearchResults,
    });
    this.tagSearchVisibility.next({
      showTagSearchResults: !!store.state.tagSearch.showTagSearchResults,
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
  
  setTagSearchVisibility({ showTagSearchResults }: { showTagSearchResults: boolean }) {
    this.tagSearchVisibility.next({ showTagSearchResults });
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
  

  maybeInitializeSelectedTag(
    tagData: IIndexedTagData,
    sectionName: string,
    priority: number
  ) {
    this.selectedTag
      .asObservable()
      .pipe(take(1))
      .subscribe((selectedTag) => {
        if (!selectedTag || priority <= selectedTag.priority) {
          this.selectedTag.next({ tagData, sectionName, priority });
        }
      });
  }
}

export let searchManager = new SearchManager();
