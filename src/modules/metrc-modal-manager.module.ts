import {
  DOLLAR_NUMBER_REGEX, MessageType, METRC_TAG_REGEX, WEIGHT_NUMBER_REGEX
} from "@/consts";
import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import * as Papa from "papaparse";
import { analyticsManager } from "./analytics-manager.module";
import { toastManager } from "./toast-manager.module";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";
const NEW_LICENSED_TRANSFER_TITLE: string = "New Licensed Transfer";
const EDIT_LICENSED_TRANSFER_TITLE: string = "Edit Licensed Transfer";

const clientKeys: string[] = [
  "CSV_APPLY_BUTTON_ATTRIBUTE",
  "INTERMEDIATE_CSV_ATTRIBUTE",
  "TTT_CONTAINER_ATTRIBUTE",
  "DESTINATION_SELECTOR",
  "PACKAGE_ROW_SELECTOR",
  "UPLOAD_CSV_INPUT_SELECTOR",
  "CSV_INPUT_CONTAINER_SELECTOR",
  "PACKAGE_TAG_INPUT_SELECTOR",
  "PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR",
  "PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR",
  "PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR",
];

class MetrcModalManager implements IAtomicService {
  // clientData: IClientConfig | null = clientBuildManager.clientConfig;

  async init() {}

  // Idempotent method that manages the contents of the modal
  // each time the DOM changes
  maybeAddWidgetsAndListenersToModal() {
    try {
      for (const clientKey of clientKeys) {
        if (!store.state.client.values[clientKey]) {
          throw new Error(`Missing client key: ${clientKey}`);
        }
      }
    } catch (e) {
      return;
    }

    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    const modalTitle = modalTitleOrError(modal);

    switch (modalTitle) {
      case NEW_TRANSFER_TITLE:
      case NEW_LICENSED_TRANSFER_TITLE:
      case EDIT_LICENSED_TRANSFER_TITLE:
        const destinations: HTMLElement[] = [
          ...modal.querySelectorAll(store.state.client.values.DESTINATION_SELECTOR),
        ] as HTMLElement[];

        for (const destination of destinations) {
          const csvInputContainer: HTMLElement | null = destination.querySelector(
            store.state.client.values.CSV_INPUT_CONTAINER_SELECTOR
          );

          if (!csvInputContainer) {
            throw new Error("Unable to match CSV input container");
          }

          let tttContainer = csvInputContainer.querySelector(
            `[${store.state.client.values.TTT_CONTAINER_ATTRIBUTE}]`
          );

          if (!tttContainer) {
            tttContainer = document.createElement("div");
            tttContainer.setAttribute(store.state.client.values.TTT_CONTAINER_ATTRIBUTE, "true");
            tttContainer.classList.add("ttt-modal-container");
            csvInputContainer.appendChild(tttContainer);
          }

          const csvInput: HTMLInputElement | null = csvInputContainer.querySelector(
            store.state.client.values.UPLOAD_CSV_INPUT_SELECTOR
          );

          if (!csvInput) {
            throw new Error("Unable to match CSV input");
          }

          let intermediateCsvInput: HTMLInputElement | null = csvInputContainer.querySelector(
            `input[${store.state.client.values.INTERMEDIATE_CSV_ATTRIBUTE}]`
          );

          if (!intermediateCsvInput) {
            intermediateCsvInput = document.createElement("input");
            intermediateCsvInput.setAttribute(
              store.state.client.values.INTERMEDIATE_CSV_ATTRIBUTE,
              "true"
            );
            intermediateCsvInput.setAttribute("type", "file");
            intermediateCsvInput.setAttribute("accept", ".txt,.csv,text/plain,text/csv");
            intermediateCsvInput.setAttribute("multiple", "multiple");
            intermediateCsvInput.style.display = "none";
            intermediateCsvInput.addEventListener("change", () => this.propagateCsv(destination));

            const label = document.createElement("label");
            label.innerText = "SELECT CSVs";
            label.classList.add("btn", "btn-default", "ttt-modal-btn");

            label.appendChild(intermediateCsvInput);

            tttContainer.appendChild(label);
          }

          let applyBtn: HTMLButtonElement | null = csvInputContainer.querySelector(
            `button[${store.state.client.values.CSV_APPLY_BUTTON_ATTRIBUTE}]`
          );

          if (!applyBtn) {
            applyBtn = document.createElement("button");
            applyBtn.setAttribute(store.state.client.values.CSV_APPLY_BUTTON_ATTRIBUTE, "true");
            applyBtn.setAttribute("type", "button");
            applyBtn.classList.add("btn", "btn-default", "ttt-modal-btn");
            applyBtn.innerText = "FILL CSV DATA";
            applyBtn.addEventListener("click", (e) => this.applyTransferCsvData(destination));

            tttContainer.appendChild(applyBtn);
          }

          applyBtn.style.display = "none";

          if (csvInput.files?.length) {
            applyBtn.style.removeProperty("display");
          }
        }

        break;
      default:
        break;
    }
  }

  async getMergedCsvDataOrError(input: HTMLInputElement): Promise<string[][]> {
    if (!input.files) {
      throw new Error("Bad files");
    }

    const mergedRows: string[][] = [];

    for (const f of input.files) {
      const rows: string[][] = await new Promise((resolve, reject) => {
        Papa.parse(f, {
          header: false,
          complete: (results: Papa.ParseResult<string[]>) => {
            const rows: string[][] = results.data.map((x) => x.map((y) => y.trim()));

            resolve(rows);
          },
          error(e) {
            reject(e);
          },
        });
      });

      rows.map((row) => mergedRows.push(row));
    }

    return mergedRows;
  }

  async propagateCsv(destination: HTMLElement) {
    analyticsManager.track(MessageType.CSV_AUTOFILL_UPLOAD);

    for (const clientKey of clientKeys) {
      if (!store.state.client.values[clientKey]) {
        throw new Error(`Missing client key: ${clientKey}`);
      }
    }

    const intermediateCsvInput: HTMLInputElement | null = destination.querySelector(
      `input[${store.state.client.values.INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!intermediateCsvInput || !intermediateCsvInput.files) {
      throw new Error("Cannot find intermediate input");
    }

    const csvInput: HTMLInputElement | null = destination.querySelector(
      store.state.client.values.UPLOAD_CSV_INPUT_SELECTOR
    );

    if (!csvInput) {
      throw new Error("Unable to match CSV input");
    }

    const mergedRows: string[][] = await this.getMergedCsvDataOrError(intermediateCsvInput);

    if (!mergedRows.length) {
      toastManager.openToast(`The CSVs you added are empty.`, {
        title: "CSV Formatting Error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      return;
    }

    let formattingErrorCount = 0;

    for (const [idx, row] of mergedRows.entries()) {
      if (!row[0]) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} is missing a tag value
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      } else if (!row[0].match(METRC_TAG_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid tag
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "danger",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }

      if (!row[1]) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} is missing a weight value
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      } else if (!row[1].match(WEIGHT_NUMBER_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid weight
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }

      if (!row[2]) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} is missing a unit of measure
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      } else if (
        !["Pounds", "Grams", "Kilograms", "Ounces"]
          .map((x) => x.toLocaleLowerCase())
          .includes(row[2].toLocaleLowerCase())
      ) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid weight
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }

      if (!row[3]) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} is missing a wholesale value
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      } else if (!row[3].match(DOLLAR_NUMBER_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid wholesale dollar amount
          
          ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }
    }

    if (formattingErrorCount > 0) {
      toastManager.openToast(`Detected ${formattingErrorCount} CSV formatting errors`, {
        title: "CSV Formatting Error",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    }

    const blob = new Blob([mergedRows.map((row) => row[0]).join("\n")], {
      type: "text/csv",
    });

    const dT = new DataTransfer();
    dT.items.add(new File([blob], "output.csv"));

    csvInput.files = dT.files;

    csvInput.dispatchEvent(new Event("change"));
  }

  async applyTransferCsvData(destination: HTMLElement) {
    analyticsManager.track(MessageType.CSV_AUTOFILL_FILL);

    for (const clientKey of clientKeys) {
      if (!store.state.client.values[clientKey]) {
        throw new Error(`Missing client key: ${clientKey}`);
      }
    }

    const input: HTMLInputElement | null = destination.querySelector(
      `input[${store.state.client.values.INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!input || !input.files) {
      throw new Error("Bad input");
    }

    const mergedRows: string[][] = await this.getMergedCsvDataOrError(input);

    const packages = [
      ...destination.querySelectorAll(store.state.client.values.PACKAGE_ROW_SELECTOR),
    ];

    if (packages.length !== mergedRows.length) {
      toastManager.openToast(
        `Mismatch detected: 
        
        ${packages.length} packages, 
        ${mergedRows.length} CSV rows.
      
        This can occur when a package tag in the CSV is not eligible for transfer`,
        {
          title: "CSV Row Count Error",
          autoHideDelay: 5000,
          variant: "warning",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    }

    let successRowCount = 0;

    for (const pkg of packages) {
      let autofillSuccess = true;

      const packageTagInput: HTMLInputElement | null = pkg.querySelector(
        store.state.client.values.PACKAGE_TAG_INPUT_SELECTOR
      );

      if (!packageTagInput) {
        toastManager.openToast(`Unable to autofill package tag input`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        autofillSuccess = false;

        throw new Error("Could not locate package tag input");
      }

      if (!packageTagInput.value) {
        continue;
      }

      let matchingRow = null;
      for (const row of mergedRows) {
        if (row[0] === packageTagInput.value) {
          matchingRow = row;
          break;
        }
      }

      if (!matchingRow) {
        toastManager.openToast(`Could not match row for ${packageTagInput.value}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        autofillSuccess = false;
        console.error(`Could not match row for ${packageTagInput.value}`);
        continue;
      }

      const grossWeightInput: HTMLInputElement | null = pkg.querySelector(
        store.state.client.values.PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR
      );

      if (grossWeightInput && typeof matchingRow[1] === "string") {
        grossWeightInput.value = matchingRow[1].replace(",", "");
      } else {
        toastManager.openToast(`Could not autofill gross weight input: ${matchingRow[1]}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        autofillSuccess = false;
      }

      const grossUnitOfWeightSelect: HTMLSelectElement | null = pkg.querySelector(
        store.state.client.values.PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR
      );

      if (grossUnitOfWeightSelect) {
        const options = [...grossUnitOfWeightSelect.querySelectorAll("option")];
        let matchingOption = null;
        for (const option of options) {
          if (!matchingRow[2]) {
            break;
          }
          if (
            option.getAttribute("label")?.toLocaleLowerCase() === matchingRow[2].toLocaleLowerCase()
          ) {
            matchingOption = option;
            grossUnitOfWeightSelect.value = option.value;
            grossUnitOfWeightSelect.dispatchEvent(new Event("change"));
            break;
          }
        }

        if (!matchingOption) {
          toastManager.openToast(`Could not autofill unit of measure: ${matchingRow[2]}`, {
            title: "CSV Autofill Error",
            autoHideDelay: 5000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          });
          autofillSuccess = false;
          console.error("Unable to match");
        }
      }

      const wholesalePriceInput: HTMLInputElement | null = pkg.querySelector(
        store.state.client.values.PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR
      );

      if (wholesalePriceInput && typeof matchingRow[3] === "string") {
        wholesalePriceInput.value = matchingRow[3].replace("$", "").replace(",", "");
      } else {
        toastManager.openToast(`Could not autofill wholesale value: ${matchingRow[3]}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        autofillSuccess = false;
      }

      if (autofillSuccess) {
        successRowCount++;
      }
    }

    if (successRowCount === mergedRows.length) {
      toastManager.openToast(
        `Successfully autofilled ${successRowCount} of ${mergedRows.length} rows`,
        {
          title: "CSV Autofill Finished",
          autoHideDelay: 5000,
          variant: "success",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    } else if (successRowCount > 0) {
      toastManager.openToast(
        `Partially autofilled ${successRowCount} of ${mergedRows.length} rows`,
        {
          title: "CSV Autofill Finished",
          autoHideDelay: 5000,
          variant: "warning",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    }
  }
}

export const metrcModalManager = new MetrcModalManager();
