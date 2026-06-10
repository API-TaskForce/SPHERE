import { useEffect, useState } from 'react';
import { useDatasheetsApi } from '../../datasheet/api/datasheetsApi';

export interface DatasheetSearchResultItem {
  name: string;
  owner: string;
  version: string;
  extractionDate: string;
  currency: string;
  collectionName?: string | null;
}

export interface DatasheetSearchResult {
  total: number;
  datasheets: DatasheetSearchResultItem[];
}

export function useDatasheets(search: string, offset: number = 0, limit: number = 10) {
  const [datasheets, setDatasheets] = useState<DatasheetSearchResult>({
    datasheets: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const { getDatsheets } = useDatasheetsApi();

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true);
        const data = await getDatsheets({ name: search, offset, limit });
        setDatasheets({
          datasheets: data.datasheets ?? [],
          total: typeof data.total === 'number' ? data.total : (data.datasheets?.length ?? 0),
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    makeRequest();
  }, [search, offset, limit, getDatsheets]);

  return { loading, error, datasheets };
}
