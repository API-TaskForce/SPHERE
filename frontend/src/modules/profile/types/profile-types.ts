export interface CollectionEntry {
  id: string,
  name: string,
  owner: {
    id: string
    username: string,
    avatar: string,
  },
  numberOfPricings?: number,
  numberOfDatasheets?: number,
}

export interface PricingEntry {
  
}

export interface CollectionToCreate {
  name: string,
  description: string,
  private: boolean,
  pricings?: string[],
  datasheets?: string[]
}