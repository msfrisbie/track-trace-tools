import { BuilderType } from "@/consts";
import { IAtomicService, ICsvFile, IPluginCsvData } from "@/interfaces";
import { accountManager } from "./account-manager.module";

class BackupManager implements IAtomicService {
  async init() {}

  async backupCsvData(builderType: BuilderType, csvFiles: ICsvFile[]) {
    const pluginUserData = await accountManager.pluginUserDataOrError();

    for (let csvFile of csvFiles) {
      const pluginCsvData: IPluginCsvData = {
        ...pluginUserData,
        dataType: builderType,
        filename: csvFile.filename,
        signature: pluginUserData.apiKey,
        data: csvFile.data,
      };

      // await stubRequestManager.uploadCsvData(pluginCsvData);
    }
  }
}

export let backupManager = new BackupManager();
