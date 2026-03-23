export interface DatasheetIndexQueryParams {
    limit?: string | number,
    offset?: string | number,
    name?: string,
    selectedOwners?: string[],
    sortBy?: string,
    sort?: "asc" | "desc",
}
