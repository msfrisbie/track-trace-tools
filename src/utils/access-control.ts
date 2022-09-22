const ALLOW_TRANSFER_TOOL_ACCESS_HOSTNAMES: string[] = ["ca.metrc.com", "mi.metrc.com"];

const ALLOW_PACKAGE_SPLIT_TOOL_ACCESS_HOSTNAMES: string[] = ["ca.metrc.com"];
const ALLOW_LISTING_ACCESS_HOSTNAMES: string[] = ["ca.metrc.com"];
const ALLOW_ITEM_TEMPLATE_ACCESS_LICENSES: string[] = [
  "CDPH-10002837",
  "C11-0001002-LIC",
  "C12-0000020-LIC",
];

const DENY_TRANSFER_TOOL_ACCESS_REGEXPS: RegExp[] = [].map(hostnameToRegExp);

const DENY_TTT_ACCESS_EMAIL_HOSTNAME_REGEXPS: RegExp[] = [
  "365cannabis.com",
  "backboneiq.com",
  "canix.com",
  "cultivera.com",
  "distru.com",
  "entrc.co",
  "fishbowlinventory.com",
  "flourishsoftware.com",
  "flowhub.com",
  "getgrowflow.com",
  "metrc.com",
  "mjplatform.com",
  "roshi.me",
  "trellisgrows.com",
  "trym.io",
  "surgeforward.com",
].map(hostnameToRegExp);

const DENY_TTT_ACCESS_WEBSITE_HOSTNAME_REGEXPS: RegExp[] = ["testing-[a-z]+.metrc.com"].map(
  (x) => new RegExp(x)
);

const DENY_REPORTS_ACCESS_HOSTNAMES: string[] = ["mi.metrc.com"];

// Adds coverage to any possible subdomain
function hostnameToRegExp(hostname: string): RegExp {
  return new RegExp(`@((.+)\\.)?${hostname}`);
}

function regExpMatchOrNull({
  value,
  regExps,
  extraHostnames = [],
  extraRegExps = [],
}: {
  value: string | null;
  regExps: RegExp[];
  extraHostnames?: string[];
  extraRegExps?: RegExp[];
}): RegExp | null {
  if (!value) {
    return null;
  }

  const mergedRegExps: RegExp[] = [
    ...regExps,
    ...extraRegExps,
    ...extraHostnames.map(hostnameToRegExp),
  ];

  if (mergedRegExps.length === 0) {
    throw new Error("Must match against at least one RegExp");
  }

  for (const regExp of mergedRegExps) {
    if (value.match(regExp)) {
      return regExp;
    }
  }

  return null;
}

export function isIdentityEligibleForReports({
  identity,
  hostname,
}: {
  identity: string | null;
  hostname: string;
}): boolean {
  if (!identity) {
    return false;
  }

  if (DENY_REPORTS_ACCESS_HOSTNAMES.includes(hostname)) {
    return false;
  }

  return true;
}

export function isLicenseEligibleForItemTemplateTools({
  license,
}: {
  license: string | null;
}): boolean {
  if (!license) {
    return false;
  }

  if (!ALLOW_ITEM_TEMPLATE_ACCESS_LICENSES.includes(license)) {
    return false;
  }

  return true;
}

export function isIdentityEligibleForTransferTools({
  identity,
  hostname,
}: {
  identity: string | null;
  hostname: string;
}): boolean {
  if (!identity) {
    return false;
  }

  if (!ALLOW_TRANSFER_TOOL_ACCESS_HOSTNAMES.includes(hostname)) {
    return false;
  }

  // if (regExpMatchOrNull({ value: identity, regExps: DENY_TRANSFER_TOOL_ACCESS_REGEXPS })) {
  //     return false;
  // }

  return true;
}

export function isIdentityEligibleForSplitTools({
  identity,
  hostname,
}: {
  identity: string | null;
  hostname: string;
}): boolean {
  if (!identity) {
    return false;
  }

  return true;
}

export function isIdentityAllowedToUseTtt({
  identity,
  hostname,
}: {
  identity: string;
  hostname: string;
}): boolean {
  if (!identity) {
    return false;
  }

  if (regExpMatchOrNull({ value: hostname, regExps: DENY_TTT_ACCESS_WEBSITE_HOSTNAME_REGEXPS })) {
    return false;
  }

  if (regExpMatchOrNull({ value: identity, regExps: DENY_TTT_ACCESS_EMAIL_HOSTNAME_REGEXPS })) {
    return false;
  }

  return true;
}

export function isIdentityEligibleForListings({
  identity,
  hostname,
}: {
  identity: string | null;
  hostname: string;
}): boolean {
  if (!identity) {
    return false;
  }

  if (ALLOW_LISTING_ACCESS_HOSTNAMES.includes(hostname)) {
    return true;
  }

  return false;
}
