import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import * as Papa from "papaparse";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";

class MetrcModalManager implements IAtomicService {
  // clientData: IClientConfig | null = clientBuildManager.clientConfig;

  async init() {}

  // Idempotent method that manages the contents of the modal
  // each time the DOM changes
  maybeAddWidgetsAndListenersToModal() {
    console.log("run maybeAddWidgets");
    // TODO check settings
    // TODO debounce
    // TODO check required keys

    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    const modalTitle = modalTitleOrError(modal);

    switch (modalTitle) {
      case NEW_TRANSFER_TITLE:
        const destinations: HTMLElement[] = [
          ...modal.querySelectorAll(DESTINATION_SELECTOR),
        ] as HTMLElement[];

        for (const destination of destinations) {
          const csvInputContainer: HTMLElement | null = destination.querySelector(
            CSV_INPUT_CONTAINER_SELECTOR
          );

          if (!csvInputContainer) {
            throw new Error("Unable to match CSV input container");
          }

          let tttContainer = csvInputContainer.querySelector(`[${TTT_CONTAINER_ATTRIBUTE}]`);

          if (!tttContainer) {
            tttContainer = document.createElement("div");
            tttContainer.setAttribute(TTT_CONTAINER_ATTRIBUTE, "true");
            tttContainer.classList.add("ttt-modal-container");
            csvInputContainer.appendChild(tttContainer);
          }

          const csvInput: HTMLInputElement | null =
            csvInputContainer.querySelector(UPLOAD_CSV_INPUT_SELECTOR);

          if (!csvInput) {
            throw new Error("Unable to match CSV input");
          }

          let intermediateCsvInput: HTMLInputElement | null = csvInputContainer.querySelector(
            `input[${INTERMEDIATE_CSV_ATTRIBUTE}]`
          );

          if (!intermediateCsvInput) {
            intermediateCsvInput = document.createElement("input");
            intermediateCsvInput.setAttribute(INTERMEDIATE_CSV_ATTRIBUTE, "true");
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
            `button[${CSV_APPLY_BUTTON_ATTRIBUTE}]`
          );

          if (!applyBtn) {
            applyBtn = document.createElement("button");
            applyBtn.setAttribute(CSV_APPLY_BUTTON_ATTRIBUTE, "true");
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
    const intermediateCsvInput: HTMLInputElement | null = destination.querySelector(
      `input[${INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!intermediateCsvInput || !intermediateCsvInput.files) {
      throw new Error("Cannot find intermediate input");
    }

    const csvInput: HTMLInputElement | null = destination.querySelector(UPLOAD_CSV_INPUT_SELECTOR);

    if (!csvInput) {
      throw new Error("Unable to match CSV input");
    }

    const mergedRows: string[][] = await this.getMergedCsvDataOrError(intermediateCsvInput);

    const blob = new Blob([mergedRows.map((row) => row[0]).join("\n")], {
      type: "text/csv",
    });

    const dT = new DataTransfer();
    dT.items.add(new File([blob], "output.csv"));

    csvInput.files = dT.files;

    csvInput.dispatchEvent(new Event("change"));
  }

  async applyTransferCsvData(destination: HTMLElement) {
    const input: HTMLInputElement | null = destination.querySelector(
      `input[${INTERMEDIATE_CSV_ATTRIBUTE}]`
    );

    if (!input || !input.files) {
      throw new Error("Bad input");
    }

    const mergedRows: string[][] = await this.getMergedCsvDataOrError(input);

    const packages = [...destination.querySelectorAll(PACKAGE_ROW_SELECTOR)];

    for (const pkg of packages) {
      const packageTagInput: HTMLInputElement | null = pkg.querySelector(
        PACKAGE_TAG_INPUT_SELECTOR
      );

      if (!packageTagInput) {
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
        console.error(`Could not match row for ${packageTagInput.value}`);
        continue;
      }

      console.log(packageTagInput);

      const grossWeightInput: HTMLInputElement | null = pkg.querySelector(
        PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR
      );

      if (grossWeightInput) {
        grossWeightInput.value = matchingRow[1];
      }

      const grossUnitOfWeightSelect: HTMLSelectElement | null = pkg.querySelector(
        PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR
      );

      if (grossUnitOfWeightSelect) {
        const options = [...grossUnitOfWeightSelect.querySelectorAll("option")];
        const matchingOption = null;
        for (const option of options) {
          if (option.getAttribute("label") === matchingRow[2]) {
            grossUnitOfWeightSelect.value = option.value;
            break;
          }
        }

        if (!matchingOption) {
          console.error("Unable to match");
        }
      }

      const wholesalePriceInput: HTMLInputElement | null = pkg.querySelector(
        PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR
      );

      if (wholesalePriceInput && typeof matchingRow[3] !== undefined) {
        wholesalePriceInput.value = matchingRow[3].replace("$", "").replace(",", "");
      }
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
