import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import fetchRetry from 'fetch-retry';

const client = axios.create({
  timeout: 180000,
});

axiosRetry(client, {
  shouldResetTimeout: true,
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.code && ['ECONNABORTED', 'ERR_CANCELED'].includes(error.code)) {
      return true;
    }

    if (axiosRetry.isNetworkOrIdempotentRequestError(error)) {
      return true;
    }

    return [400, 429, 500, 501, 502, 503].includes(error.response?.status ?? -1);
  },
  onRetry(retryCount, error, requestConfig) {},
});

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

// Service workers cannot use Axios
export const customFetch = fetchRetry(fetch);

// fetch() adapter
export const customAxios = function (
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
    | undefined,
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
    axiosConfig['axios-retry'] = init.axiosRetry;
  }
  return client.request(axiosConfig);
};
