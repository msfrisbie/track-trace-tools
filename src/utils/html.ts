import {
  IExtractedApiKeyData,
  IExtractedAuthData,
  IExtractedContactData,
  IExtractedDataImportApiVerificationTokenData,
  IExtractedITagOrderData,
  IExtractedRepeaterData,
  ITagOrderModalData,
  MetrcTagType,
} from "@/interfaces";
import { extractIContactInfoFromITagOrderModalData } from "./address";
import { debugLogFactory } from "./debug";

const debugLog = debugLogFactory("utils/html.ts");

export interface ExtractedData {
  authData?: IExtractedAuthData;
  tagOrderData?: IExtractedITagOrderData;
  contactData?: IExtractedContactData;
  apiKeyData?: IExtractedApiKeyData;
  repeaterData?: IExtractedRepeaterData;
  dataimportApiVerificationTokenData?: IExtractedDataImportApiVerificationTokenData;
}

// NOTE: For capture groups to work, "g" flag cannot be used
const TAG_MAX_REGEX = new RegExp(/repeaterData: JSON\.parse\('(.*)'\),$/, "m");
const AJAX_SETUP_REGEX = new RegExp(/\$\.ajaxSetup\(([^;]*)\)\;/, "s");
const INITIALIZE_DO_NOT_SHOW_REGEX = new RegExp(/metrc\.initializeDoNotShow\(([^;]*)\)\;/, "s");
const IDENTIY_HREF_REGEX = new RegExp(/.user.profile.licenseNumber=(.*)/);
const REPEATER_DATA_REGEX = new RegExp(/repeaterData: (.*),/);

export enum ExtractionType {
  AUTH_DATA = "AUTH_DATA",
  DATAIMPORT_API_VERIFICATION_TOKEN = "DATAIMPORT_API_VERIFICATION_TOKEN",
  TAG_ORDER_DATA = "TAG_ORDER_DATA",
  CONTACT_DATA = "CONTACT_DATA",
  API_KEY_DATA = "API_KEY_DATA",
  REPEATER_DATA = "REPEATER_DATA",
}

function checkITagOrderModalData(data: ITagOrderModalData) {
  if (typeof data.Details[0].MaxOrderQuantity !== "number") {
    throw new Error("Bad tag order modal data (order qty)");
  }

  if (typeof data.Shipping.Address.Street1 !== "string") {
    throw new Error("Bad tag order modal data (address)");
  }
}

function extractMaxTagOrderSize(data: ITagOrderModalData, tagType: MetrcTagType): number {
  for (let orderParam of data.Details) {
    if (orderParam.TagType === tagType) {
      return orderParam.MaxOrderQuantity;
    }
  }

  console.error("Could not find max order size");
  return 0;
}

function decodeData(data: string): string {
  // Taken from https://stackoverflow.com/questions/31715030/javascript-hex-escape-character-decoding
  return data.replace(/\\x([0-9A-F]{2})/gi, function () {
    return String.fromCharCode(parseInt(arguments[1], 16));
  });
}

// export function getAuthDataScriptTextOrNull(): string | null {
//     const scripts = document.querySelectorAll(
//         "script[type='text/javascript']"
//     ) as any;

//     for (let script of scripts) {
//         const match = script.textContent.match(AJAX_SETUP_REGEX);

//         if (match && match[1]) {
//             return script.textContent;
//         }
//     }

//     return null;
// }

// export async function getDataImportAuthDataScriptTextOrNull(): Promise<string | null> {
//     const container = document.createElement('div');

//     container.innerHTML = await primaryMetrcRequestManager.getDataImportHtml();

//     const scripts = document.querySelectorAll(
//         "script[type='text/javascript']"
//     ) as any;

//     for (let script of scripts) {
//         const match = script.textContent.match(AJAX_SETUP_REGEX);

//         if (match && match[1]) {
//             return script.textContent;
//         }
//     }

//     return null;
// }

// export function getEmailAnchorTextOrNull(): string | null {
//     const anchors = document.querySelectorAll("a[href]") as any;

//     for (let anchor of anchors) {
//         const href = (anchor as any).getAttribute("href");
//         const match = href.match(IDENTIY_HREF_REGEX);

//         if (match && (anchor as any).textContent.includes("@")) {
//             return anchor.textContent;
//         }
//     }

//     return null;
// }

// function extractImpl(extractionType: ExtractionType, plaintext: string | null): ExtractedData | null {
//     if (!plaintext) {
//         throw 'Must provide HTML for this extraction type';
//     }

//     switch (extractionType) {
//         case ExtractionType.TAG_ORDER_DATA:
//             return extractTagOrderData(plaintext);

//         case ExtractionType.CONTACT_DATA:
//             return extractContactData(plaintext);

//         case ExtractionType.API_KEY_DATA:
//             return extractApiKeyData(plaintext);

//         case ExtractionType.AUTH_DATA:
//             return extractAuthData(plaintext);

//         case ExtractionType.DATAIMPORT_API_VERIFICATION_TOKEN:
//             return extractDataImportApiKey(plaintext);

//         default:
//             throw new Error('Bad extractHtmlDataImpl extraction type');
//     }

//     return null;
// }

function extractAuthData(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const scripts = container.querySelectorAll(
    // Diffing OR and CA source reveals that the script tags
    // may or may not have the [type='text/javascript'] attribute.
    "script"
  ) as any;

  let authDataScriptText = null;

  for (let script of scripts) {
    const match = script.textContent.match(AJAX_SETUP_REGEX);

    if (match && match[1]) {
      authDataScriptText = script.textContent;
      break;
    }
  }

  let authData: IExtractedAuthData | null = null;

  let extractedAuthDataDict = null;
  let extractedIdentityArray = null;

  if (authDataScriptText) {
    let authMatch = authDataScriptText.match(AJAX_SETUP_REGEX);

    if (authMatch && authMatch[1]) {
      let authJson = authMatch[1];

      // @ts-ignore
      authJson = authJson.replaceAll("headers", '"headers"');

      // @ts-ignore
      authJson = authJson.replaceAll("'", '"');

      extractedAuthDataDict = JSON.parse(authJson);
    } else {
      console.error("Could not match auth data regex");
    }

    let identityMatch = authDataScriptText.match(INITIALIZE_DO_NOT_SHOW_REGEX);

    if (identityMatch && identityMatch[1]) {
      const identityString = identityMatch[1];

      // @ts-ignore
      let identityJson = identityString.replaceAll("'", '"');

      identityJson = `[${identityJson}]`;

      extractedIdentityArray = JSON.parse(identityJson);
    } else {
      console.error("Could not match identity data regex");
    }
  }

  if (!!extractedAuthDataDict && !!extractedIdentityArray) {
    authData = {
      license: extractedAuthDataDict.headers["X-Metrc-LicenseNumber"],
      apiVerificationToken: extractedAuthDataDict.headers["ApiVerificationToken"],
      identity: extractedIdentityArray[0],
    };

    // Sanity check
    if (extractedIdentityArray[1] !== authData.license) {
      console.error(
        "Unexpected license mismatch:",
        extractedIdentityArray[1],
        extractedAuthDataDict.license
      );
    }
  }

  if (!authData) {
    return null;
  } else {
    return { authData };
  }
}

function extractTagOrderData(html: string) {
  let tagOrderMatch = html.match(TAG_MAX_REGEX);

  if (tagOrderMatch && tagOrderMatch[1]) {
    try {
      let tagOrderData = JSON.parse(decodeData(tagOrderMatch[1]));

      checkITagOrderModalData(tagOrderData);

      return {
        tagOrderData: {
          maxPlantOrderSize: extractMaxTagOrderSize(tagOrderData, "CannabisPlant"),
          maxPackageOrderSize: extractMaxTagOrderSize(tagOrderData, "CannabisPackage"),
          contactInfo: extractIContactInfoFromITagOrderModalData(tagOrderData),
        } as IExtractedITagOrderData,
      };
    } catch (e) {
      console.error("Error extracting max tags");
    }
  }

  console.error("Could not find max tags");

  return null;
}

function extractContactData(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const email: string | null =
    container.querySelector("input#email")?.getAttribute("value") || null;

  const phoneNumber: string | null =
    container.querySelector('input[name="model[PhoneNumber]"]')?.getAttribute("value") || null;

  return {
    contactData: {
      email,
      phoneNumber,
    },
  };
}

function extractApiKeyData(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const apiKey = container.querySelector("#current_apikey")?.getAttribute("value");

  if (!apiKey) {
    return null;
  }

  return {
    apiKeyData: {
      apiKey,
    },
  };
}

function extractDataImportApiKey(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const lines = html.split("\n");

  for (let line of lines) {
    if (line.includes(`xhr.setRequestHeader('ApiVerificationToken'`)) {
      const regex = /',\s'(.*)'/;
      const match = line.match(regex);

      if (match && match[1]) {
        return {
          dataimportApiVerificationTokenData: {
            apiVerificationToken: match[1],
          },
        };
      }
    }
  }

  return null;
}

function extractRepeaterData(html: string) {
  const repeaterDataMatch = html.match(REPEATER_DATA_REGEX);

  if (repeaterDataMatch) {
    const sliced = repeaterDataMatch[1].slice(12, -2);

    // Metrc includes a blob of escaped JSON
    // (This is manifest v3 incompatible)
    // const parsedRepeaterData = eval(repeaterDataMatch[1]);
    // @ts-ignore
    const parsedRepeaterData = JSON.parse(decodeURIComponent(sliced.replaceAll("\\x", "%")));

    debugLog(async () => [Object.keys(parsedRepeaterData)]);
    // debugLog(async () => [parsedRepeaterData])

    return {
      repeaterData: {
        parsedRepeaterData,
      },
    };
  }

  return null;
}

export function extract(extractionType: ExtractionType, plaintext: string): ExtractedData | null {
  if (!plaintext) {
    throw new Error("Must provide HTML for this extraction type");
  }

  let data = null;

  switch (extractionType) {
    case ExtractionType.TAG_ORDER_DATA:
      data = extractTagOrderData(plaintext);
      break;

    case ExtractionType.CONTACT_DATA:
      data = extractContactData(plaintext);
      break;

    case ExtractionType.API_KEY_DATA:
      data = extractApiKeyData(plaintext);
      break;

    case ExtractionType.AUTH_DATA:
      data = extractAuthData(plaintext);
      break;

    case ExtractionType.DATAIMPORT_API_VERIFICATION_TOKEN:
      data = extractDataImportApiKey(plaintext);
      break;

    case ExtractionType.REPEATER_DATA:
      data = extractRepeaterData(plaintext);
      break;

    default:
      throw new Error("Bad extraction type");
  }

  return data;
}
