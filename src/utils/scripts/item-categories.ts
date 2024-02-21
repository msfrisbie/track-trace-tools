import { IAuthState, IIndexedPackageData, IItemCategory, IXlsxFile } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { DataLoader } from "@/modules/data-loader/data-loader.module";
import { DynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { downloadXlsxFile } from "../xlsx";

export async function runItemCategoriesScript() {
  let itemCategories: IItemCategory[] = [];
  let packages: IIndexedPackageData[] = [];

  const authState = await authManager.authStateOrError();

  for (const facility of await facilityManager.ownedFacilitiesOrError()) {
    const spoofedAuthState: IAuthState = {
      ...authState,
      license: facility.licenseNumber,
    };

    const spoofedDynamicConstsManager = new DynamicConstsManager();
    const spoofedDataLoader = new DataLoader();
    await spoofedDynamicConstsManager.init(spoofedAuthState);
    await spoofedDataLoader.init(spoofedAuthState);

    try {
      const newCategories = (await spoofedDynamicConstsManager.itemCategories()).filter(
        (x) => !itemCategories.find((y) => x.Id === y.Id)
      );

      itemCategories = itemCategories.concat(newCategories);
    } catch {
      console.error("skipping categories", facility.licenseNumber);
      continue;
    }

    try {
      packages = packages.concat(await spoofedDataLoader.activePackages());
      packages = packages.concat(await spoofedDataLoader.inactivePackages());
    } catch {
      console.error("skipping packages", facility.licenseNumber);
      continue;
    }
  }
  const initialItemCategoryKeys = ["Id", "Name", "ProductCategoryTypeName", "ProductCategoryType"];
  const initialItemKeys = ["ProductCategoryName", "ProductCategoryType", "ProductCategoryTypeName"];

  const itemCategoryKeys = [
    ...initialItemCategoryKeys,
    ...Object.keys(itemCategories[0]).filter((key) => !initialItemCategoryKeys.includes(key)),
  ];

  const itemKeys = [
    ...initialItemKeys,
    ...Object.keys(packages[0].Item).filter((key) => !initialItemKeys.includes(key)),
  ];

  const sheet0 = {
    sheetName: "Item Categories",
    data: [[...itemCategoryKeys]],
  };
  for (const itemCategory of itemCategories) {
    const row = [];

    for (const key of itemCategoryKeys) {
      // @ts-ignore
      row.push((itemCategory[key] ?? "").toString());
    }

    sheet0.data.push(row);
  }

  const sheet1 = {
    sheetName: "Example Item Data per Item Category",
    data: [[...itemKeys]],
  };
  for (const itemCategory of itemCategories) {
    const matchingPackage = packages.find((x) => x.Item.ProductCategoryName === itemCategory.Name);

    const row = [
      itemCategory.Name,
      itemCategory.ProductCategoryType,
      itemCategory.ProductCategoryTypeName,
    ];

    if (matchingPackage) {
      for (const itemKey of itemKeys.slice(initialItemKeys.length)) {
        // @ts-ignore
        row.push((matchingPackage.Item[itemKey] ?? "").toString());
      }
    }

    sheet1.data.push(row);
  }

  const sheets: any[] = [sheet0, sheet1];

  const xlsxFile: IXlsxFile = {
    filename: "missouri_item_breakout.xlsx",
    sheets,
  };

  const download = true;

  if (download) {
    downloadXlsxFile({ xlsxFile });
  }

  console.log({ xlsxFile });
}
