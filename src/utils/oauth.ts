import { ChromeStorageKeys } from "@/consts";
import { IGoogleOAuthOAuthUserInfo } from "@/interfaces";
import { isBackgroundExecutionContext } from "./context";

if (!isBackgroundExecutionContext) {
  throw new Error("This should only be used in the background!");
}

export async function getAuthTokenOrError({
  interactive = false,
}: {
  interactive?: boolean;
} = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      {
        interactive,
      },
      (token) => {
        if (token) {
          resolve(token);
        } else {
          reject("Coult not obtain OAuth token");
        }
      }
    );
  });
}

// This returns empty strings without the identity.email permission
export async function getProfileUserInfoOrError(): Promise<chrome.identity.UserInfo> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
      if (userInfo) {
        resolve(userInfo);
      } else {
        reject("Coult not obtain OAuth user info");
      }
    });
  });
}

export async function expireAuthToken() {
  // If no auth token is found, silently exit
  try {
    const token: string = await getAuthTokenOrError();

    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);

    chrome.identity.removeCachedAuthToken({ token }, () => {});

    chrome.storage.local.remove(ChromeStorageKeys.OAUTH_USER_DATA);
  } catch (e) {
    console.error(e);
    return;
  }
}

export async function getOAuthUserInfoOrError({
  interactive = false,
}: {
  interactive?: boolean;
} = {}): Promise<IGoogleOAuthOAuthUserInfo> {
  const token: string = await getAuthTokenOrError({ interactive });

  return new Promise(async (resolve, reject) => {
    try {
      const result = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token="${token}`,
        {
          method: "GET",
          // @ts-ignore
          async: true,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          contentType: "json",
        }
      ).then((response) => response.json());

      chrome.storage.local.set({ [ChromeStorageKeys.OAUTH_USER_DATA]: result });

      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}
