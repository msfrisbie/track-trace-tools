import { IAtomicService } from "@/interfaces";
import { applyTransferCsvDataToMetrcModal, clientCsvKeys, propagateCsv } from "@/utils/csv";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import { clientBuildManager } from "./client-build-manager.module";

const debugLog = debugLogFactory("modules/metrc-modal-analyzer.module.ts");

const NEW_TRANSFER_TITLE: string = "New Transfer";
const NEW_LICENSED_TRANSFER_TITLE: string = "New Licensed Transfer";
const EDIT_LICENSED_TRANSFER_TITLE: string = "Edit Licensed Transfer";

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
      values = clientBuildManager.validateAndGetValuesOrError(clientCsvKeys);
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
            intermediateCsvInput.addEventListener("change", () => propagateCsv(destination));

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
            applyBtn.addEventListener("click", (e) =>
              applyTransferCsvDataToMetrcModal(destination)
            );

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
}

export let metrcModalManager = new MetrcModalManager();
