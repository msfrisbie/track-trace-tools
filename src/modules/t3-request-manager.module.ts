import { IAtomicService } from "@/interfaces";
import { customAxios } from "./fetch-manager.module";

const BASE_URL = "https://api.trackandtrace.tools/";

const CLIENT_KEY_PATH = "client/values/";

const DEFAULT_POST_HEADERS = {
  "Content-Type": "application/json",
};

class T3RequestManager implements IAtomicService {
  async init() {}

  loadClientValues(clientKey: string) {
    return customAxios(BASE_URL + CLIENT_KEY_PATH, {
      method: "POST",
      headers: DEFAULT_POST_HEADERS,
      body: JSON.stringify({ client_key: clientKey }),
    });
  }
}

export let t3RequestManager = new T3RequestManager();
