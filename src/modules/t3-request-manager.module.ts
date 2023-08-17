import { IAtomicService } from "@/interfaces";
import { AxiosError } from "axios";
import { authManager } from "./auth-manager.module";
import { customAxios } from "./fetch-manager.module";

const BASE_URL = "https://api.trackandtrace.tools/";

const CLIENT_KEY_PATH = "client";
const VERIFY_TEST_PATH = "verify/test";

const DEFAULT_POST_HEADERS = {
  "Content-Type": "application/json",
};

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
