export interface Datasheet {
  id: string;
  name: string;
  _collectionId?: string;
  extractionDate: Date;
  url?: string;
  yaml: string;
  // Currently no specific analytics for datasheets, but we keep it open for future
  analytics?: any;
}
