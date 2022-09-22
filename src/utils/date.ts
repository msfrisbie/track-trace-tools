export function todayIsodate(): string {
    return getIsoDateStringFromIsoDatetime((new Date()).toISOString());
}

export function nowIsotime(): string {
    return getIsoTimeStringFromIsoDatetime((new Date()).toISOString());
}

export function submitDateFromIsodate(isodate: string): string {
    // 2021-06-05
    const [year, month, day] = isodate.split('-');

    return `${month}/${day}/${year}`
}

export function getIsoDateStringFromIsoDatetime(isoDatetime: string): string {
    if (!isoDatetime.includes('T')) {
        throw new Error('This does not look like an isoDatetime')
    }

    return isoDatetime.split('T')[0];
}

export function getIsoTimeStringFromIsoDatetime(isoDatetime: string): string {
    if (!isoDatetime.includes('T')) {
        throw new Error('This does not look like an isoDatetime')
    }

    return isoDatetime.split('T')[1];
}