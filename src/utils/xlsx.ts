import { IXlsxFile } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { toastManager } from "@/modules/toast-manager.module";

export async function downloadXlsxFile({ xlsxFile }: { xlsxFile: IXlsxFile }) {
  const response = await t3RequestManager.generateAndDownloadReport({ xlsxFile });

  if (response.status !== 200) {
    toastManager.openToast(`Failed to generate XSLX`, {
      title: "Report error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }
}
