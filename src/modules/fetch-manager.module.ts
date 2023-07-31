import axios, { AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.code === "ECONNABORTED" || axiosRetry.isNetworkOrIdempotentRequestError(error)) {
      return true;
    }

    return [400, 429, 500, 501, 502, 503].includes(error.response?.status || -1);
  },
});

// fetch() adapter
export const customFetch = function (
  url: string,
  init?:
    | {
        method: string;
        body?: string;
        signal?: AbortSignal;
        headers?: { [key: string]: string };
        timeout?: number;
        axiosRetry?: {
          retries: number;
        };
      }
    | undefined
) {
  const axiosConfig: AxiosRequestConfig = {
    url,
  };

  if (init) {
    axiosConfig.method = init.method?.toLowerCase();
    axiosConfig.headers = init.headers;
    axiosConfig.data = init.body;
    axiosConfig.signal = init.signal;
    axiosConfig.timeout = init.timeout;
    axiosConfig["axios-retry"] = init.axiosRetry;
  }
  return axios.request(axiosConfig);
};
