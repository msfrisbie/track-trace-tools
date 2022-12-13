import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import * as Papa from "papaparse";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";
const DESTINATION_SELECTOR: string = '[ng-repeat="destination in line.Destinations"]';
const ADD_LINE_BUTTON_SELECTOR: string = 'button[ng-click*="addLine("]';
const PACKAGE_ROW_SELECTOR: string = '[ng-repeat="package in destination.Packages"]';
const UPLOAD_CSV_INPUT_SELECTOR: string = 'input[data-role="upload"]';
const PACKAGE_TAG_INPUT_SELECTOR: string = 'input[ng-model="package.Id"]';
const PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR: string = 'input[ng-model="package.GrossWeight"]';
const PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR: string =
  'select[ng-model="package.GrossUnitOfWeightId"]';
const PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR: string = 'input[ng-model="package.WholesalePrice"]';

class MetrcModalManager implements IAtomicService {
  async init() {}

  maybeAddFeaturesToModal() {
    // TODO check settings

    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    const modalTitle = modalTitleOrError(modal);

    switch (modalTitle) {
      case NEW_TRANSFER_TITLE:
        const destinations = modal.querySelectorAll(DESTINATION_SELECTOR);

        const readFile = (event: Event) => {
          // @ts-ignore
          for (let f of event.target.files) {
            console.log(f);
            Papa.parse(f, {
              header: false,
              complete: function (results: any) {
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

                // read the data from results
                const { data } = results;
                //print the data in the console
                console.log({ data });

                // @ts-ignore
                const parent: HTMLElement | null = event.target.parentElement;
                const FILEDATA_ATTRIBUTE: string = "ttt-filedata";
                const FILENAME_ATTRIBUTE: string = "ttt-filename";
                if (parent) {
                  let fileContainer: HTMLElement | null = parent.querySelector(
                    `div[${FILEDATA_ATTRIBUTE}][${FILENAME_ATTRIBUTE}="${f.name}"]`
                  );

                  if (!fileContainer) {
                    fileContainer = document.createElement("div");
                    parent.appendChild(fileContainer);
                    fileContainer.setAttribute(FILEDATA_ATTRIBUTE, "true");
                    fileContainer.setAttribute(FILENAME_ATTRIBUTE, f.name);
                    fileContainer.style.display = "none";
                  }

                  fileContainer.textContent = JSON.stringify(results);
                } else {
                  throw new Error("Could not locate input parent");
                }
              },
            });
          }
        };

        for (const destination of destinations) {
          console.log(destination);

          console.log(destination.querySelector(ADD_LINE_BUTTON_SELECTOR));

          const packages = destination.querySelectorAll(PACKAGE_ROW_SELECTOR);

          const csvInput = destination.querySelector(UPLOAD_CSV_INPUT_SELECTOR);
          console.log(csvInput);

          if (csvInput && csvInput.parentElement) {
            csvInput.parentElement.style.backgroundColor = "#49276a";
            csvInput.parentElement.style.color = "white";
            csvInput.parentElement.style.backgroundImage = "none";
            csvInput.addEventListener("change", readFile);
          }

          for (const pkg of packages) {
            console.log(pkg);

            // Package input - set value of tag string
            console.log(pkg.querySelector(PACKAGE_TAG_INPUT_SELECTOR));

            console.log(pkg.querySelector(PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR));
            console.log(pkg.querySelector(PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR));
            console.log(pkg.querySelector(PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR));
          }
        }

        break;
      default:
        break;
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
