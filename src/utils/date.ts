import store from "@/store/page-overlay/index";

export function todayIsodate(): string {
  // get today's date in the user's timezone but formatted as ISO8601 (YYYY-MM-DD)
  // This works because the Sweden locale uses the ISO 8601 format.
  return new Date().toLocaleDateString("sv");
}

export function nowIsotime(): string {
  return new Date().toLocaleTimeString("sv") + ".000Z";
}

export function submitDateFromIsodate(isodate: string): string {
  // NOTE: it appears that Metrc is now submitting dates in ISO format.
  // Leaving this alone for now, but this should be changed into a NOOP.

  if (store.state.settings.useIsoDateFormatForSubmit) {
    return isodate;
  }

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

export function getIsoDateFromOffset(
  offset: number,
  isoDatetime: string = new Date().toISOString()
): string {
  const d = new Date(isoDatetime);
  return new Date(d.setDate(d.getDate() + offset)).toISOString();
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  if (startDate > endDate) {
    throw new Error("Invalid startDate/endDate pair");
  }

  let nextDate = startDate;

  while (true) {
    if (nextDate > endDate) {
      break;
    }

    dates.push(nextDate);

    nextDate = getIsoDateFromOffset(1, nextDate).split("T")[0];
  }

  return dates;
}

export function isodateToSlashDate(isodate: string): string {
  const [year, month, day] = isodate.split("-");
  return `${month}/${day}/${year}`;
}
