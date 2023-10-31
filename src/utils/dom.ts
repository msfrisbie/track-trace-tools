import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";

export function copyToClipboard(value: string): void {
  // Deprecated implementation
  //
  // const el = document.createElement("textarea");
  // el.value = value;
  // el.setAttribute("readonly", "");
  // el.style.position = "absolute";
  // el.style.left = "-9999px";
  // document.body.appendChild(el);
  // el.select();
  // document.execCommand("copy");
  // document.body.removeChild(el);

  navigator.clipboard.writeText(value);
}

export function downloadFileFromUrl({ url, filename }: { url: string; filename: string }): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.dispatchEvent(new MouseEvent("click"));
}

export function printPdfFromUrl({ urls, modal = false }: { urls: string[]; modal?: boolean }) {
  if (modal) {
    modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
      documentUrls: urls,
      print: true,
    });
  } else {
    for (const url of urls) {
      const w = window.open(url, "_blank");

      if (!w) {
        return;
      }

      // Doesn't seem to be a good way to reliably close
      // after the print dialog exits
      w.onload = () => {
        w?.print();
        // setTimeout(() => w?.close(), 500);
      };

      // w.onfocus = () => {
      //     // setTimeout(() => w.close(), 500);
      // }
    }
  }
}
