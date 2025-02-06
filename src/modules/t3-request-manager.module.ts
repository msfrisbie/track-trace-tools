import { ChromeStorageKeys } from "@/consts";
import { IAtomicService, IXlsxFile } from "@/interfaces";
import { IAnnouncementData } from "@/store/page-overlay/modules/announcements/interfaces";
import { AxiosError } from "axios";
import { authManager } from "./auth-manager.module";
import { facilityManager } from "./facility-manager.module";
import { customAxios } from "./fetch-manager.module";
import { isDevelopment } from "./environment.module";

const BASE_URL = isDevelopment() ? "http://127.0.0.1:5000/" : "https://api.trackandtrace.tools/";
// const BASE_URL = "https://api.trackandtrace.tools/";

const CLIENT_KEY_PATH = "client";
const VERIFY_TEST_PATH = "verify/test";
const FACILITIES_PATH = "facilities";
const ANNOUNCEMENTS_PATH = "announcements";
const T3PLUS_PATH = "plus_users/status";
const FLAGS_PATH = "flags";
const GOOGLE_MAPS_DIRECTIONS = "metrc/directions";
const GENERATE_REPORT_PATH = "reports/generate";
const DOWNLOAD_REPORT_PATH = "reports/download";
const EMAIL_REPORT_PATH = "reports/email";
const STORE_LABEL_DATA_LIST_PATH = "file/label-data";
const RENDER_LABEL_PDF = "file/labels";
const SESSION_AUTH_PATH = "v2/auth/session";
const AUTH_CHECK_PATH = "v2/auth/check";
const TOKEN_REFRESH_PATH = "v2/auth/refresh";
const LABEL_TEMPLATE_LAYOUTS_PATH = "v2/files/labels/template-layouts";
const LABEL_CONTENT_LAYOUTS_PATH = "v2/files/labels/content-layouts";
const GENERATE_LABELS_PATH = "v2/files/labels/generate";
const GENERATE_ACTIVE_PACKAGE_LABELS_PATH = "v2/files/labels/packages/active";

const DEFAULT_POST_HEADERS = {
  "Content-Type": "application/json",
};
const DEFAULT_GET_HEADERS = {};

class T3RequestManager implements IAtomicService {
  _t3AccessToken: string | null = null;

  _t3RefreshToken: string | null = null;

  async init() {
    const result = await chrome.storage.local.get([
      ChromeStorageKeys.T3_ACCESS_TOKEN,
      ChromeStorageKeys.T3_REFRESH_TOKEN,
    ]);

    this.t3AccessToken = result[ChromeStorageKeys.T3_ACCESS_TOKEN] || null;
    this.t3RefreshToken = result[ChromeStorageKeys.T3_REFRESH_TOKEN] || null;
  }

  get t3AccessToken(): string | null {
    return this._t3AccessToken;
  }

  get t3RefreshToken(): string | null {
    return this._t3RefreshToken;
  }

  set t3AccessToken(token: string | null) {
    this._t3AccessToken = token;
    chrome.storage.local.set({ [ChromeStorageKeys.T3_ACCESS_TOKEN]: token });
  }

  set t3RefreshToken(token: string | null) {
    this._t3RefreshToken = token;
    chrome.storage.local.set({ [ChromeStorageKeys.T3_REFRESH_TOKEN]: token });
  }

  clearTokens() {
    this.t3AccessToken = null;
    this.t3RefreshToken = null;
  }

  async loadClientDataOrError(clientKey: string): Promise<{
    clientName: string | null;
    values: { [key: string]: any };
  }> {
    try {
      const response = await customAxios(BASE_URL + CLIENT_KEY_PATH, {
        method: "POST",
        headers: DEFAULT_POST_HEADERS,
        body: JSON.stringify({
          client_key: clientKey,
          username: (await authManager.authStateOrError()).identity,
          hostname: window.location.hostname,
          active_facility: (await authManager.authStateOrError()).license,
          facilities: await facilityManager.ownedFacilitiesOrError(),
        }),
      });

      const { client_name, values } = response.data;

      if (!client_name) {
        throw new Error("Missing client_name");
      }

      if (!values) {
        throw new Error("Missing values");
      }

      return {
        clientName: client_name,
        values,
      };
    } catch (e) {
      // Only overwrite values if server explicitly indicates a 401
      if (e instanceof AxiosError && e.response?.status === 401) {
        return {
          clientName: null,
          values: {},
        };
      }

      throw new Error("Error fetching client values. Declining to override.");
    }
  }

  async loadT3plus(): Promise<any[]> {
    const authState = await authManager.authStateOrError();

    const response = await customAxios(BASE_URL + T3PLUS_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify({ metrc_username: authState.identity }),
    });

    return response.data;
  }

  async loadFlags(): Promise<{ [key: string]: string }> {
    const response = await customAxios(BASE_URL + FLAGS_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
    });

    return response.data;
  }

  async loadDirections({
    origin,
    destination,
  }: {
    origin: string;
    destination: string;
  }): Promise<{ directions: string }> {
    const response = await customAxios(BASE_URL + GOOGLE_MAPS_DIRECTIONS, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify({
        origin,
        destination,
      }),
    });

    return response.data;
  }

  async generateAndDownloadReport({ xlsxFile }: { xlsxFile: IXlsxFile }) {
    const response = await customAxios(BASE_URL + GENERATE_REPORT_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify(xlsxFile),
      responseType: "json",
    });

    window.open(`${BASE_URL}${DOWNLOAD_REPORT_PATH}/${response.data.report_id}`, "_blank");

    return response;
  }

  async generateAndEmailReport({
    xlsxFile,
    email,
    extraHtml,
  }: {
    xlsxFile: IXlsxFile;
    email: string;
    extraHtml: string | null;
  }) {
    const response = await customAxios(BASE_URL + GENERATE_REPORT_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify(xlsxFile),
      responseType: "json",
    });

    const emailResponse = fetch(BASE_URL + EMAIL_REPORT_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify({
        email,
        extra_html: extraHtml ?? "",
        report_id: response.data.report_id,
      }),
    });

    return emailResponse;
  }

  // async generateLabelPdf({
  //   labelDataList,
  //   templateId,
  //   layoutId,
  //   download,
  // }: {
  //   labelDataList: ILabelData[];
  //   templateId: string;
  //   layoutId: string;
  //   download: boolean;
  // }) {
  //   const response = await customAxios(BASE_URL + STORE_LABEL_DATA_LIST_PATH, {
  //     method: "POST",
  //     headers: DEFAULT_POST_HEADERS,
  //     body: JSON.stringify({ labelDataList }),
  //     responseType: "json",
  //   });

  //   window.open(
  //     `${BASE_URL}${RENDER_LABEL_PDF}/${
  //       response.data.labelDataListId
  //     }?templateId=${templateId}&layoutId=${layoutId}&disposition=${
  //       download ? "attachment" : "inline"
  //     }`,
  //     "_blank"
  //   );
  // }

  async loadAnnouncements(): Promise<IAnnouncementData[]> {
    const response = await customAxios(BASE_URL + ANNOUNCEMENTS_PATH, {
      method: "GET",
      headers: DEFAULT_GET_HEADERS,
    });

    return response.data;
  }

  async upsertFacilities(licenses: string[]) {
    const data = {
      hostname: window.location.hostname,
      licenses,
    };

    return customAxios(BASE_URL + FACILITIES_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify(data),
    });
  }

  async testVerify() {
    const cookies = await authManager.cookies();

    const data = {
      cookies,
      domain: window.location.hostname,
    };

    console.log(data);

    return customAxios(BASE_URL + VERIFY_TEST_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify(data),
    });
  }

  async t3SessionAuthOrError() {
    // If the user is not authenticated, we cannot use the browser session
    const authState = await authManager.authStateOrError();
    const cookies = await authManager.cookies();

    const facilities = await facilityManager.ownedFacilitiesOrError();

    const cookieDict: { [key: string]: string } = {};

    for (const cookie of cookies) {
      cookieDict[cookie.name] = cookie.value;
    }

    const payload: {
      username: string;
      hostname: string;
      cookies: { [key: string]: string };
      facilities: {
        facilityLicenseNumber: string;
        facilityName: string;
      }[];
      apiVerificationToken: string;
    } = {
      username: authState.identity,
      hostname: window.location.hostname,
      cookies: cookieDict,
      facilities: facilities.map((x) => ({
        facilityLicenseNumber: x.licenseNumber,
        facilityName: x.licenseName,
      })),
      apiVerificationToken: authState.apiVerificationToken,
    };

    const response = await customAxios(BASE_URL + SESSION_AUTH_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to authenticate: ${response.data}`);
    }

    const { accessToken, refreshToken } = response.data;

    this.t3AccessToken = accessToken;
    this.t3RefreshToken = refreshToken;
  }

  async t3SessionRefresh() {
    return customAxios(BASE_URL + TOKEN_REFRESH_PATH, {
      method: "POST",
      headers: {
        ...DEFAULT_POST_HEADERS,
        Authorization: `Bearer ${this._t3RefreshToken}`,
      },
    });
  }

  async t3AuthCheck() {
    return customAxios(BASE_URL + AUTH_CHECK_PATH, {
      method: "POST",
      headers: {
        ...DEFAULT_POST_HEADERS,
        Authorization: `Bearer ${this._t3AccessToken}`,
      },
    });
  }

  async getLabelTemplateLayouts() {
    return customAxios(BASE_URL + LABEL_TEMPLATE_LAYOUTS_PATH, {
      method: "GET",
      headers: {
        ...DEFAULT_POST_HEADERS,
        Authorization: `Bearer ${this._t3AccessToken}`,
      },
    });
  }

  async getLabelContentLayouts() {
    return customAxios(BASE_URL + LABEL_CONTENT_LAYOUTS_PATH, {
      method: "GET",
      headers: {
        ...DEFAULT_POST_HEADERS,
        Authorization: `Bearer ${this._t3AccessToken}`,
      },
    });
  }

  async generateLabelPdf(data: {
    labelTemplateLayoutId: string;
    labelContentLayoutId: string;
    labelContentData: { [key: string]: string }[];
  }) {
    return customAxios(
      `${BASE_URL}${GENERATE_LABELS_PATH}?licenseNumber=${
        (await authManager.authStateOrError()).license
      }`,
      {
        method: "POST",
        headers: {
          ...DEFAULT_POST_HEADERS,
          Authorization: `Bearer ${this._t3AccessToken}`,
        },
        axiosRetry: {
          retries: 0,
        },
        body: JSON.stringify(data),
        responseType: "blob",
      }
    );
  }

  async generateActivePackageLabelPdf(data: {
    labelTemplateLayoutId: string;
    labelContentLayoutId: string;
    data: string[];
  }) {
    return customAxios(
      `${BASE_URL}${GENERATE_ACTIVE_PACKAGE_LABELS_PATH}?licenseNumber=${
        (await authManager.authStateOrError()).license
      }`,
      {
        method: "POST",
        headers: {
          ...DEFAULT_POST_HEADERS,
          Authorization: `Bearer ${this._t3AccessToken}`,
        },
        axiosRetry: {
          retries: 0,
        },
        body: JSON.stringify(data),
        responseType: "blob",
      }
    );
  }
}

export const t3RequestManager = new T3RequestManager();
