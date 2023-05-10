const ALLOW_TRANSFER_TOOL_ACCESS_HOSTNAMES: string[] = [
  "ca.metrc.com",
  "mi.metrc.com",
  "testing-az.metrc.com",
];
const DENY_TRANSFER_TOOL_ACCESS_REGEXPS: RegExp[] = [];

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

export function isLicenseEligibleForItemTemplateTools({
  license,
}: {
  license: string | null;
}): boolean {
  if (!license) {
    return false;
  }

  return false;
}

export function isIdentityEligibleForTransferTools({ hostname }: { hostname: string }): boolean {
  // if (!ALLOW_TRANSFER_TOOL_ACCESS_HOSTNAMES.includes(hostname)) {
  //   return false;
  // }

  // if (regExpMatchOrNull({ value: identity, regExps: DENY_TRANSFER_TOOL_ACCESS_REGEXPS })) {
  //   return false;
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

  return true;
}
