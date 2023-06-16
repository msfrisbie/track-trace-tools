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
  if (!store.state.settings.useLegacyDateFormatForSubmit) {
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

  return normalizeIsodate(isoDatetime);
}

export function getIsoTimeStringFromIsoDatetime(isoDatetime: string): string {
  if (!isoDatetime.includes("T")) {
    throw new Error("This does not look like an isoDatetime");
  }

  return normalizeIsodate(isoDatetime);
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

    nextDate = normalizeIsodate(getIsoDateFromOffset(1, nextDate));
  }

  return dates;
}

export function isodateToSlashDate(isodate: string): string {
  const [year, month, day] = isodate.split("-");
  return `${month}/${day}/${year}`;
}

// Might be date, or datetime. Idempotent date return.
export function normalizeIsodate(x: string): string {
  return x.split("T")[0];
}

export function isWeekend(isoDate: string) {
  const dateParts = normalizeIsodate(isoDate).split("-");
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // Month is zero-based
  const day = parseInt(dateParts[2]);

  const date = new Date();
  date.setUTCFullYear(year);
  date.setUTCMonth(month);
  date.setUTCDate(day);

  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}
