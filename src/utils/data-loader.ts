import { DATA_LOAD_MAX_ITERATION_FAILSAFE, DATA_LOAD_PAGE_SIZE } from "@/consts";
import {
  ICollectionFilters,
  ICollectionRequest,
  ICollectionResponse,
  IDataLoadOptions,
  IHarvestFilter,
  IPaginationOptions,
  IPlantBatchFilter,
  IPlantBatchSort,
  IPlantFilter,
  IPlantSort,
  ISalesReceiptSort,
  ISort,
  ITagFilter,
  ITransferFilter,
} from "@/interfaces";
import { DataLoadError, DataLoadErrorType } from "@/modules/data-loader/data-loader-error";
import { debugLogFactory } from "@/utils/debug";
import { Subject } from "rxjs";
import { IPackageFilter } from "../interfaces";

const debugLog = debugLogFactory("utils/data-loader.ts");

export function streamFactory<T>(
  { maxCount = Number.POSITIVE_INFINITY, pageSize = DATA_LOAD_PAGE_SIZE }: IDataLoadOptions,
  responseFactory: (paginationOptions: IPaginationOptions) => Promise<Response>
): Subject<ICollectionResponse<T>> {
  const subject: Subject<ICollectionResponse<T>> = new Subject();

  (async () => {
    let page = 0;
    let runningTotal = 0;
    const t0 = performance.now();

    while (true) {
      let response = null;

      debugLog(async () => ["page:", page]);

      try {
        response = await responseFactory({ page, pageSize });
      } catch (e) {
        subject.error(new DataLoadError(DataLoadErrorType.NETWORK, e.toString()));
        return;
      } finally {
        if (!response) {
          subject.error(
            new DataLoadError(DataLoadErrorType.NETWORK, "Network request unable to complete.")
          );
          return;
        }
      }

      if (response.status !== 200) {
        if (response.status === 401) {
          subject.error(
            new DataLoadError(
              DataLoadErrorType.PERMISSIONS,
              `Server indicated user is missing permissions for ${response.url}`
            )
          );
          return;
        } else {
          subject.error(new DataLoadError(DataLoadErrorType.SERVER, "Server returned an error."));
          return;
        }
      }

      const responseData: ICollectionResponse<T> = await response.json();
      subject.next(responseData);

      debugLog(async () => ["responseData.Data:", responseData.Data]);

      runningTotal += responseData.Data.length;

      debugLog(async () => ["runningTotal:", runningTotal]);

      if (runningTotal >= responseData.Total) {
        break;
      }

      if (runningTotal >= maxCount) {
        break;
      }

      if (page >= DATA_LOAD_MAX_ITERATION_FAILSAFE) {
        subject.error(new Error("Page exceeded max iteration failsafe"));
        return;
      }

      page++;
    }

    const t1 = performance.now();

    debugLog(async () => [`Finished loading ${runningTotal} objects in ${t1 - t0} ms`]);

    subject.complete();
  })();

  return subject;
}

export function buildBodyFilter(
  filterOptions: {
    plantFilter?: IPlantFilter;
    tagFilter?: ITagFilter;
    plantBatchFilter?: IPlantBatchFilter;
    packageFilter?: IPackageFilter;
    transferFilter?: ITransferFilter;
    harvestFilter?: IHarvestFilter;
  } | null
): ICollectionFilters | null {
  if (!filterOptions) {
    return null;
  }

  const { transferFilter, plantFilter, tagFilter, plantBatchFilter, packageFilter, harvestFilter } =
    filterOptions;

  const filterSet: ICollectionFilters = {
    logic: "and",
    filters: [],
  };

  //
  // Plant Filter
  //

  if (plantFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "LocationName",
        // Searching Row 2 should not match Row 20
        operator: "eq",
        value: plantFilter.locationName,
      },
    ];
  }

  if (plantFilter?.strainName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "StrainName",
        operator: "eq",
        value: plantFilter.strainName,
      },
    ];
  }

  if (plantFilter?.vegetativeDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "VegetativeDate",
        operator: "gt",
        value: plantFilter.vegetativeDateGt,
      },
    ];
  }

  if (plantFilter?.vegetativeDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "VegetativeDate",
        operator: "eq",
        value: plantFilter.vegetativeDateEq,
      },
    ];
  }

  if (plantFilter?.vegetativeDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "VegetativeDate",
        operator: "lt",
        value: plantFilter.vegetativeDateLt,
      },
    ];
  }

  if (plantFilter?.floweringDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "FloweringDate",
        operator: "gt",
        value: plantFilter.floweringDateGt,
      },
    ];
  }

  if (plantFilter?.floweringDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "FloweringDate",
        operator: "eq",
        value: plantFilter.floweringDateEq,
      },
    ];
  }

  if (plantFilter?.floweringDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "FloweringDate",
        operator: "lt",
        value: plantFilter.floweringDateLt,
      },
    ];
  }

  if (plantFilter?.plantedDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "PlantedDate",
        operator: "gt",
        value: plantFilter.plantedDateGt,
      },
    ];
  }

  if (plantFilter?.plantedDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "PlantedDate",
        operator: "eq",
        value: plantFilter.plantedDateEq,
      },
    ];
  }

  if (plantFilter?.plantedDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "PlantedDate",
        operator: "lt",
        value: plantFilter.plantedDateLt,
      },
    ];
  }

  if (plantFilter?.label) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Label",
        operator: "endswith",
        value: plantFilter.label,
      },
    ];
  }

  //
  // PlantBatch Filter
  //

  if (plantBatchFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "LocationName",
        // Searching Row 2 should not match Row 20
        operator: "eq",
        value: plantBatchFilter.locationName,
      },
    ];
  }

  if (plantBatchFilter?.strainName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "StrainName",
        operator: "eq",
        value: plantBatchFilter.strainName,
      },
    ];
  }

  //
  // Tag Filter
  //

  if (tagFilter?.label) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Label",
        operator: "eq",
        value: tagFilter.label,
      },
    ];
  }

  //
  // Package Filter
  //

  if (packageFilter?.label) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Label",
        operator: "eq",
        value: packageFilter.label,
      },
    ];
  }

  if (packageFilter?.itemName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Item.Name",
        operator: "eq",
        value: packageFilter.itemName,
      },
    ];
  }

  if (packageFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "LocationName",
        operator: "eq",
        value: packageFilter.locationName,
      },
    ];
  }

  if (typeof packageFilter?.isEmpty === "boolean") {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Quantity",
        operator: packageFilter.isEmpty ? "eq" : "gt",
        value: 0,
      },
    ];
  }

  //
  // Transfer Filter
  //

  if (transferFilter?.manifestNumber) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "ManifestNumber",
        operator: "contains",
        value: transferFilter.manifestNumber,
      },
    ];
  }

  //
  // Harvest Filter
  //

  if (harvestFilter?.harvestName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: "Name",
        operator: "eq",
        value: harvestFilter.harvestName,
      },
    ];
  }

  if (filterSet.filters.length > 0) {
    return filterSet;
  }

  return null;
}

export function buildBodySort(
  sortOptions: {
    salesReceiptSort?: ISalesReceiptSort;
    plantSort?: IPlantSort;
    plantBatchSort?: IPlantBatchSort;
  } | null
) {
  if (!sortOptions) {
    return null;
  }

  const { salesReceiptSort, plantSort, plantBatchSort } = sortOptions;

  let sortSet: ISort[] = [];

  if (salesReceiptSort?.RecordedDateTime) {
    sortSet = [
      ...sortSet,
      {
        field: "RecordedDateTime",
        dir: "asc",
      },
    ];
  }

  if (plantSort?.Label) {
    sortSet = [
      ...sortSet,
      {
        field: "Label",
        dir: "asc",
      },
    ];
  }

  if (plantBatchSort?.Name) {
    sortSet = [
      ...sortSet,
      {
        field: "Name",
        dir: "asc",
      },
    ];
  }

  if (sortSet.length > 0) {
    return sortSet;
  }

  return null;
}

/**
 *
 * @param page - zero indexed page
 * @param filterOptions
 * @param sortOptions
 * @returns
 */
export function buildBody(
  { page, pageSize }: IPaginationOptions,
  filterOptions: {
    plantFilter?: IPlantFilter;
    tagFilter?: ITagFilter;
    plantBatchFilter?: IPlantBatchFilter;
    packageFilter?: IPackageFilter;
    transferFilter?: ITransferFilter;
    harvestFilter?: IHarvestFilter;
  } | null = null,
  sortOptions: {
    salesReceiptSort?: ISalesReceiptSort;
    plantSort?: IPlantSort;
    plantBatchSort?: IPlantBatchSort;
  } | null = null
): string {
  const body: ICollectionRequest = {
    request: {
      take: pageSize,
      skip: page * pageSize,
      page: page + 1,
      pageSize,
      group: [],
    },
  };

  const filter = buildBodyFilter(filterOptions);

  if (filter) {
    body.request.filter = filter;
  }

  const sort = buildBodySort(sortOptions);
  if (sort) {
    body.request.sort = sort;
  }

  return JSON.stringify(body);
}
