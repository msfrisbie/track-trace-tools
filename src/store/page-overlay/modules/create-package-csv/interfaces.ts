import { PackageCsvStatus } from "./consts";

export interface CreatePackageCsvRow {
    sourceLabel: string,
    destinationLabel: string,
    errors: string[]
}

export interface ICreatePackageCsvState {
    status: PackageCsvStatus,
    statusMessage: string | null,
    rows: CreatePackageCsvRow[],
    csvData: string | null
}
