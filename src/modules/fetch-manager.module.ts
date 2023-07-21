import fetchRetry from "fetch-retry";

export const customFetch = fetchRetry(fetch);

// https://www.npmjs.com/package/fetch-retry
export const retryDefaults = {
  retries: 5,
  retryDelay(attempt: number, error: Error | null, response: Response | null) {
    // Exponential backoff
    return Math.pow(1.5, attempt) * 800;
  },
  retryOn(attempt: number, error: Error | null, response: Response | null) {
    // retry on any network error, or 4xx or 5xx status codes
    // 401 indicates no permissions - do not retry
    if (error !== null || [400, 429, 500, 501, 502, 503].includes(response?.status || -1)) {
      console.log(`retrying, attempt number ${attempt + 1}`);
      return true;
    }
    return false;
  },
};
