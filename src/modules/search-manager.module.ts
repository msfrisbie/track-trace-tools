import {
  IAtomicService,
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedTagData,
  ITagData,
  ITransferData,
} from "@/interfaces";
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
  public queryString: BehaviorSubject<string> = new BehaviorSubject<string>("");

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

  // public packageSearchVisibility: BehaviorSubject<{
  //   showSearchResults: boolean;
  // }> = new BehaviorSubject<{
  //   showSearchResults: boolean;
  // }>({ showSearchResults: false });
  // public plantSearchVisibility: BehaviorSubject<{
  //   showSearchResults: boolean;
  // }> = new BehaviorSubject<{
  //   showSearchResults: boolean;
  // }>({ showSearchResults: false });
  // public transferSearchVisibility: BehaviorSubject<{
  //   showSearchResults: boolean;
  // }> = new BehaviorSubject<{
  //   showSearchResults: boolean;
  // }>({ showSearchResults: false });
  // public tagSearchVisibility: BehaviorSubject<{
  //   showSearchResults: boolean;
  // }> = new BehaviorSubject<{
  //   showSearchResults: boolean;
  // }>({ showSearchResults: false });

  async init() {
    // this.plantSearchVisibility.subscribe(
    //   ({ showSearchResults }: { showSearchResults: boolean }) => {
    //     store.dispatch(`plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`, {
    //       showSearchResults,
    //     });
    //   }
    // );
    // this.packageSearchVisibility.subscribe(
    //   ({ showSearchResults }: { showSearchResults: boolean }) => {
    //     store.dispatch(`packageSearch/${PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS}`, {
    //       showSearchResults,
    //     });
    //   }
    // );
    // this.transferSearchVisibility.subscribe(
    //   ({ showSearchResults }: { showSearchResults: boolean }) => {
    //     store.dispatch(`transferSearch/${TransferSearchActions.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, {
    //       showSearchResults,
    //     });
    //   }
    // );
    // this.tagSearchVisibility.subscribe(({ showSearchResults }: { showSearchResults: boolean }) => {
    //   store.dispatch(`tagSearch/${TagSearchActions.SET_SHOW_TAG_SEARCH_RESULTS}`, {
    //     showSearchResults,
    //   });
    // });
    // this.packageSearchVisibility.next({
    //   showSearchResults: !!store.state.packageSearch.showSearchResults,
    // });
    // this.plantSearchVisibility.next({
    //   showSearchResults: !!store.state.plantSearch.showSearchResults,
    // });
    // this.transferSearchVisibility.next({
    //   showSearchResults: !!store.state.transferSearch.showSearchResults,
    // });
    // this.tagSearchVisibility.next({
    //   showSearchResults: !!store.state.tagSearch.showSearchResults,
    // });
  }

  // setPlantSearchVisibility({ showSearchResults }: { showSearchResults: boolean }) {
  //   this.plantSearchVisibility.next({ showSearchResults });
  // }

  // setPackageSearchVisibility({ showSearchResults }: { showSearchResults: boolean }) {
  //   this.packageSearchVisibility.next({ showSearchResults });
  // }

  // setTransferSearchVisibility({ showSearchResults }: { showSearchResults: boolean }) {
  //   this.transferSearchVisibility.next({ showSearchResults });
  // }

  // setTagSearchVisibility({ showSearchResults }: { showSearchResults: boolean }) {
  //   this.tagSearchVisibility.next({ showSearchResults });
  // }

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

  maybeInitializeSelectedTag(tagData: IIndexedTagData, sectionName: string, priority: number) {
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
