import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import * as Papa from "papaparse";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";

// const FILEDATA_ATTRIBUTE: string = "ttt-filedata";
const CSV_APPLY_BUTTON_ATTRIBUTE: string = "ttt-apply-csv";
const TTT_TOUCHED_ATTRIBUTE: string = "ttt-touched";

const DESTINATION_SELECTOR: string = '[ng-repeat="destination in line.Destinations"]';
const ADD_LINE_BUTTON_SELECTOR: string = 'button[ng-click*="addLine("]';
const PACKAGE_ROW_SELECTOR: string = '[ng-repeat="package in destination.Packages"]';
const UPLOAD_CSV_INPUT_SELECTOR: string = 'input[data-role="upload"]';
const CSV_INPUT_CONTAINER_SELECTOR: string = ".k-upload.k-header";
const PACKAGE_TAG_INPUT_SELECTOR: string = 'input[ng-model="package.Id"]';
const PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR: string = 'input[ng-model="package.GrossWeight"]';
const PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR: string =
  'select[ng-model="package.GrossUnitOfWeightId"]';
const PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR: string = 'input[ng-model="package.WholesalePrice"]';

class MetrcModalManager implements IAtomicService {
  async init() {}

  // Idempotent method that manages the contents of the modal
  // each time the DOM changes
  maybeAddWidgetsAndListenersToModal() {
    console.log("run maybeAddWidgets");
    // TODO check settings
    // TODO debounce

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
          // console.log(destination);

          // console.log(destination.querySelector(ADD_LINE_BUTTON_SELECTOR));

          const packages = destination.querySelectorAll(PACKAGE_ROW_SELECTOR);

          const csvInputContainer: HTMLElement | null = destination.querySelector(
            CSV_INPUT_CONTAINER_SELECTOR
          );

          if (!csvInputContainer) {
            throw new Error("Unable to match CSV input container");
          }

          const csvInput: HTMLInputElement | null =
            csvInputContainer.querySelector(UPLOAD_CSV_INPUT_SELECTOR);

          if (!csvInput) {
            throw new Error("Unable to match CSV input");
          }

          const parent = csvInput.parentElement as HTMLElement;
          parent.style.backgroundColor = "#49276a";
          parent.style.color = "white";
          parent.style.backgroundImage = "none";

          let applyBtn: HTMLButtonElement | null = csvInputContainer.querySelector(
            `button[${CSV_APPLY_BUTTON_ATTRIBUTE}]`
          );

          // Only add button if it does not exist
          if (!applyBtn) {
            applyBtn = document.createElement("button");
            applyBtn.setAttribute("type", "button");
            applyBtn.classList.add("k-button");
            applyBtn.setAttribute(CSV_APPLY_BUTTON_ATTRIBUTE, "true");
            applyBtn.style.backgroundColor = "#49276a";
            applyBtn.style.color = "white";
            applyBtn.style.backgroundImage = "none";
            applyBtn.innerText = "FILL CSV DATA";
            applyBtn.addEventListener("click", (e) => this.applyTransferCsvData(destination));

            // @ts-ignore
            parent.parentElement.appendChild(applyBtn);
          }

          applyBtn.style.display = "none";

          if (csvInput.files?.length) {
            applyBtn.style.display = "inline-block";
          }
        }

        break;
      default:
        break;
    }
  }

  // handleFileInputChange(container: HTMLElement) {
  //   const input = container.querySelector(UPLOAD_CSV_INPUT_SELECTOR) as HTMLInputElement | null;

  //   if (!input || input.files === null) {
  //     throw new Error("Bad target");
  //   }

  //   for (let f of target.files) {
  //     Papa.parse(f, {
  //       header: false,
  //       complete: (results) => {
  //         // {
  //         //   data: [["1A4050100000900000196590"], ["1A4050100000900000211022"]],
  //         //   errors: [
  //         //     {
  //         //       type: "Delimiter",
  //         //       code: "UndetectableDelimiter",
  //         //       message: "Unable to auto-detect delimiting character; defaulted to ','",
  //         //     },
  //         //   ],
  //         //   meta: {
  //         //     delimiter: ",",
  //         //     linebreak: "\r\n",
  //         //     aborted: false,
  //         //     truncated: false,
  //         //     cursor: 50,
  //         //   },
  //         // };

  //         const rows = results.data;

  //         resolve(rows);

  //         // @ts-ignore
  //         const parent: HTMLElement | null = event.target.parentElement;

  //         if (parent) {
  //           let fileContainer: HTMLElement | null = parent.querySelector(
  //             `div[${FILEDATA_ATTRIBUTE}="${f.name}"]`
  //           );

  //           if (!fileContainer) {
  //             fileContainer = document.createElement("div");
  //             parent.appendChild(fileContainer);
  //             fileContainer.setAttribute(FILEDATA_ATTRIBUTE, f.name);
  //             fileContainer.style.display = "none";
  //           }

  //           fileContainer.innerText = JSON.stringify(results.data);
  //         } else {
  //           throw new Error("Could not locate input parent");
  //         }

  //         applyButton.style.display = "inline-block";
  //       },
  //     });
  //   }
  // }

  async applyTransferCsvData(destination: HTMLElement) {
    console.log("applyTransferCsvData");
    const mergedRows: string[][] = [];
    const input: HTMLInputElement | null = destination.querySelector(UPLOAD_CSV_INPUT_SELECTOR);

    if (!input || !input.files) {
      throw new Error("Bad input");
    }

    // const applyButton: HTMLElement | null = destination.querySelector(
    //   `[${CSV_APPLY_BUTTON_ATTRIBUTE}]`
    // );

    // if (!applyButton) {
    //   throw new Error("Could not locate apply button");
    // }

    // applyButton.style.display = "none";

    for (let f of input.files) {
      const rows: string[][] = await new Promise((resolve, reject) => {
        Papa.parse(f, {
          header: false,
          complete: (results) => {
            // {
            //   data: [["1A4050100000900000196590"], ["1A4050100000900000211022"]],
            //   errors: [
            //     {
            //       type: "Delimiter",
            //       code: "UndetectableDelimiter",
            //       message: "Unable to auto-detect delimiting character; defaulted to ','",
            //     },
            //   ],
            //   meta: {
            //     delimiter: ",",
            //     linebreak: "\r\n",
            //     aborted: false,
            //     truncated: false,
            //     cursor: 50,
            //   },
            // };

            // applyButton.style.display = "inline-block";

            const rows: string[][] = results.data as string[][];

            resolve(rows);
          },
          error(e) {
            reject(e);
          },
        });
      });

      console.log(rows);

      rows.map((row) => mergedRows.push(row));
    }

    console.log(mergedRows);

    const packages = [...destination.querySelectorAll(PACKAGE_ROW_SELECTOR)];

    for (const pkg of packages) {
      const packageTagInput: HTMLInputElement | null = pkg.querySelector(
        PACKAGE_TAG_INPUT_SELECTOR
      );

      if (!packageTagInput) {
        throw new Error("Could not locate package tag input");
      }

      console.log(packageTagInput.value);

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

      if (wholesalePriceInput) {
        wholesalePriceInput.value = matchingRow[3];
      }
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
