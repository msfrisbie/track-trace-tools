import { IAtomicService } from "@/interfaces";
import { IAnnouncementData } from "@/store/page-overlay/modules/announcements/interfaces";
import { AxiosError } from "axios";
import { authManager } from "./auth-manager.module";
import { customAxios } from "./fetch-manager.module";

const BASE_URL = "https://api.trackandtrace.tools/";

const CLIENT_KEY_PATH = "client";
const VERIFY_TEST_PATH = "verify/test";
const FACILITIES_PATH = "facilities";
const ANNOUNCEMENTS_PATH = "announcements";

const DEFAULT_POST_HEADERS = {
  "Content-Type": "application/json",
};
const DEFAULT_GET_HEADERS = {};

class T3RequestManager implements IAtomicService {
  async init() {}

  async loadClientDataOrError(clientKey: string): Promise<{
    clientName: string | null;
    values: { [key: string]: any };
  }> {
    try {
      const response = await customAxios(BASE_URL + CLIENT_KEY_PATH, {
        method: "POST",
        headers: DEFAULT_POST_HEADERS,
        body: JSON.stringify({ client_key: clientKey }),
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
        values: values,
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
}

export let t3RequestManager = new T3RequestManager();
