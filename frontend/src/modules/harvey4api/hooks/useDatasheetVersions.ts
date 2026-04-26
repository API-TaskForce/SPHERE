import { useEffect, useState } from 'react';

export interface DatasheetVersionsResult {
  name: string;
  collectionName: string | null;
  versions: DatasheetVersion[];
}

export interface DatasheetVersion {
  _id?: string;
  owner?: string;
  version?: string;
  extractionDate: string;
  currency?: string;
  yaml: string;
  analytics?: Record<string, unknown>;
  private?: boolean;
  collectionName?: string;
}

export function useDatasheetVersions(owner: string, name: string, collectionName?: string | null) {
  const [versions, setVersions] = useState<DatasheetVersionsResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true);
        const collectionQuery =
          collectionName && collectionName !== 'undefined'
            ? `?collectionName=${encodeURIComponent(collectionName)}`
            : '';
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/datasheets/${owner}/${name}${collectionQuery}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch datasheet: ${response.status}`);
        }
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    makeRequest();
  }, [owner, name, collectionName]);

  return { loading, error, versions };
}
