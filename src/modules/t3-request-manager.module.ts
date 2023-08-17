import { IAtomicService } from "@/interfaces";
import { authManager } from "./auth-manager.module";
import { customAxios } from "./fetch-manager.module";

// const BASE_URL = "https://api.trackandtrace.tools/";
const BASE_URL = "http://127.0.0.1:5000/";

const CLIENT_KEY_PATH = "client";
const VERIFY_TEST_PATH = "verify/test";

const DEFAULT_POST_HEADERS = {
  "Content-Type": "application/json",
};

class T3RequestManager implements IAtomicService {
  async init() {}

  async loadClientValues(clientKey: string) {
    return customAxios(BASE_URL + CLIENT_KEY_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify({ client_key: clientKey }),
    });
  }

  async testVerify() {
    const cookies = await authManager.cookies();

    const data = {
      cookies,
      domain: window.location.hostname
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
