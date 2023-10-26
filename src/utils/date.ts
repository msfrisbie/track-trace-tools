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

export function isoDatetimedDifferenceInMinutes(isoTimestamp1: string, isoTimestamp2: string) {
  const date1 = new Date(isoTimestamp1);
  const date2 = new Date(isoTimestamp2);

  const differenceInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  return differenceInMilliseconds / 1000 / 60;
}

export function isoDatetimeToLocalDate(isoDateTime: string): string {
  if (!isoDateTime.includes("T")) {
    // This is just a date, do not convert from UTC
    return isoDateTime;
  }

  const date = new Date(isoDateTime);

  return date.toLocaleDateString("sv");
}

interface CustodyInterval {
  start: string | null;
  end: string | null;
}

export function custodyDatetimeRangesOrError(
  arrivalDatetimes: string[],
  departureDatetimes: string[]
): CustodyInterval[] {
  throw new Error("Disabled");

  const sortedArrivalDatetimes = [...arrivalDatetimes].sort();
  const sortedDepartureDatetimes = [...departureDatetimes].sort();

  if (sortedArrivalDatetimes.length === 0 && sortedDepartureDatetimes.length === 0) {
    return [];
  }

  if (Math.abs(sortedArrivalDatetimes.length - sortedDepartureDatetimes.length) > 1) {
    throw new Error(
      `Length mismatch: ${sortedArrivalDatetimes.length}/${sortedDepartureDatetimes.length}`
    );
  }

  const intervals: CustodyInterval[] = [];

  // If it's well formed, shift() the min value off to generate next set.
  // Any deviation means an error

  let shiftArrivalNext = true;

  // If there's a start departure, begin with an infinite
  if (sortedDepartureDatetimes.length > sortedArrivalDatetimes.length) {
    // Custody begins at packaging?
    shiftArrivalNext = false;

    // 215064 multiple departure dates
  }

  while (sortedDepartureDatetimes.length > 0 || sortedArrivalDatetimes.length > 0) {
    if (sortedArrivalDatetimes.length === 0) {
      // pop min value, check expected next
    }

    // intervals.push(nextInterval);
  }

  return intervals;
}

enum TransferGroup {
  ARRIVAL = "ARRIVAL",
  DEPARTURE = "DEPARTURE",
}

export function interleaveGroupedTransferDatetimes({
  arrivalDatetimes,
  departureDatetimes,
}: {
  arrivalDatetimes: string[];
  departureDatetimes: string[];
}): { datetime: string; group: TransferGroup }[] {
  return [
    ...arrivalDatetimes.map((datetime) => ({
      datetime,
      group: TransferGroup.ARRIVAL,
    })),
    ...departureDatetimes.map((datetime) => ({
      datetime,
      group: TransferGroup.DEPARTURE,
    })),
  ].sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export function interleavedDatetimesAreValid({
  arrivalDatetimes,
  departureDatetimes,
}: {
  arrivalDatetimes: string[];
  departureDatetimes: string[];
}): { valid: boolean; message?: string } {
  if (arrivalDatetimes.length === 0 && departureDatetimes.length === 0) {
    // Never left custody
    return {
      valid: true,
    };
  }

  if (Math.abs(arrivalDatetimes.length - departureDatetimes.length) > 1) {
    return {
      valid: false,
      message: `Length mismatch: ${arrivalDatetimes.length}/${departureDatetimes.length}`,
    };
  }

  // Guaranteed to have a length of at least 1
  const interleavedDatetimes = interleaveGroupedTransferDatetimes({
    arrivalDatetimes,
    departureDatetimes,
  });

  let expectedNextGroup: TransferGroup = interleavedDatetimes[0].group;

  for (const { datetime, group } of interleavedDatetimes) {
    if (expectedNextGroup !== group) {
      return {
        valid: false,
        message: `Interleaved groups are not alternating. ${datetime}/${group}`,
      };
    }

    expectedNextGroup =
      expectedNextGroup === TransferGroup.ARRIVAL ? TransferGroup.DEPARTURE : TransferGroup.ARRIVAL;
  }

  return { valid: true };
}

export function isCustodiedDatetimeOrError({
  arrivalDatetimes,
  departureDatetimes,
  targetDatetime,
}: {
  arrivalDatetimes: string[];
  departureDatetimes: string[];
  targetDatetime: string;
}): boolean {
  if (arrivalDatetimes.length === 0 && departureDatetimes.length === 0) {
    // If never transferred, package was always owned
    return true;
  }

  const interleaved = interleaveGroupedTransferDatetimes({ arrivalDatetimes, departureDatetimes });

  if (!interleavedDatetimesAreValid({ arrivalDatetimes, departureDatetimes }).valid) {
    const first = interleaved[0];
    const last = interleaved[interleaved.length - 1];
    // Badly formatted, but still make an attempt based on start/end
    if (targetDatetime < first.datetime) {
      return first.group === TransferGroup.DEPARTURE;
    }

    if (targetDatetime > last.datetime) {
      return last.group === TransferGroup.ARRIVAL;
    }

    throw new Error("Interleaved datetimes are invalid");
  }

  let prev = null;
  let next = interleaved[0];

  for (let i = 0; i < interleaved.length + 1; ++i) {
    if ((!prev || prev.datetime < targetDatetime) && (!next || next.datetime > targetDatetime)) {
      if (prev && prev.group === TransferGroup.ARRIVAL) {
        return true;
      }

      if (next && next.group === TransferGroup.DEPARTURE) {
        return true;
      }
    }

    prev = interleaved[i];
    next = interleaved[i + 1] ?? null;
  }

  return false;
}
