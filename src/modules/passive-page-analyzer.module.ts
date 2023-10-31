import { MessageType } from "@/consts";
import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { debugLogFactory } from "@/utils/debug";
import { activeMetrcModalOrNull, modalTitleOrError } from "@/utils/metrc-modal";
import _ from "lodash-es";
import { analyticsManager } from "./analytics-manager.module";
import { authManager } from "./auth-manager.module";
import { pageManager } from "./page-manager/page-manager.module";

const debugLog = debugLogFactory("modules/passive-page-analyzer.module.ts");

class PassivePageAnalyzer implements IAtomicService {
  lastObservedActiveModalName: string | null = null;

  async init() {
    const debouncedHandler = _.debounce(() => this.analyzePage(), 100);

    const observer = new MutationObserver(() => debouncedHandler());

    observer.observe(document.body, { subtree: true, childList: true });
  }

  private analyzePage() {
    const modal = activeMetrcModalOrNull();

    if (!modal) {
      if (this.lastObservedActiveModalName) {
        analyticsManager.track(MessageType.CLOSED_METRC_MODAL, {});
        if (!store.state.settings.disableAutoRefreshOnModalClose) {
          pageManager.clickRefreshLinks();
        }
      }
      this.lastObservedActiveModalName = null;
      return;
    }

    this.recordModalState(modal as HTMLElement);

    try {
      this.maybeRecordFieldNames(modal as HTMLElement);
    } catch (e) {
      console.error(e);
    }
  }

  recordModalState(modalElement: HTMLElement) {
    const activeModalName: string = modalTitleOrError(modalElement);

    if (this.lastObservedActiveModalName !== activeModalName) {
      analyticsManager.track(MessageType.OPENED_METRC_MODAL, {
        modalName: activeModalName,
      });
    }

    this.lastObservedActiveModalName = activeModalName;
  }

  async maybeRecordFieldNames(modalElement: HTMLElement) {
    const authState = await authManager.authStateOrError();

    const title = modalTitleOrError(modalElement);

    const key = title.replace(/\s/g, "");

    const ngModelElements: HTMLElement[] = [
      ...modalElement.querySelectorAll("[ng-model]"),
    ] as HTMLElement[];

    const fieldNames: string[] = [
      ...new Set(
        ngModelElements
          .map((x: HTMLElement) => x.getAttribute("ng-model"))
          .filter((x) => !!x)
          .sort()
      ),
    ] as string[];

    if (!fieldNames.length) {
      console.error("fieldNames empty");
      return;
    }

    const repeaterDataKeys: string[] = [
      ...new Set(
        ngModelElements
          .map((x: HTMLElement) => {
            let attr: string | null = null;

            if (x.hasAttribute("ng-options")) {
              attr = x.getAttribute("ng-options");
            } else if (x.hasAttribute("typeahead")) {
              attr = x.getAttribute("typeahead");
            }

            if (!attr) {
              return null;
            }

            const match = attr.match(/(repeaterData.[\w]+)/);

            if (!match) {
              return null;
            }

            return match[1];
          })
          .filter((x) => !!x)
          .sort()
      ),
    ] as string[];

    if (!repeaterDataKeys.length) {
      throw new Error("repeaterDataKeys empty");
    }
  }
}

export const passivePageAnalyzer = new PassivePageAnalyzer();
