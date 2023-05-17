import { IAtomicService, IAuthState } from "@/interfaces";
import { origin } from "@/modules/environment.module";
import { customFetch, IRetryOptions, retryDefaults } from "@/modules/fetch-manager.module";
import { CsvUpload } from "@/types";
import { authManager } from "./auth-manager.module";

const LOGIN_URL = origin({ divertToNullOrigin: false }) + "/log-in";

/**
 * API READ
 */
const AVAILABLE_TAGS_URL = origin({ divertToNullOrigin: false }) + "/api/tags/available";
const USED_TAGS_URL = origin({ divertToNullOrigin: false }) + "/api/tags/used";
const VOIDED_TAGS_URL = origin({ divertToNullOrigin: false }) + "/api/tags/voided";

const ACTIVE_PACKAGES_URL = origin({ divertToNullOrigin: false }) + "/api/packages";
const INACTIVE_PACKAGES_URL = origin({ divertToNullOrigin: false }) + "/api/packages/inactive";
const ON_HOLD_PACKAGES_URL = origin({ divertToNullOrigin: false }) + "/api/packages/onhold";
const IN_TRANSIT_PACKAGES_URL = origin({ divertToNullOrigin: false }) + "/api/packages/intransit";

const TAG_ORDER_HISTORY_URL = origin({ divertToNullOrigin: false }) + "/api/tagorders/history";

const VEGETATIVE_PLANTS_URL = origin({ divertToNullOrigin: false }) + "/api/plants/vegetative";
const FLOWERING_PLANTS_URL = origin({ divertToNullOrigin: false }) + "/api/plants/flowering";
const INACTIVE_PLANTS_URL = origin({ divertToNullOrigin: false }) + "/api/plants/inactive";

const ACTIVE_HARVESTS_URL = origin({ divertToNullOrigin: false }) + "/api/harvests";
const INACTIVE_HARVESTS_URL = origin({ divertToNullOrigin: false }) + "/api/harvests/inactive";

const PLANT_BATCHES_URL = origin({ divertToNullOrigin: false }) + "/api/plantbatches";
const INACTIVE_PLANT_BATCHES_URL =
  origin({ divertToNullOrigin: false }) + "/api/plantbatches/inactive";

const INCOMING_TRANSFERS_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/incoming?slt=Licensed&active=True";
const INCOMING_INACTIVE_TRANSFERS_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/incoming?slt=Licensed&active=False";
const OUTGOING_TRANSFERS_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/outgoing?slt=Licensed&active=True";
const OUTGOING_INACTIVE_TRANSFERS_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/outgoing?slt=Licensed&active=False";
const REJECTED_TRANSFERS_URL = origin({ divertToNullOrigin: false }) + "/api/transfers/rejected";

const TRANSFER_DESTINATIONS_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/destinations"; // TODO ?id=39
const TRANSFER_DESTINATION_PACKAGES_URL =
  origin({ divertToNullOrigin: false }) + "/api/transfers/destinations/packages"; // TODO ?id=39

const LOCATIONS_URL = origin({ divertToNullOrigin: false }) + "/api/locations";
const STRAINS_URL = origin({ divertToNullOrigin: false }) + "/api/strains";
const ITEMS_URL = origin({ divertToNullOrigin: false }) + "/api/items";

const ACTIVE_SALES_RECEIPTS_URL =
  origin({ divertToNullOrigin: false }) + "/api/sales/receipts/active";
const INACTIVE_SALES_RECEIPTS_URL =
  origin({ divertToNullOrigin: false }) + "/api/sales/receipts/inactive";

const NOOP_URL = origin({ divertToNullOrigin: false }) + "/api/system/noop";

/**
 * API WRITE
 */
const PACKAGE_NOTE_URL = origin() + "/api/packages/change/notes";
const VOID_TAG_URL = origin() + "/api/tags/void";
const REORDER_TAGS_URL = origin() + "/api/tagorders/create";
const MOVE_PLANTS_URL = origin() + "/api/plants/change/locations";
const MOVE_PACKAGES_URL = origin() + "/api/packages/change/locations";
const HARVEST_PLANTS_URL = origin() + "/api/plants/harvest";
const MANICURE_PLANTS_URL = origin() + "/api/plants/manicure";
const DESTROY_PLANTS_URL = origin() + "/api/plants/destroy/plants";
const REPLACE_PLANT_TAGS_URL = origin() + "/api/plants/replacetags";
const REPLACE_PLANT_BATCH_TAGS_URL = origin() + "/api/plantbatches/replacetags";
const FINALIZE_SALES_RECEIPTS_URL = origin() + "/api/sales/receipts/finalize";
const UNPACK_IMMATURE_PLANTS_URL = origin() + "/api/packages/create/plantings";
const PROMOTE_IMMATURE_PLANTS_URL = origin() + "/api/plantbatches/trackplantwithtags";
const GENERATE_API_KEY_URL = origin() + "/api/users/apikeys/generate";
const CREATE_PACKAGES_URL = origin() + "/api/packages/create";
const FINISH_PACKAGES_URL = origin() + "/api/packages/finish";
const CREATE_ITEMS_URL = origin() + "/api/items/create";
const CREATE_STRAINS_URL = origin() + "/api/strains/create";
const IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_URL =
  origin() + "/api/plants/create/plantbatch/package";
const IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL =
  origin() + "/api/plantbatches/create/packages";
const CREATE_TRANSFERS_URL = origin() + "/api/transfers/create";
const UPDATE_TRANSFERS_URL = origin() + "/api/transfers/update";

// DATAIMPORT
const DATAIMPORT_MOVE_PLANTS_URL = origin() + "/api/dataimport/plants/change/locations";

const DEFAULT_FETCH_POST_OPTIONS = {
  method: "POST",
  ...retryDefaults,
};

const DEFAULT_FETCH_GET_OPTIONS = {
  method: "GET",
  ...retryDefaults,
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
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/admin/tagorders/addedit?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.NEW_TRANSFER_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/transfers/licensed/addedit?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.PACKAGES:
      return origin({ divertToNullOrigin: false }) + `/industry/${authState.license}/packages`;
    case UrlType.MOVE_PACKAGES_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/packages/change/locations?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.NEW_ITEM_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/admin/items/addedit?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.NEW_STRAIN_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/admin/strains/addedit?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.WASTE_BY_LOCATION:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/plants/waste/record/location?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.ADJUST_PACKAGE:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${authState.license}/packages/adjust?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.REMEDIATE_PACKAGE:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${authState.license}/packages/remediate?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.CREATE_PLANTINGS_FROM_PACKAGE:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/packages/create/plantings?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.CHANGE_PLANT_BATCH_GROWTH_PHASE:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/plantbatches/change/growthphase?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.NEW_PACKAGE_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${authState.license}/packages/new?isModal=true&_=${new Date().getTime()}`
      );
    case UrlType.NEW_TRANSFER_TEMPLATE_MODAL:
      return (
        origin({ divertToNullOrigin: false }) +
        `/industry/${
          authState.license
        }/transfers/licensed/templates/addedit?isModal=true&adding=true&_=${new Date().getTime()}`
      );
    case UrlType.USER_PROFILE:
      return (
        origin({ divertToNullOrigin: false }) + `/user/profile?licenseNumber=${authState.license}`
      );
    case UrlType.API_KEYS:
      return (
        origin({ divertToNullOrigin: false }) + `/user/apikeys?licenseNumber=${authState.license}`
      );
    case UrlType.DATAIMPORT:
      return origin({ divertToNullOrigin: false }) + `/industry/${authState.license}/dataimport`;
    case UrlType.DATAIMPORT_HISTORY:
      return origin({ divertToNullOrigin: false }) + `/api/dataimport?type=${options.csvUpload}`;
    case UrlType.LAB_RESULTS_BY_PACKAGE_ID:
      if (!options || !options.packageId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/packages/labresults/byid?id=${options.packageId}`
      );
    case UrlType.PACKAGE_HISTORY_BY_PACKAGE_ID:
      if (!options || !options.packageId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) + `/api/packages/history?id=${options.packageId}`
      );
    case UrlType.PLANT_BATCH_HISTORY_BY_PLANT_BATCH_ID:
      if (!options || !options.plantBatchId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/plantbatches/history?id=${options.plantBatchId}`
      );
    case UrlType.PACKAGE_HARVEST_HISTORY_BY_PACKAGE_ID:
      if (!options || !options.packageId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/packages/sourceHarvest?id=${options.packageId}`
      );
    case UrlType.TRANSFER_HISTORY_BY_TRANSFER_ID:
      if (!options || !options.manifestNumber) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/transfers/history?id=${options.manifestNumber}`
      );
    case UrlType.TRANSFER_DESTINATIONS_BY_TRANSFER_ID:
      if (!options || !options.transferId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/transfers/destinations?id=${options.transferId}`
      );
    case UrlType.TRANSFER_TRANSPORTER_DETAILS_BY_TRANSFER_ID:
      if (!options || !options.transferId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/transfers/transporters/details?id=${options.transferId}`
      );
    case UrlType.DESTINATION_TRANSPORTERS_BY_DESTINATION_ID:
      if (!options || !options.destinationId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/transfers/destinations/transporters?id=${options.destinationId}`
      );
    case UrlType.DESTINATION_PACKAGES_BY_DESTINATION_ID:
      if (!options || !options.destinationId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) +
        `/api/transfers/destinations/packages?id=${options.destinationId}`
      );
    case UrlType.HARVEST_HISTORY_BY_HARVEST_ID:
      if (!options || !options.harvestId) {
        throw new Error("Missing required URL options");
      }
      return (
        origin({ divertToNullOrigin: false }) + `/api/harvests/history?id=${options.harvestId}`
      );
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
    return customFetch(LOGIN_URL, {
      ...DEFAULT_FETCH_GET_OPTIONS,
    });
  }

  async getAvailableTags(body: string) {
    return customFetch(AVAILABLE_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getUsedTags(body: string) {
    return customFetch(USED_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getVoidedTags(body: string) {
    return customFetch(VOIDED_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getLocations(body: string) {
    return customFetch(LOCATIONS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getItems(body: string) {
    return customFetch(ITEMS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getStrains(body: string) {
    return customFetch(STRAINS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getActiveHarvests(body: string) {
    return customFetch(ACTIVE_HARVESTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactiveHarvests(body: string) {
    return customFetch(INACTIVE_HARVESTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getHarvestHistory(body: string, harvestId: number) {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.HARVEST_HISTORY_BY_HARVEST_ID, {
        harvestId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getVegetativePlants(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    return customFetch(VEGETATIVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getFloweringPlants(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    return customFetch(FLOWERING_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getInactivePlants(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    return customFetch(INACTIVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getPlantBatches(body: string) {
    return customFetch(PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactivePlantBatches(body: string) {
    return customFetch(INACTIVE_PLANT_BATCHES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getActivePackages(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(ACTIVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getInactivePackages(body: string) {
    return customFetch(INACTIVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getOnHoldPackages(body: string) {
    return customFetch(ON_HOLD_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInTransitPackages(body: string) {
    return customFetch(IN_TRANSIT_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getIncomingTransfers(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(INCOMING_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getIncomingInactiveTransfers(
    body: string,
    retryOptions: IRetryOptions = {},
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(INCOMING_INACTIVE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      ...retryOptions,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
      signal,
    });
  }

  async getOutgoingTransfers(body: string) {
    return customFetch(OUTGOING_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getOutgoingInactiveTransfers(body: string) {
    return customFetch(OUTGOING_INACTIVE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getRejectedTransfers(body: string) {
    return customFetch(REJECTED_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createTransfers(body: string) {
    return customFetch(CREATE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async updateTransfers(body: string) {
    return customFetch(UPDATE_TRANSFERS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getActiveSalesReceipts(body: string) {
    return customFetch(ACTIVE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getInactiveSalesReceipts(body: string) {
    return customFetch(INACTIVE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getTestResults(body: string, packageId: number) {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.LAB_RESULTS_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getDestinationTransporters(
    body: string,
    destinationId: number,
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(
        this.authStateOrError,
        UrlType.DESTINATION_TRANSPORTERS_BY_DESTINATION_ID,
        {
          destinationId,
        }
      ),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getTransferDestinations(body: string, transferId: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.TRANSFER_DESTINATIONS_BY_TRANSFER_ID, {
        transferId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getTransferTransporterDetails(
    body: string,
    transferId: number,
    abortTimeout: number = 30000
  ) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(
        this.authStateOrError,
        UrlType.TRANSFER_TRANSPORTER_DETAILS_BY_TRANSFER_ID,
        {
          transferId,
        }
      ),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getDestinationPackages(body: string, destinationId: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.DESTINATION_PACKAGES_BY_DESTINATION_ID, {
        destinationId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getPackageHistory(body: string, packageId: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGE_HISTORY_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getPackageHarvestHistory(body: string, packageId: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGE_HARVEST_HISTORY_BY_PACKAGE_ID, {
        packageId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getPlantBatchHistory(body: string, plantBatchId: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.PLANT_BATCH_HISTORY_BY_PLANT_BATCH_ID, {
        plantBatchId,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getTransferHistory(body: string, manifestNumber: number, abortTimeout: number = 30000) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), abortTimeout);

    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.TRANSFER_HISTORY_BY_TRANSFER_ID, {
        manifestNumber,
      }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
        signal,
      }
    );
  }

  async getTagOrderHistory(body: string) {
    return customFetch(TAG_ORDER_HISTORY_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getDataImportHistory(body: string, csvUpload: CsvUpload) {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.DATAIMPORT_HISTORY, { csvUpload }),
      {
        ...DEFAULT_FETCH_POST_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          ...JSON_HEADERS,
        },
        body,
      }
    );
  }

  async getTagOrderHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.REORDER_TAGS_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getUserProfileHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.USER_PROFILE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getApiKeyHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.API_KEYS), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getDataImportHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.DATAIMPORT), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async noop() {
    return customFetch(NOOP_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "*/*",
      },
    });
  }

  async addPackageNote(body: string) {
    return customFetch(PACKAGE_NOTE_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async voidTag(body: string) {
    return customFetch(VOID_TAG_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
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

  //     return customFetch(DATAIMPORT_MOVE_PLANTS_URL, {
  //         ...DEFAULT_FETCH_POST_OPTIONS,
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
    return customFetch(REORDER_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async movePlants(body: string) {
    return customFetch(MOVE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async movePackages(body: string) {
    return customFetch(MOVE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async harvestPlants(body: string) {
    return customFetch(HARVEST_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async manicurePlants(body: string) {
    return customFetch(MANICURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createPackages(body: string) {
    return customFetch(CREATE_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async finishPackages(body: string) {
    return customFetch(FINISH_PACKAGES_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async replacePlantTags(body: string) {
    return customFetch(REPLACE_PLANT_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async replacePlantBatchTags(body: string) {
    return customFetch(REPLACE_PLANT_BATCH_TAGS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async unpackImmaturePlants(body: string) {
    return customFetch(UNPACK_IMMATURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async packImmaturePlants(body: string) {
    return customFetch(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async immaturePlantPackagesFromMotherPlant(body: string) {
    return customFetch(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async immaturePlantPackagesFromMotherPlantBatch(body: string) {
    return customFetch(IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async promoteImmaturePlants(body: string) {
    return customFetch(PROMOTE_IMMATURE_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async destroyPlants(body: string) {
    return customFetch(DESTROY_PLANTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createItems(body: string) {
    return customFetch(CREATE_ITEMS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async createStrains(body: string) {
    return customFetch(CREATE_STRAINS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async generateApiKey() {
    return customFetch(GENERATE_API_KEY_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
    });
  }
  async finalizeSalesReceipts(body: string) {
    return customFetch(FINALIZE_SALES_RECEIPTS_URL, {
      ...DEFAULT_FETCH_POST_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        ...JSON_HEADERS,
      },
      body,
    });
  }

  async getNewTransferHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_TRANSFER_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getPackagesHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.PACKAGES), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getMovePackagesHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.MOVE_PACKAGES_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getNewItemHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_ITEM_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getNewStrainHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_STRAIN_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getWasteByLocationHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.WASTE_BY_LOCATION), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getAdjustPackageHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.ADJUST_PACKAGE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getRemediatePackageHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.REMEDIATE_PACKAGE), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getCreatePlantingsFromPackageHTML() {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.CREATE_PLANTINGS_FROM_PACKAGE),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }

  async getChangePlantBatchGrowthPhaseHTML() {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.CHANGE_PLANT_BATCH_GROWTH_PHASE),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }

  async getNewPackageHTML() {
    return customFetch(await buildDynamicUrl(this.authStateOrError, UrlType.NEW_PACKAGE_MODAL), {
      ...DEFAULT_FETCH_GET_OPTIONS,
      // @ts-ignore
      headers: {
        ...(await buildAuthenticationHeaders(this.authStateOrError)),
        Accept: "text/html, */*; q=0.01",
      },
    });
  }

  async getNewTransferTemplateHTML() {
    return customFetch(
      await buildDynamicUrl(this.authStateOrError, UrlType.NEW_TRANSFER_TEMPLATE_MODAL),
      {
        ...DEFAULT_FETCH_GET_OPTIONS,
        // @ts-ignore
        headers: {
          ...(await buildAuthenticationHeaders(this.authStateOrError)),
          Accept: "text/html, */*; q=0.01",
        },
      }
    );
  }
}

export let primaryMetrcRequestManager = new MetrcRequestManager();
