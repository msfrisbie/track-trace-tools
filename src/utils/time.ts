/**
 * 
 * @param isotime 05:49:20.842Z
 * @returns 05:49:20
 */
export function isotimeToNaiveTime(isotime: string): string {
    if (!isotime) {
        return isotime;
    }

    return isotime.split('.')[0];
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

    return naivetime + '.000Z'
}

export function localDateTimeIso(d: Date = new Date()): string {
  // .toISOString() returns UTC, which messes up date selection

  const year = d.getFullYear();
  const paddedMonth = (d.getMonth() + 1).toString().padStart(2, "0");
  const paddedDay = d.getDate().toString().padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}