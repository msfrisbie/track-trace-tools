export async function getAuthTokenOrError(interactive: boolean = true): Promise<string> {
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
    const token: string = await getAuthTokenOrError(false);

    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);

    chrome.identity.removeCachedAuthToken({ token }, () => {});
  } catch (e) {
    console.error(e);
    return;
  }
}

interface GoogleOAuthIdentityData {
  id: string;
  email: string;
  verified_email: boolean;
  name: string; // Full Name
  given_name: string; // First Name
  family_name: string; // Last Name
  picture: string; // "https://lh3.googleusercontent.com/a/..."
  locale: string; //"en"
}

export async function getIdentityDataOrError(): Promise<GoogleOAuthIdentityData> {
  const token: string = await getAuthTokenOrError(false);

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

      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}
