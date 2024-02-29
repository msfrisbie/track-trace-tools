/**
 *
 * @param isotime 05:49:20.842Z
 * @returns 05:49:20
 */
export function isotimeToNaiveTime(isotime: string): string {
  if (!isotime) {
    return isotime;
  }

  return isotime.split(".")[0];
}

/**
 *
 * @param naivetime 05:49:20
 * @returns 05:49:20.842Z
 */
export function naiveTimeToIsotime(naivetime: string): string {
  if (!naivetime) {
    return naivetime;
  }

  return `${naivetime}.000Z`;
}

export function localDateTimeIso(d: Date = new Date()): string {
  // .toISOString() returns UTC, which messes up date selection

  const year = d.getFullYear();
  const paddedMonth = (d.getMonth() + 1).toString().padStart(2, "0");
  const paddedDay = d.getDate().toString().padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}

export function isotimeToTimeAgoExpression(isoTimestamp: string): string {
  const timeStampDate = new Date(isoTimestamp);
  const now = new Date();
  const secondsPast = (now.getTime() - timeStampDate.getTime()) / 1000;

  if (secondsPast < 60) {
    // less than a minute
    return `${Math.round(secondsPast)}s ago`;
  }
  if (secondsPast < 3600) {
    // less than an hour
    return `${Math.round(secondsPast / 60)}m ago`;
  }
  if (secondsPast < 86400) {
    // less than a day
    return `${Math.round(secondsPast / 3600)} hours ago`;
  }
  if (secondsPast < 2592000) {
    // less than a month
    return `${Math.round(secondsPast / 86400)} days ago`;
  }
  if (secondsPast < 31536000) {
    // less than a year
    return `${Math.round(secondsPast / 2592000)} months ago`;
  }
  return `${Math.round(secondsPast / 31536000)} years ago`;
}
