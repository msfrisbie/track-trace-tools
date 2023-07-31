// import fetchRetry from "fetch-retry";

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

export interface IRetryOptions {
  retries?: number;
  retryDelay?: number | ((attempt: number, error: any, response: any) => number);
  retryOn?: number[];
}

// export const customFetch = fetchRetry(fetch);

// fetch() adapter
export const customFetch = function (
  url: string,
  init?:
    | {
        method: string;
        body?: string;
        retries?: number;
        retryDelay?: number | ((attempt: number, error: any, response: any) => number);
        retryOn?: number[];
        signal?: AbortSignal;
        headers?: { [key: string]: string };
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
  }
  return axios.request(axiosConfig);
};
