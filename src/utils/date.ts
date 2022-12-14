export function todayIsodate(): string {
  // get today's date in the user's timezone but formatted as ISO8601 (YYYY-MM-DD)
  // This works because the Sweden locale uses the ISO 8601 format.
  return new Date().toLocaleDateString("sv");
}

export function nowIsotime(): string {
  return new Date().toLocaleTimeString("sv") + ".000Z";
}

export function submitDateFromIsodate(isodate: string): string {
  // 2021-06-05
  const [year, month, day] = isodate.split("-");

  return `${month}/${day}/${year}`;
}

export function getIsoDateStringFromIsoDatetime(isoDatetime: string): string {
  if (!isoDatetime.includes("T")) {
    throw new Error("This does not look like an isoDatetime");
  }

  return isoDatetime.split("T")[0];
}

export function getIsoTimeStringFromIsoDatetime(isoDatetime: string): string {
  if (!isoDatetime.includes("T")) {
    throw new Error("This does not look like an isoDatetime");
  }

  return isoDatetime.split("T")[1];
}
