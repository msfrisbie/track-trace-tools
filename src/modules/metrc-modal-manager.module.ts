import { DOLLAR_NUMBER_REGEX, METRC_TAG_REGEX, WEIGHT_NUMBER_REGEX } from "@/consts";
import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import * as Papa from "papaparse";
import { clientBuildManager } from "./client-build-manager.module";
import { toastManager } from "./toast-manager.module";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";

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
    if (!clientBuildManager.clientConfig) {
      return;
    }

    let values;

    try {
      values = clientBuildManager.validateAndGetValuesOrError(clientKeys);
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
        const destinations: HTMLElement[] = [
          ...modal.querySelectorAll(values.DESTINATION_SELECTOR),
        ] as HTMLElement[];

        for (const destination of destinations) {
          const csvInputContainer: HTMLElement | null = destination.querySelector(
            values.CSV_INPUT_CONTAINER_SELECTOR
          );

          if (!csvInputContainer) {
            throw new Error("Unable to match CSV input container");
          }

          let tttContainer = csvInputContainer.querySelector(`[${values.TTT_CONTAINER_ATTRIBUTE}]`);

          if (!tttContainer) {
            tttContainer = document.createElement("div");
            tttContainer.setAttribute(values.TTT_CONTAINER_ATTRIBUTE, "true");
            tttContainer.classList.add("ttt-modal-container");
            csvInputContainer.appendChild(tttContainer);
          }

          const csvInput: HTMLInputElement | null = csvInputContainer.querySelector(
            values.UPLOAD_CSV_INPUT_SELECTOR
          );

          if (!csvInput) {
            throw new Error("Unable to match CSV input");
          }

          let intermediateCsvInput: HTMLInputElement | null = csvInputContainer.querySelector(
            `input[${values.INTERMEDIATE_CSV_ATTRIBUTE}]`
          );

          if (!intermediateCsvInput) {
            intermediateCsvInput = document.createElement("input");
            intermediateCsvInput.setAttribute(values.INTERMEDIATE_CSV_ATTRIBUTE, "true");
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
            `button[${values.CSV_APPLY_BUTTON_ATTRIBUTE}]`
          );

          if (!applyBtn) {
            applyBtn = document.createElement("button");
            applyBtn.setAttribute(values.CSV_APPLY_BUTTON_ATTRIBUTE, "true");
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

    for (let f of input.files) {
      const rows: string[][] = await new Promise((resolve, reject) => {
        Papa.parse(f, {
          header: false,
          complete: (results: Papa.ParseResult<string[]>) => {
            const rows: string[][] = results.data;

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
    const values = clientBuildManager.validateAndGetValuesOrError(clientKeys);

    const intermediateCsvInput: HTMLInputElement | null = destination.querySelector(
      `input[${values.INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!intermediateCsvInput || !intermediateCsvInput.files) {
      throw new Error("Cannot find intermediate input");
    }

    const csvInput: HTMLInputElement | null = destination.querySelector(
      values.UPLOAD_CSV_INPUT_SELECTOR
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
      } else {
        if (!row[0].match(METRC_TAG_REGEX)) {
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
      } else {
        if (!row[1].match(WEIGHT_NUMBER_REGEX)) {
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
      } else {
        if (!["Pounds", "Grams", "Kilograms", "Ounces"].includes(row[2])) {
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
      } else {
        if (!row[3].match(DOLLAR_NUMBER_REGEX)) {
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
    const values = clientBuildManager.validateAndGetValuesOrError(clientKeys);

    const input: HTMLInputElement | null = destination.querySelector(
      `input[${values.INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!input || !input.files) {
      throw new Error("Bad input");
    }

    const mergedRows: string[][] = await this.getMergedCsvDataOrError(input);

    const packages = [...destination.querySelectorAll(values.PACKAGE_ROW_SELECTOR)];

    for (const pkg of packages) {
      const packageTagInput: HTMLInputElement | null = pkg.querySelector(
        values.PACKAGE_TAG_INPUT_SELECTOR
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
        throw new Error("Could not locate package tag input");
      }

      if (!packageTagInput.value) {
        continue;
      }

      let matchingRow = null;
      for (let row of mergedRows) {
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
        console.error(`Could not match row for ${packageTagInput.value}`);
        continue;
      }

      const grossWeightInput: HTMLInputElement | null = pkg.querySelector(
        values.PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR
      );

      if (grossWeightInput) {
        grossWeightInput.value = matchingRow[1].replace(",", "");
      } else {
        toastManager.openToast(`Could not autofill gross weight input ${matchingRow[1]}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }

      const grossUnitOfWeightSelect: HTMLSelectElement | null = pkg.querySelector(
        values.PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR
      );

      if (grossUnitOfWeightSelect) {
        const options = [...grossUnitOfWeightSelect.querySelectorAll("option")];
        let matchingOption = null;
        for (const option of options) {
          if (option.getAttribute("label") === matchingRow[2]) {
            matchingOption = option;
            grossUnitOfWeightSelect.value = option.value;
            break;
          }
        }

        if (!matchingOption) {
          toastManager.openToast(`Could not autofill unit of measure ${matchingRow[2]}`, {
            title: "CSV Autofill Error",
            autoHideDelay: 5000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          });
          console.error("Unable to match");
        }
      }

      const wholesalePriceInput: HTMLInputElement | null = pkg.querySelector(
        values.PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR
      );

      if (wholesalePriceInput && typeof matchingRow[3] !== undefined) {
        wholesalePriceInput.value = matchingRow[3].replace("$", "").replace(",", "");
      } else {
        toastManager.openToast(`Could not autofill wholesale value ${matchingRow[3]}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
