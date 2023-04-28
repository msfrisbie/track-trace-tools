import fetchRetry from "fetch-retry";

export interface IRetryOptions {
  retries?: number;
  retryDelay?: number | ((attempt: number, error: any, response: any) => number);
  retryOn?: number[];
}

export const customFetch = fetchRetry(fetch);

// https://www.npmjs.com/package/fetch-retry
export const retryDefaults: IRetryOptions = {
  retries: 5,
  retryDelay(attempt: number, error: any, response: any) {
    // Exponential backoff
    return Math.pow(1.5, attempt) * 800;
  },
  // 401 indicates no permissions - do not retry
  retryOn: [400, 429, 500, 501, 502, 503],
};
