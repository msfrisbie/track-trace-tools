import { IXlsxFile } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";

export async function downloadXlsxFile({ xlsxFile }: { xlsxFile: IXlsxFile }) {
  const response = await t3RequestManager.generateAndDownloadReport({ xlsxFile });

  if (response.status !== 200) {
    toastManager.openToast(`Failed to generate XLSX`, {
      title: "Report error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }
}

export async function emailXlsxFile({
  xlsxFile,
  extraHtml,
}: {
  xlsxFile: IXlsxFile;
  extraHtml: string | null;
}) {
  const response = await t3RequestManager.generateAndEmailReport({
    xlsxFile,
    extraHtml,
    email: store.state.settings.email,
  });

  if (response.status !== 200) {
    toastManager.openToast(`Failed to send generated report to ${store.state.settings.email}`, {
      title: "Report Error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  } else {
    toastManager.openToast(`Successfully sent report to ${store.state.settings.email}`, {
      title: "Report Success",
      autoHideDelay: 5000,
      variant: "success",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }
}
