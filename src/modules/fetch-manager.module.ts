import fetchRetry from "fetch-retry";

const fetchWithTimeout = async function (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
): Promise<Response> {
  const controller = new AbortController();
  const signal = controller.signal;

  const timeout = 60000;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeoutId));
};
// TODO this is bullshit, switch over to axios
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
    if (error !== null || [400, 429, 500, 501, 502, 503].includes(response?.status as number)) {
      console.log(`Error on attempt #${attempt + 1} [${error}]`);
      return true;
    }

    throw error;
  },
};
