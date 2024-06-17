import { IAtomicService, IAuthState } from "@/interfaces";
import { origin } from "@/modules/environment.module";
import { customAxios } from "@/modules/fetch-manager.module";
import { CsvUpload } from "@/types";
import { authManager } from "./auth-manager.module";

const LOGIN_URL = `${origin({ divertToNullOrigin: false })}/log-in`;

/**
 * API READ
 */
const EMPLOYEES_URL = `${origin({ divertToNullOrigin: false })}/api/employees`;

const AVAILABLE_TAGS_URL = `${origin({ divertToNullOrigin: false })}/api/tags/available`;
const USED_TAGS_URL = `${origin({ divertToNullOrigin: false })}/api/tags/used`;
const VOIDED_TAGS_URL = `${origin({ divertToNullOrigin: false })}/api/tags/voided`;

// Modals have separate view for all items
const AVAILABLE_TAGS_MODAL_URL = `/api/tags/forlookup/newtagindustrypackages`;
const ACTIVE_ITEMS_MODAL_URL = `/api/items/forlookup/packges`;
const ACTIVE_PACKAGES_MODAL_URL = `/api/packages/forlookup/packages`;
const TRANSFER_DESTINATION_FACILITIES_MODAL_URL = `${origin({
  divertToNullOrigin: false,
})}/api/facilities/forlookup/forlicensedtransferdestinations`;
const TRANSFER_TRANSPORTER_FACILITIES_MODAL_URL = `${origin({
  divertToNullOrigin: false,
})}/api/facilities/forlookup/forlicensedtransfertransporters`;
const TRANSFER_PACKAGES_URL = `/api/packages/forlookup/transfers`;

const ACTIVE_PACKAGES_URL = `${origin({ divertToNullOrigin: false })}/api/packages`;
const INACTIVE_PACKAGES_URL = `${origin({ divertToNullOrigin: false })}/api/packages/inactive`;
const ON_HOLD_PACKAGES_URL = `${origin({ divertToNullOrigin: false })}/api/packages/onhold`;
const IN_TRANSIT_PACKAGES_URL = `${origin({ divertToNullOrigin: false })}/api/packages/intransit`;

const TAG_ORDER_HISTORY_URL = `${origin({ divertToNullOrigin: false })}/api/tagorders/history`;

const VEGETATIVE_PLANTS_URL = `${origin({ divertToNullOrigin: false })}/api/plants/vegetative`;
const FLOWERING_PLANTS_URL = `${origin({ divertToNullOrigin: false })}/api/plants/flowering`;
const INACTIVE_PLANTS_URL = `${origin({ divertToNullOrigin: false })}/api/plants/inactive`;

const ACTIVE_HARVESTS_URL = `${origin({ divertToNullOrigin: false })}/api/harvests`;
const INACTIVE_HARVESTS_URL = `${origin({ divertToNullOrigin: false })}/api/harvests/inactive`;

const PLANT_BATCHES_URL = `${origin({ divertToNullOrigin: false })}/api/plantbatches`;
const INACTIVE_PLANT_BATCHES_URL = `${origin({
  divertToNullOrigin: false,
})}/api/plantbatches/inactive`;

const INCOMING_TRANSFERS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/incoming?slt=Licensed&active=True`;
const INCOMING_INACTIVE_TRANSFERS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/incoming?slt=Licensed&active=False`;
const OUTGOING_TRANSFERS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/outgoing?slt=Licensed&activeOnly=True`;
const OUTGOING_INACTIVE_TRANSFERS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/outgoing/inactive?slt=Licensed`;
const REJECTED_TRANSFERS_URL = `${origin({ divertToNullOrigin: false })}/api/transfers/rejected`;
const LAYOVER_TRANSFERS_URL = `${origin({ divertToNullOrigin: false })}/api/transfers/layovers`;

const TRANSFER_DESTINATIONS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/destinations`; // ?id=39
const TRANSFER_DESTINATION_PACKAGES_URL = `${origin({
  divertToNullOrigin: false,
})}/api/transfers/destinations/packages`; // ?id=39

const LOCATIONS_URL = `${origin({ divertToNullOrigin: false })}/api/locations`;
const STRAINS_URL = `${origin({ divertToNullOrigin: false })}/api/strains`;
const ITEMS_URL = `${origin({ divertToNullOrigin: false })}/api/items`;

const ACTIVE_SALES_RECEIPTS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/sales/receipts/active`;
const INACTIVE_SALES_RECEIPTS_URL = `${origin({
  divertToNullOrigin: false,
})}/api/sales/receipts/inactive`;

const NOOP_URL = `${origin({ divertToNullOrigin: false })}/api/system/noop`;

/**
 * API WRITE
 */
const PACKAGE_ADJUST_URL = `${origin()}/api/packages/adjust`;
const PACKAGE_NOTE_URL = `${origin()}/api/packages/change/notes`;
const VOID_TAG_URL = `${origin()}/api/tags/void`;
const REORDER_TAGS_URL = `${origin()}/api/tagorders/create`;
const MOVE_PLANTS_URL = `${origin()}/api/plants/change/locations`;
const MOVE_PLANT_BATCHES_URL = `${origin()}/api/plantbatches/change/locations`;
const MOVE_PACKAGES_URL = `${origin()}/api/packages/change/locations`;
const HARVEST_PLANTS_URL = `${origin()}/api/plants/harvest`;
const MANICURE_PLANTS_URL = `${origin()}/api/plants/manicure`;
const DESTROY_PLANTS_URL = `${origin()}/api/plants/destroy/plants`;
const DESTROY_PLANT_BATCHES_URL = `${origin()}/api/plantbatches/destroy/plants`;
const REPLACE_PLANT_TAGS_URL = `${origin()}/api/plants/replacetags`;
const REPLACE_PLANT_BATCH_TAGS_URL = `${origin()}/api/plantbatches/replacetags`;
const FINALIZE_SALES_RECEIPTS_URL = `${origin()}/api/sales/receipts/finalize`;
const UNPACK_IMMATURE_PLANTS_URL = `${origin()}/api/packages/create/plantings`;
const PROMOTE_IMMATURE_PLANTS_URL = `${origin()}/api/plantbatches/trackplantwithtags`;
const GENERATE_API_KEY_URL = `${origin()}/api/users/apikeys/generate`;
const CREATE_PACKAGES_URL = `${origin()}/api/packages/create`;
const FINISH_PACKAGES_URL = `${origin()}/api/packages/finish`;
const CREATE_ITEMS_URL = `${origin()}/api/items/create`;
const CREATE_STRAINS_URL = `${origin()}/api/strains/create`;
const IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_URL = `${origin()}/api/plants/create/plantbatch/package`;
const IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL = `${origin()}/api/plantbatches/create/packages`;
const CREATE_TRANSFERS_URL = `${origin()}/api/transfers/create`;
const UPDATE_TRANSFERS_URL = `${origin()}/api/transfers/update`;
const UPLOAD_LAB_DOCUMENT_URL = `${origin()}/api/file/system/add/labtest/result/document`;
const ADD_LABTEST_DOCUMENT_TO_RESULT_URL = `${origin()}/api/labtests/upload/document`;

// DATAIMPORT
const DATAIMPORT_MOVE_PLANTS_URL = `${origin()}/api/dataimport/plants/change/locations`;

const DEFAULT_FETCH_POST_READ_OPTIONS = {
  method: "POST",
  timeout: 20000,
};

const DEFAULT_FETCH_POST_WRITE_OPTIONS = {
  method: "POST",
};

const DEFAULT_FETCH_GET_OPTIONS = {
  method: "GET",
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/javascript, */*; q=0.01",
};

enum UrlType {
  PACKAGES,
  REORDER_TAGS_MODAL,
  NEW_TRANSFER_MODAL,
  NEW_PACKAGE_MODAL,
  NEW_TRANSFER_TEMPLATE_MODAL,
  DESTROY_PLANT_BATCHES_MODAL,
  USER_PROFILE,
  LAB_RESULTS_BY_PACKAGE_ID,
  TRANSFER_HISTORY_BY_TRANSFER_ID,
  PACKAGE_HARVEST_HISTORY_BY_PACKAGE_ID,
  PACKAGE_HISTORY_BY_PACKAGE_ID,
  API_KEYS,
  DATAIMPORT,
  DATAIMPORT_HISTORY,
  HARVEST_HISTORY_BY_HARVEST_ID,
  NEW_ITEM_MODAL,
  MOVE_PACKAGES_MODAL,
  NEW_STRAIN_MODAL,
  WASTE_BY_LOCATION,
  ADJUST_PACKAGE,
  REMEDIATE_PACKAGE,
  CREATE_PLANTINGS_FROM_PACKAGE,
  CHANGE_PLANT_BATCH_GROWTH_PHASE,
  TRANSFER_DESTINATIONS_BY_TRANSFER_ID,
  TRANSFER_TRANSPORTER_DETAILS_BY_TRANSFER_ID,
  DESTINATION_PACKAGES_BY_DESTINATION_ID,
  DESTINATION_TRANSPORTERS_BY_DESTINATION_ID,
  PLANT_HISTORY_BY_PLANT_ID,
  PLANT_BATCH_HISTORY_BY_PLANT_BATCH_ID,
}

// function persistedAuthStateOrError(): IAuthState {
//     if (!store.state.authState) {
//         throw new Error('AuthState not available')
//     } else {
//         return store.state.authState;
//     }
// }

async function buildDynamicUrl(
  authState: IAuthState,
  urlType: UrlType,
  options: any = {}
): Promise<string> {
  switch (urlType) {
    case UrlType.REORDER_TAGS_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/admin/tagorders/addedit?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.NEW_TRANSFER_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/transfers/licensed/addedit?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.PACKAGES:
      return `${origin({ divertToNullOrigin: false })}/industry/${authState.license}/packages`;
    case UrlType.MOVE_PACKAGES_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/packages/change/locations?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.NEW_ITEM_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/admin/items/addedit?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.NEW_STRAIN_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/admin/strains/addedit?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.WASTE_BY_LOCATION:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/plants/waste/record/location?isModal=true&_=${new Date().getTime()}`;
    case UrlType.ADJUST_PACKAGE:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/packages/adjust?isModal=true&_=${new Date().getTime()}`;
    case UrlType.REMEDIATE_PACKAGE:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/packages/remediate?isModal=true&_=${new Date().getTime()}`;
    case UrlType.CREATE_PLANTINGS_FROM_PACKAGE:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/packages/create/plantings?isModal=true&_=${new Date().getTime()}`;
    case UrlType.CHANGE_PLANT_BATCH_GROWTH_PHASE:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/plantbatches/change/growthphase?isModal=true&_=${new Date().getTime()}`;
    case UrlType.NEW_PACKAGE_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/packages/new?isModal=true&_=${new Date().getTime()}`;
    case UrlType.DESTROY_PLANT_BATCHES_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/plantbatches/destroy/plants?isModal=true&_=${new Date().getTime()}`;
    case UrlType.NEW_TRANSFER_TEMPLATE_MODAL:
      return `${origin({ divertToNullOrigin: false })}/industry/${
        authState.license
      }/transfers/licensed/templates/addedit?isModal=true&adding=true&_=${new Date().getTime()}`;
    case UrlType.USER_PROFILE:
      return `${origin({ divertToNullOrigin: false })}/user/profile?licenseNumber=${
        authState.license
      }`;
    case UrlType.API_KEYS:
      return `${origin({ divertToNullOrigin: false })}/user/apikeys?licenseNumber=${
        authState.license
      }`;
    case UrlType.DATAIMPORT:
      return `${origin({ divertToNullOrigin: false })}/industry/${authState.license}/dataimport`;
    case UrlType.DATAIMPORT_HISTORY:
      return `${origin({ divertToNullOrigin: false })}/api/dataimport?type=${options.csvUpload}`;
    case UrlType.LAB_RESULTS_BY_PACKAGE_ID:
      if (!options?.packageId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/packages/labresults/byid?id=${
        options.packageId
      }`;
    case UrlType.PACKAGE_HISTORY_BY_PACKAGE_ID:
      if (!options?.packageId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/packages/history?id=${
        options.packageId
      }`;
    case UrlType.PLANT_BATCH_HISTORY_BY_PLANT_BATCH_ID:
      if (!options?.plantBatchId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/plantbatches/history?id=${
        options.plantBatchId
      }`;
    case UrlType.PLANT_HISTORY_BY_PLANT_ID:
      if (!options?.plantId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/plants/history?id=${options.plantId}`;
    case UrlType.PACKAGE_HARVEST_HISTORY_BY_PACKAGE_ID:
      if (!options?.packageId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/packages/sourceHarvest?id=${
        options.packageId
      }`;
    case UrlType.TRANSFER_HISTORY_BY_TRANSFER_ID:
      if (!options?.manifestNumber) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/transfers/history?id=${
        options.manifestNumber
      }`;
    case UrlType.TRANSFER_DESTINATIONS_BY_TRANSFER_ID:
      if (!options?.transferId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/transfers/destinations?id=${
        options.transferId
      }`;
    case UrlType.TRANSFER_TRANSPORTER_DETAILS_BY_TRANSFER_ID:
      if (!options?.transferId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/transfers/transporters/details?id=${
        options.transferId
      }`;
    case UrlType.DESTINATION_TRANSPORTERS_BY_DESTINATION_ID:
      if (!options?.destinationId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/transfers/destinations/transporters?id=${
        options.destinationId
      }`;
    case UrlType.DESTINATION_PACKAGES_BY_DESTINATION_ID:
      if (!options?.destinationId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/transfers/destinations/packages?id=${
        options.destinationId
      }`;
    case UrlType.HARVEST_HISTORY_BY_HARVEST_ID:
      if (!options?.harvestId) {
        throw new Error("Missing required URL options");
      }
      return `${origin({ divertToNullOrigin: false })}/api/harvests/history?id=${
        options.harvestId
      }`;
    default:
      throw new Error("Bad URL type");
  }
}

// async function buildAuthenticationHeaders({ includeXRequestedWith, apiVerificationToken }: { includeXRequestedWith: boolean, apiVerificationToken: string | null } = { includeXRequestedWith: true, apiVerificationToken: null }) {
async function buildAuthenticationHeaders(authState: IAuthState) {
  // const authState = persistedAuthStateOrError();

  const headers = {
    ApiVerificationToken: authState.apiVerificationToken,
    "X-Metrc-LicenseNumber": authState.license,
  };

  // if (includeXRequestedWith) {
  //     // @ts-ignore
  //     headers['X-Requested-With'] = 'XMLHttpRequest';
  // }

  return headers;
}

export class MetrcRequestManager implements IAtomicService {
  private _authState: IAuthState | null = null;

  async init(spoofedAuthState: IAuthState | null = null) {
    if (spoofedAuthState) {
      this._authState = spoofedAuthState;
    } else {
      this._authState = await authManager.authStateOrNull();
    }
  }

  get authStateOrError(): IAuthState {
    if (!this._authState) {
      throw new Error("AuthState not available");
    }

    return this._authState;
  }

  async getLoginPage() {
    return customAxios(LOGIN_URL, {
      ...DEFAULT_FETCH_GET_OPTIONS,
    });
  }

  async getEmployees(body: string) {
    return customAxios(EMPLOYEES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getAvailableTags(body: string) {
    return customAxios(AVAILABLE_TAGS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getUsedTags(body: string) {
    return customAxios(USED_TAGS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getVoidedTags(body: string) {
    return customAxios(VOIDED_TAGS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getLocations(body: string) {
    return customAxios(LOCATIONS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getItems(body: string) {
    return customAxios(ITEMS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getStrains(body: string) {
    return customAxios(STRAINS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getActiveHarvests(body: string) {
    return customAxios(ACTIVE_HARVESTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactiveHarvests(body: string) {
    return customAxios(INACTIVE_HARVESTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getHarvestHistory(body: string, harvestId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.HARVEST_HISTORY_BY_HARVEST_ID, {
        harvestId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getVegetativePlants(body: string) {
    return customAxios(VEGETATIVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getFloweringPlants(body: string) {
    return customAxios(FLOWERING_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactivePlants(body: string) {
    return customAxios(INACTIVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getPlantBatches(body: string) {
    return customAxios(PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactivePlantBatches(body: string) {
    return customAxios(INACTIVE_PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getActivePackages(body: string) {
    return customAxios(ACTIVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactivePackages(body: string) {
    return customAxios(INACTIVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      // timeout: 10000,
      axiosRetry: {
        retries: 10,
      },
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getOnHoldPackages(body: string) {
    return customAxios(ON_HOLD_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInTransitPackages(body: string) {
    return customAxios(IN_TRANSIT_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getIncomingTransfers(body: string) {
    return customAxios(INCOMING_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getIncomingInactiveTransfers(body: string) {
    return customAxios(INCOMING_INACTIVE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getOutgoingTransfers(body: string) {
    return customAxios(OUTGOING_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getOutgoingInactiveTransfers(body: string) {
    return customAxios(OUTGOING_INACTIVE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getRejectedTransfers(body: string) {
    return customAxios(REJECTED_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getLayoverTransfers(body: string) {
    return customAxios(LAYOVER_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createTransfers(body: string) {
    return customAxios(CREATE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async updateTransfers(body: string) {
    return customAxios(UPDATE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async transferDestinationFacilities(body: string) {
    return customAxios(TRANSFER_DESTINATION_FACILITIES_MODAL_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async transferTransporterFacilities(body: string) {
    return customAxios(TRANSFER_TRANSPORTER_FACILITIES_MODAL_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async transferDestinationFacilitiesAutocomplete(query: string) {
    return customAxios(TRANSFER_DESTINATION_FACILITIES_MODAL_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "*/*",
      },
      body: `request%5BTake%5D=10&request%5BFilter%5D%5BLogic%5D=or&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BField%5D=LicenseNumber&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BOperator%5D=contains&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BValue%5D=${query}&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BField%5D=FacilityName&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BOperator%5D=contains&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BValue%5D=${query}`,
    });
  }

  async transferTransporterFacilitiesAutocomplete(query: string) {
    return customAxios(TRANSFER_TRANSPORTER_FACILITIES_MODAL_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "*/*",
      },
      body: `request%5BTake%5D=10&request%5BFilter%5D%5BLogic%5D=or&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BField%5D=LicenseNumber&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BOperator%5D=contains&request%5BFilter%5D%5BFilters%5D%5B0%5D%5BValue%5D=${query}&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BField%5D=FacilityName&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BOperator%5D=contains&request%5BFilter%5D%5BFilters%5D%5B1%5D%5BValue%5D=${query}`,
    });
  }

  async getActiveSalesReceipts(body: string) {
    return customAxios(ACTIVE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactiveSalesReceipts(body: string) {
    return customAxios(INACTIVE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_READ_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getTestResults(body: string, packageId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.LAB_RESULTS_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getDestinationTransporters(body: string, destinationId: number) {
    return customAxios(
      await buildDynamicUrl(
        this.authStateOrError,
        UrlType.DESTINATION_TRANSPORTERS_BY_DESTINATION_ID,
        {
          destinationId,
        }
      ),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTransferDestinations(body: string, transferId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.TRANSFER_DESTINATIONS_BY_TRANSFER_ID, {
        transferId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTransferTransporterDetails(body: string, transferId: number) {
    return customAxios(
      await buildDynamicUrl(
        this.authStateOrError,
        UrlType.TRANSFER_TRANSPORTER_DETAILS_BY_TRANSFER_ID,
        {
          transferId,
        }
      ),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getDestinationPackages(body: string, destinationId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.DESTINATION_PACKAGES_BY_DESTINATION_ID, {
        destinationId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getPackageHistory(body: string, packageId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGE_HISTORY_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        // timeout: 10000,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getPackageHarvestHistory(body: string, packageId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGE_HARVEST_HISTORY_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_READ_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getPlantHistory(body: string, plantId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.PLANT_HISTORY_BY_PLANT_ID, {
        plantId,
      }),
      {
        ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getPlantBatchHistory(body: string, plantBatchId: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.PLANT_BATCH_HISTORY_BY_PLANT_BATCH_ID, {
        plantBatchId,
      }),
      {
        ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTransferHistory(body: string, manifestNumber: number) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.TRANSFER_HISTORY_BY_TRANSFER_ID, {
        manifestNumber,
      }),
      {
        ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTagOrderHistory(body: string) {
    return customAxios(TAG_ORDER_HISTORY_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getDataImportHistory(body: string, csvUpload: CsvUpload) {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.DATAIMPORT_HISTORY, { csvUpload }),
      {
        ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTagOrderHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.REORDER_TAGS_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getUserProfileHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.USER_PROFILE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getApiKeyHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.API_KEYS), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getDataImportHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.DATAIMPORT), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async noop() {
    return customAxios(NOOP_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "*/*",
      },
    });
  }

  async addPackageNote(body: string) {
    return customAxios(PACKAGE_NOTE_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async voidTag(body: string) {
    return customAxios(VOID_TAG_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "*/*",
      },
      body,
    });
  }

  // async uploadMovePlantsCsv(body: string) {
  //     // https://stackoverflow.com/questions/35192841/how-do-i-post-with-multipart-form-data-using-fetch

  //     return customAxios(DATAIMPORT_MOVE_PLANTS_URL, {
  //         ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
  //         // @ts-ignore
  //         headers: {
  //             ...(await buildAuthenticationHeaders({
  //                 includeXRequestedWith: false,
  //                 apiVerificationToken: await authManager.dataimportApiVerificationToken()
  //             })),
  //             'Accept': '*/*; q=0.5, application/json'
  //         },
  //         body
  //     });
  // }

  async reorderTags(body: string) {
    return customAxios(REORDER_TAGS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async movePlants(body: string) {
    return customAxios(MOVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async movePlantBatches(body: string) {
    return customAxios(MOVE_PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async movePackages(body: string) {
    return customAxios(MOVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async harvestPlants(body: string) {
    return customAxios(HARVEST_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async manicurePlants(body: string) {
    return customAxios(MANICURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createPackages(body: string) {
    return customAxios(CREATE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async finishPackages(body: string) {
    return customAxios(FINISH_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async adjustPackages(body: string) {
    return customAxios(PACKAGE_ADJUST_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async replacePlantTags(body: string) {
    return customAxios(REPLACE_PLANT_TAGS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async replacePlantBatchTags(body: string) {
    return customAxios(REPLACE_PLANT_BATCH_TAGS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async unpackImmaturePlants(body: string) {
    return customAxios(UNPACK_IMMATURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async packImmaturePlants(body: string) {
    return customAxios(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async immaturePlantPackagesFromMotherPlant(body: string) {
    return customAxios(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async immaturePlantPackagesFromMotherPlantBatch(body: string) {
    return customAxios(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async promoteImmaturePlants(body: string) {
    return customAxios(PROMOTE_IMMATURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async destroyPlants(body: string) {
    return customAxios(DESTROY_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async destroyPlantBatches(body: string) {
    return customAxios(DESTROY_PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createItems(body: string) {
    return customAxios(CREATE_ITEMS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createStrains(body: string) {
    return customAxios(CREATE_STRAINS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async generateApiKey() {
    return customAxios(GENERATE_API_KEY_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
    });
  }

  async finalizeSalesReceipts(body: string) {
    return customAxios(FINALIZE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async uploadLabDocument(body: FormData) {
    return customAxios(UPLOAD_LAB_DOCUMENT_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        Accept: "text/html, */*; q=0.01",
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
      },
      body,
    });
  }

  async assignLabDocument(body: string) {
    return customAxios(ADD_LABTEST_DOCUMENT_TO_RESULT_URL, {
      ...DEFAULT_FETCH_POST_WRITE_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getNewTransferHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_TRANSFER_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getPackagesHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGES), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getMovePackagesHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.MOVE_PACKAGES_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getDestroyPlantBatchesHTML() {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.DESTROY_PLANT_BATCHES_MODAL),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }

  async getNewItemHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_ITEM_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getNewStrainHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_STRAIN_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getWasteByLocationHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.WASTE_BY_LOCATION), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getAdjustPackageHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.ADJUST_PACKAGE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getRemediatePackageHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.REMEDIATE_PACKAGE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getCreatePlantingsFromPackageHTML() {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.CREATE_PLANTINGS_FROM_PACKAGE),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }

  async getChangePlantBatchGrowthPhaseHTML() {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.CHANGE_PLANT_BATCH_GROWTH_PHASE),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }

  async getNewPackageHTML() {
    return customAxios(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_PACKAGE_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getNewTransferTemplateHTML() {
    return customAxios(
      await buildDynamicUrl(this.authStateOrError, UrlType.NEW_TRANSFER_TEMPLATE_MODAL),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }
}

export const primaryMetrcRequestManager = new MetrcRequestManager();
