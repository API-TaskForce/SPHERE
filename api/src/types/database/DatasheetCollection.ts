import { User } from "./User";

export interface DatasheetCollection {
    name: string,
    owner: User,
    analytics?: any
}

export interface RetrievedDatasheetCollection {
    name: string,
    owner: User,
    datasheets: any,
    analytics?: any
}
