import { DATA_LOAD_MAX_ITERATION_FAILSAFE, DATA_LOAD_PAGE_SIZE } from '@/consts';
import {
  ICollectionFilters,
  ICollectionRequest,
  ICollectionResponse,
  IDataLoadOptions,
  IFilterOptions,
  IPaginationOptions,
  ISort,
  ISortOptions,
} from '@/interfaces';
import { DataLoadError, DataLoadErrorType } from '@/modules/data-loader/data-loader-error';
import store from '@/store/page-overlay/index';
import { debugLogFactory } from '@/utils/debug';
import { AxiosResponse } from 'axios';
import { Subject } from 'rxjs';

const debugLog = debugLogFactory('utils/data-loader.ts');

export function streamFactory<T>(
  { maxCount = Number.POSITIVE_INFINITY, pageSize = DATA_LOAD_PAGE_SIZE }: IDataLoadOptions,
  responseFactory: (paginationOptions: IPaginationOptions) => Promise<AxiosResponse>,
): Subject<ICollectionResponse<T>> {
  const subject: Subject<ICollectionResponse<T>> = new Subject();
  let runningTotal = 0;
  const t0 = performance.now();

  (async () => {
    if (store.state.settings.loadDataInParallel) {
      // Parallelized Load
      const countResponse = await responseFactory({ page: 0, pageSize: 5 }).catch(
        (error) => error.response,
      );
      if (countResponse.status !== 200) {
        if (countResponse.status === 401) {
          subject.error(
            new DataLoadError(
              DataLoadErrorType.PERMISSIONS,
              `Server indicated user is missing permissions for ${countResponse.config.url}`,
            ),
          );
          return;
        }
        subject.error(new DataLoadError(DataLoadErrorType.SERVER, 'Server returned an error.'));
        return;
      }
      const totalCountResponse: ICollectionResponse<T> = await countResponse.data;
      const lastPageIndex = Math.ceil(totalCountResponse.Total / pageSize);

      try {
        const responses = Array.from(Array(lastPageIndex).keys()).map((page) =>
          responseFactory({ page, pageSize }));

        Promise.allSettled(responses);

        for await (const response of responses) {
          if (response.status !== 200) {
            if (response.status === 401) {
              subject.error(
                new DataLoadError(
                  DataLoadErrorType.PERMISSIONS,
                  `Server indicated user is missing permissions for ${response.config.url}`,
                ),
              );
              return;
            }
            subject.error(new DataLoadError(DataLoadErrorType.SERVER, 'Server returned an error.'));
            return;
          }
          const responseData: ICollectionResponse<T> = await response.data;
          subject.next(responseData);

          debugLog(async () => ['responseData.Data:', responseData.Data]);

          runningTotal += responseData.Data.length;

          debugLog(async () => ['runningTotal:', runningTotal]);
        }

        const t1 = performance.now();

        debugLog(async () => [`Finished loading ${runningTotal} objects in ${t1 - t0} ms`]);

        subject.complete();
      } catch (e: any) {
        subject.error(
          new DataLoadError(DataLoadErrorType.NETWORK, 'Network request unable to complete.'),
        );
      }
    } else {
      // Serialized Load
      let page = 0;

      while (true) {
        let response = null;

        debugLog(async () => ['page:', page]);

        try {
          response = await responseFactory({ page, pageSize });
        } catch (e: any) {
          subject.error(new DataLoadError(DataLoadErrorType.NETWORK, e.toString()));
          return;
        } finally {
          if (!response) {
            subject.error(
              new DataLoadError(DataLoadErrorType.NETWORK, 'Network request unable to complete.'),
            );
            /* eslint-disable-next-line no-unsafe-finally */
            return;
          }
        }

        if (response.status !== 200) {
          if (response.status === 401) {
            subject.error(
              new DataLoadError(
                DataLoadErrorType.PERMISSIONS,
                `Server indicated user is missing permissions for ${response.config.url}`,
              ),
            );
            return;
          }
          subject.error(new DataLoadError(DataLoadErrorType.SERVER, 'Server returned an error.'));
          return;
        }

        const responseData: ICollectionResponse<T> = await response.data;
        subject.next(responseData);

        debugLog(async () => ['responseData.Data:', responseData.Data]);

        runningTotal += responseData.Data.length;

        debugLog(async () => ['runningTotal:', runningTotal]);

        if (runningTotal >= responseData.Total) {
          break;
        }

        if (runningTotal >= maxCount) {
          break;
        }

        if (page >= DATA_LOAD_MAX_ITERATION_FAILSAFE) {
          subject.error(new Error('Page exceeded max iteration failsafe'));
          return;
        }

        page++;
      }

      const t1 = performance.now();

      debugLog(async () => [`Finished loading ${runningTotal} objects in ${t1 - t0} ms`]);

      subject.complete();
    }
  })();

  return subject;
}

export function buildBodyFilter(filterOptions: IFilterOptions | null): ICollectionFilters | null {
  if (!filterOptions) {
    return null;
  }

  const {
    transferFilter, plantFilter, tagFilter, plantBatchFilter, packageFilter, harvestFilter,
  } = filterOptions;

  const filterSet: ICollectionFilters = {
    logic: filterOptions.operator || 'and',
    filters: [],
  };

  //
  // Plant Filter
  //

  if (plantFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'LocationName',
        // Searching Row 2 should not match Row 20
        operator: 'eq',
        value: plantFilter.locationName,
      },
    ];
  }

  if (plantFilter?.strainName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'StrainName',
        operator: 'eq',
        value: plantFilter.strainName,
      },
    ];
  }

  if (plantFilter?.vegetativeDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'VegetativeDate',
        operator: 'gt',
        value: plantFilter.vegetativeDateGt,
      },
    ];
  }

  if (plantFilter?.vegetativeDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'VegetativeDate',
        operator: 'eq',
        value: plantFilter.vegetativeDateEq,
      },
    ];
  }

  if (plantFilter?.vegetativeDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'VegetativeDate',
        operator: 'lt',
        value: plantFilter.vegetativeDateLt,
      },
    ];
  }

  if (plantFilter?.floweringDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'FloweringDate',
        operator: 'gt',
        value: plantFilter.floweringDateGt,
      },
    ];
  }

  if (plantFilter?.floweringDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'FloweringDate',
        operator: 'eq',
        value: plantFilter.floweringDateEq,
      },
    ];
  }

  if (plantFilter?.floweringDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'FloweringDate',
        operator: 'lt',
        value: plantFilter.floweringDateLt,
      },
    ];
  }

  if (plantFilter?.plantedDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PlantedDate',
        operator: 'gt',
        value: plantFilter.plantedDateGt,
      },
    ];
  }

  if (plantFilter?.plantedDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PlantedDate',
        operator: 'eq',
        value: plantFilter.plantedDateEq,
      },
    ];
  }

  if (plantFilter?.plantedDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PlantedDate',
        operator: 'lt',
        value: plantFilter.plantedDateLt,
      },
    ];
  }

  if (plantFilter?.label) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'Label',
        operator: 'endswith',
        value: plantFilter.label,
      },
    ];
  }

  //
  // PlantBatch Filter
  //

  if (plantBatchFilter?.name) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'Name',
        operator: 'eq',
        value: plantBatchFilter.name,
      },
    ];
  }

  if (plantBatchFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'LocationName',
        // Searching Row 2 should not match Row 20
        operator: 'eq',
        value: plantBatchFilter.locationName,
      },
    ];
  }

  if (plantBatchFilter?.strainName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'StrainName',
        operator: 'eq',
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
        field: 'Label',
        operator: 'eq',
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
        field: 'Label',
        operator: 'eq',
        value: packageFilter.label,
      },
    ];
  }

  if (packageFilter?.itemName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'Item.Name',
        operator: packageFilter.itemNameExact ? 'eq' : 'contains',
        value: packageFilter.itemName,
      },
    ];
  }

  if (packageFilter?.itemStrainName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'Item.StrainName',
        operator: packageFilter.itemStrainNameExact ? 'eq' : 'contains',
        value: packageFilter.itemStrainName,
      },
    ];
  }

  if (packageFilter?.locationName) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'LocationName',
        operator: packageFilter.locationNameExact ? 'eq' : 'contains',
        value: packageFilter.locationName,
      },
    ];
  }

  if (typeof packageFilter?.isEmpty === 'boolean') {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'Quantity',
        operator: packageFilter.isEmpty ? 'eq' : 'gt',
        value: 0,
      },
    ];
  }

  if (packageFilter?.packagedDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PackagedDate',
        operator: 'gt',
        value: packageFilter.packagedDateGt,
      },
    ];
  }

  if (packageFilter?.packagedDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PackagedDate',
        operator: 'eq',
        value: packageFilter.packagedDateEq,
      },
    ];
  }

  if (packageFilter?.packagedDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'PackagedDate',
        operator: 'lt',
        value: packageFilter.packagedDateLt,
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
        field: 'ManifestNumber',
        operator: 'contains',
        value: transferFilter.manifestNumber,
      },
    ];
  }

  if (transferFilter?.createdDateLt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'CreatedDateTime',
        operator: 'lt',
        value: transferFilter.createdDateLt,
      },
    ];
  }

  if (transferFilter?.createdDateEq) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'CreatedDateTime',
        operator: 'eq',
        value: transferFilter.createdDateEq,
      },
    ];
  }

  if (transferFilter?.createdDateGt) {
    filterSet.filters = [
      ...filterSet.filters,
      {
        field: 'CreatedDateTime',
        operator: 'gt',
        value: transferFilter.createdDateGt,
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
        field: 'Name',
        operator: 'eq',
        value: harvestFilter.harvestName,
      },
    ];
  }

  if (filterSet.filters.length > 0) {
    return filterSet;
  }

  return null;
}

export function buildBodySort(sortOptions: ISortOptions | null) {
  if (!sortOptions) {
    return null;
  }

  const { salesReceiptSort, plantSort, plantBatchSort } = sortOptions;

  let sortSet: ISort[] = [];

  if (salesReceiptSort?.RecordedDateTime) {
    sortSet = [
      ...sortSet,
      {
        field: 'RecordedDateTime',
        dir: 'asc',
      },
    ];
  }

  if (plantSort?.Label) {
    sortSet = [
      ...sortSet,
      {
        field: 'Label',
        dir: 'asc',
      },
    ];
  }

  if (plantBatchSort?.Name) {
    sortSet = [
      ...sortSet,
      {
        field: 'Name',
        dir: 'asc',
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
  filterOptions: IFilterOptions | null = null,
  sortOptions: ISortOptions | null = null,
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
