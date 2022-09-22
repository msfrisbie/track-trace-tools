import { IClientItemFilters, IItemData } from "@/interfaces";

export function itemMatchesFilters(item: IItemData, itemFilters: IClientItemFilters): boolean {
  if (itemFilters.itemCategory) {
    if (!itemFilters.itemCategory.includes(item.ProductCategoryName)) {
      return false;
    }
  }

  if (itemFilters.quantityType) {
    if (!itemFilters.quantityType.includes(item.QuantityTypeName)) {
      return false;
    }
  }

  return true;
}
