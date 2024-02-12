import { IXslxFile } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";

export async function downloadXslxFile({ xslxFile }: { xslxFile: IXslxFile }) {
  t3RequestManager.generateAndDownloadReport({ xslxFile });
}
