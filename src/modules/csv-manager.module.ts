import { IAtomicService, ICsvFile } from "@/interfaces";
import { serialize } from "@/utils/csv";
import { get } from 'idb-keyval';
import { BehaviorSubject, timer } from "rxjs";
import { authManager } from "./auth-manager.module";
import { primaryDataLoader } from "./data-loader/data-loader.module";

enum CsvSubmitState {
    CHECK_SUBMIT_QUEUE,
    SUBMIT_INFLIGHT,
}

enum MetrcCsvType {
    MOVE_PLANTS = 'MOVE_PLANTS',
    HARVEST_PLANTS = 'HARVEST_PLANTS',
}

enum CsvSubmitStatus {
    PENDING,
    SUCCESS,
    REJECTED, // Metrc did not attempt to import these
    IMPORT_ERROR, // Metrc accepted the file but it failed to import
}

interface ICsvSubmit { status: CsvSubmitStatus, startIdx: number, endIdx: number }

interface ICsvProject {
    csvData: any[][],
    projectType: MetrcCsvType,
    submitQueue: ICsvSubmit[]
}

const CSV_PROJECT_IDB_KEY = 'csv_project';

class CsvManager implements IAtomicService {
    csvSubmitState: BehaviorSubject<CsvSubmitState> = new BehaviorSubject<CsvSubmitState>(CsvSubmitState.CHECK_SUBMIT_QUEUE);

    // csvSubmitQueue: ICsvSubmit[] = [];

    // activeCsvSubmit: ICsvSubmit | null = null;

    activeCsvProject: ICsvProject | null = null;

    async init() {
      const project: string | null | undefined = await get(CSV_PROJECT_IDB_KEY);

      if (project) {
        this.activeCsvProject = JSON.parse(project);
      }

      primaryDataLoader.loadAllCsvUploads("PlantsHarvest");
      // primaryDataLoader.loadLocations();

      // Can only submit on dataimport page
      if (!this.isUserOnDataImportPage) {
        return;
      }

      this.initializeCsvSubmitStateMachine();
    }

    isUserOnDataImportPage(): boolean {
      return window.location.pathname.endsWith('/dataimport');
    }

    async updateProjectQueue() {

    }

    async updateProjectData() {

    }

    async navigateToDataImport() {
      const authState = await authManager.authStateOrError();

      window.location.href = `/industry/${authState.license}/dataimport`;
    }

    private initializeCsvSubmitStateMachine() {
      this.csvSubmitState.subscribe((csvSubmitState: CsvSubmitState) => {
        switch (csvSubmitState) {
          case CsvSubmitState.CHECK_SUBMIT_QUEUE:
            // Select tab
            // start submit
            // set submit as active
            // Page shows current one is empty, successful, or failed
            break;
          case CsvSubmitState.SUBMIT_INFLIGHT:
            // Check if submission is complete
            timer(1000).subscribe(() => {
              //
              this.csvSubmitState.next(CsvSubmitState.CHECK_SUBMIT_QUEUE);
            });
            break;
          default:
            throw new Error('bad CSV state');
        }
      });
    }

    private maybeSelectTabContaining(text: string) {
      const tabs = document.querySelectorAll('li.k-item');

      for (const tab of tabs) {
        // @ts-ignore
        if (tab.innerText === text) {
          if (!tab.classList.contains('k-state-active')) {
            // @ts-ignore
            tab.click();
          }

          break;
        }
      }
    }

    submitMovePlantsCsv(csvFile: ICsvFile) {
      return this.submitCsvImpl(csvFile, 'PlantsLocation', 'input[data-type="PlantsChangeLocation"]');
    }

    submitHarvestPlantsCsv(csvFile: ICsvFile) {

    }

    submitCsvImpl(csvFile: ICsvFile, tabText: string, inputSelector: string) {
      this.maybeSelectTabContaining(tabText);

      const input: HTMLInputElement | null = document.querySelector(inputSelector);

      if (!input) {
        throw new Error('Cannot find input');
      }

      // Firefox < 62 workaround exploiting https://bugzilla.mozilla.org/show_bug.cgi?id=1422655
      const dt = new ClipboardEvent('').clipboardData || new DataTransfer(); // specs compliant (as of March 2018 only Chrome)

      const file = new File([serialize(csvFile.data)], csvFile.filename, {
        type: "text/csv",
      });

      dt.items.add(file);

      input.files = dt.files;

      input.dispatchEvent(new Event('change'));

      const uploadButton: HTMLButtonElement | null = document.querySelector('button.k-upload-selected');

      if (!uploadButton) {
        throw new Error('Cannot find upload button');
      }

      uploadButton.click();

      // document.querySelectorAll('li.k-file-success .k-file-name')[0].innerText
    }
}

export const csvManager = new CsvManager();
