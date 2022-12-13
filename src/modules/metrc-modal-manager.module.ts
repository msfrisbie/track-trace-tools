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

        for (const destination of destinations) {
          console.log(destination);

          console.log(destination.querySelector('button[ng-click*="addLine("]'));

          const packages = destination.querySelectorAll(
            '[ng-repeat="package in destination.Packages"]'
          );

          for (const pkg of packages) {
            console.log(pkg);

            // Package input - set value of tag string
            console.log(pkg.querySelector('input[ng-model="package.Id"]'));

            console.log(pkg.querySelector('input[ng-model="package.GrossWeight"]'));
            console.log(pkg.querySelector('select[ng-model="package.GrossUnitOfWeightId"]'));
            console.log(pkg.querySelector('input[ng-model="package.WholesalePrice"]'));

            // console.log(pkg.querySelector())
            // console.log(pkg.querySelector())
          }
        }

        break;
      default:
        break;
    }
  }
}

export let metrcModalManager = new MetrcModalManager();
