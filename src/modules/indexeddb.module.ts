import {
  DEXIE_DB_NAME,
  DEXIE_DB_VERSION,
  DEXIE_PACKAGE_SCHEMA,
  DEXIE_PACKAGE_TABLE_NAME,
  DEXIE_TAG_SCHEMA,
  DEXIE_TAG_TABLE_NAME,
  DEXIE_TRANSFER_SCHEMA,
  DEXIE_TRANSFER_TABLE_NAME,
} from "@/consts";
import {
  IIndexedPackageData,
  IIndexedPackageFilters,
  IIndexedTagData,
  IIndexedTagFilters,
  IIndexedTransferData,
  IIndexedTransferFilters,
} from "@/interfaces";
import Dexie from "dexie";

class TrackTraceToolsDatabase extends Dexie {
  packages: Dexie.Table<IIndexedPackageData, number>;
  transfers: Dexie.Table<IIndexedTransferData, number>;
  tags: Dexie.Table<IIndexedTagData, number>;

  constructor(databaseName: string, databaseVersion: number) {
    super(databaseName);
    this.delete();

    this.version(databaseVersion).stores({
      [DEXIE_PACKAGE_TABLE_NAME]: DEXIE_PACKAGE_SCHEMA,
      [DEXIE_TRANSFER_TABLE_NAME]: DEXIE_TRANSFER_SCHEMA,
      [DEXIE_TAG_TABLE_NAME]: DEXIE_TAG_SCHEMA,
    });
    this.packages = this.table(DEXIE_PACKAGE_TABLE_NAME);
    this.transfers = this.table(DEXIE_TRANSFER_TABLE_NAME);
    this.tags = this.table(DEXIE_TAG_TABLE_NAME);
  }
}

class Database {
  private _db: TrackTraceToolsDatabase = new TrackTraceToolsDatabase(
    DEXIE_DB_NAME,
    DEXIE_DB_VERSION
  );

  constructor() {
    // Disabled - the schema hasn't changed at all,
    // so keep the data from last time and re-index atop it
    // this._db.delete();

    this._db.open();
  }

  async indexPackages(indexedPackagesData: Array<IIndexedPackageData>) {
    return await this._db.packages.bulkPut(indexedPackagesData);
  }

  async indexTransfers(indexedTransfersData: IIndexedTransferData[]) {
    return await this._db.transfers.bulkPut(indexedTransfersData);
  }

  async indexTags(indexedTagsData: IIndexedTagData[]) {
    return await this._db.tags.bulkPut(indexedTagsData);
  }

  async packageSearch(
    queryString: string,
    license: string,
    filters: IIndexedPackageFilters
  ): Promise<IIndexedPackageData[]> {
    const formattedQuery = queryString.toUpperCase();

    const result = await this._db.packages
      .where("License")
      .equals(license)
      .filter((packageData) => {
        return packageData.TagMatcher.includes(formattedQuery);
      })
      .toArray();

    // This uses the implicit enum alphabetical ordering to sort
    return result.sort((a, b) => (a.PackageState > b.PackageState ? 1 : -1));
  }

  async transferSearch(
    queryString: string,
    license: string,
    filters: IIndexedTransferFilters
  ): Promise<IIndexedTransferData[]> {
    const formattedQuery = queryString.toUpperCase();

    return await this._db.transfers
      .where("License")
      .equals(license)
      .filter((transferData) => {
        return transferData.TagMatcher.includes(formattedQuery);
      })
      .toArray();
  }

  async tagSearch(
    queryString: string,
    license: string,
    filters: IIndexedTagFilters
  ): Promise<IIndexedTagData[]> {
    const formattedQuery = queryString.toUpperCase();

    return await this._db.tags
      .where("License")
      .equals(license)
      .filter((tagData) => {
        return tagData.TagMatcher.includes(formattedQuery);
      })
      .toArray();
  }
}

export let database = new Database();
