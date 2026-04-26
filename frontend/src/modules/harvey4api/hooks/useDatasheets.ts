import { useEffect, useState } from 'react';
import { useDatasheetsApi } from '../../datasheet/api/datasheetsApi';

export interface DatasheetSearchResult {
  total: number;
  datasheets: DatasheetSearchResultItem[];
}

export interface DatasheetSearchResultItem {
  name: string;
  owner: string;
  version: string;
  extractionDate: string;
  currency?: string;
  collectionName?: string | null;
}

export function useDatasheets(search: string, offset: number = 0, limit: number = 10) {
  const [datasheets, setDatasheets] = useState<DatasheetSearchResult>({ datasheets: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const { getDatsheets } = useDatasheetsApi();

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true);
        const data = await getDatsheets({ offset, limit, search });
        if ('error' in data) {
          setError(new Error(data.error));
        } else {
          setDatasheets(data);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    makeRequest();
  }, [search, offset]);

  return { loading, error, datasheets };
}
