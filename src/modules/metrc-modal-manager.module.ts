import { IAtomicService } from "@/interfaces";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

class MetrcModalManager implements IAtomicService {
  async init() {}

  updateModalState() {
    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    const modalTitle = modalTitleOrError(modal);

    switch (modalTitle) {
      case "New Transfer":
        const destinations = modal.querySelectorAll(
          '[ng-repeat="destination in line.Destinations"]'
        );

        const readFile = (event: Event) => {
          const reader = new FileReader();
          reader.onload = () => {
            // document.getElementById("out").innerHTML = reader.result;
            console.log(reader.result);
          };
          // start reading the file. When it is done, calls the onload event defined above.
          // @ts-ignore
          reader.readAsBinaryString(event.target.files[0]);
        };

        for (const destination of destinations) {
          console.log(destination);

          console.log(destination.querySelector('button[ng-click*="addLine("]'));

          const packages = destination.querySelectorAll(
            '[ng-repeat="package in destination.Packages"]'
          );

          const csvInput = destination.querySelector('input[data-role="upload"]');
          console.log(csvInput);

          if (csvInput) {
            // @ts-ignore
            csvInput.parentElement.style.backgroundColor = "purple";
            // @ts-ignore
            csvInput.parentElement.style.color = "white";
            csvInput.addEventListener("change", readFile);
          }

          for (const pkg of packages) {
            console.log(pkg);

            // Package input - set value of tag string
            console.log(pkg.querySelector('input[ng-model="package.Id"]'));

            console.log(pkg.querySelector('input[ng-model="package.GrossWeight"]'));
            console.log(pkg.querySelector('select[ng-model="package.GrossUnitOfWeightId"]'));
            console.log(pkg.querySelector('input[ng-model="package.WholesalePrice"]'));
          }
        }

        break;
      default:
        break;
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
