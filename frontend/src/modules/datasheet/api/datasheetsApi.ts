import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { FilterValues } from '../pages/list';

export const DATASHEETS_BASE_PATH = import.meta.env.VITE_API_URL + '/datasheets';

export function useDatasheetsApi() {
  const { fetchWithInterceptor, authUser } = useAuth();

  const token = authUser?.token;
  const username = authUser?.user?.username;

  const basicHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const getLoggedUserDatasheets = useCallback(async () => {
    return fetchWithInterceptor(`${import.meta.env.VITE_API_URL}/me/datasheets`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithInterceptor, basicHeaders]);

  const getDatsheets = useCallback(async (filters: Record<string, string | FilterValues | number> = {}) => {
    let requestUrl;

    if (Object.keys(filters).length === 0) {
      requestUrl = `${DATASHEETS_BASE_PATH}`;
    } else {
      const filterParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'limit' || key === 'offset') {
          if (value !== undefined && value !== null) filterParams.append(key, String(value));
          return;
        }
        if (Array.isArray(value)) {
          if (typeof value[0] === 'number') {
            if (value[0])
              filterParams.append('min-' + key.replace('Range', ''), value[0].toString());
            if (value[1])
              filterParams.append('max-' + key.replace('Range', ''), value[1].toString());
          } else if (typeof value[0] === 'string') {
            const selectedOwners = value as string[];
            const owners = selectedOwners.join(',');
            filterParams.append(key, owners);
          }
        } else {
          const stringValue = value as string;
          if (stringValue.trim().length > 0) filterParams.append(key, value as string);
        }
      });
      requestUrl = `${DATASHEETS_BASE_PATH}?${filterParams.toString()}`;
    }

    return fetch(requestUrl as string, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => {
        if (!response.ok) {
          return Promise.reject(response);
        } else {
          return response.json();
        }
      })
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [basicHeaders]);

  const addDatasheetToCollection = useCallback(
    async (datasheetName: string, collectionId: string) => {
      return fetchWithInterceptor(`${import.meta.env.VITE_API_URL}/me/datasheets`, {
        method: 'PUT',
        headers: basicHeaders,
        body: JSON.stringify({ datasheetName, collectionId }),
      })
        .then(response => {
          if (!response.ok) {
            return Promise.reject(response);
          }
          return response.json();
        })
        .catch(error => Promise.reject(error as Error));
    },
    [fetchWithInterceptor, basicHeaders]
  );

  const removeDatasheetFromCollection = useCallback(
    async (datasheetName: string) => {
      return fetchWithInterceptor(
        `${import.meta.env.VITE_API_URL}/me/datasheetCollections/datasheets/${datasheetName}`,
        {
          method: 'DELETE',
          headers: basicHeaders,
        }
      )
        .then(response => {
          if (!response.ok) {
            return Promise.reject(response);
          }
          return response.json();
        })
        .catch(error => Promise.reject(error as Error));
    },
    [fetchWithInterceptor, basicHeaders]
  );

  const removeDatasheetByName = useCallback(
    async (name: string, collectionName?: string) => {
      return fetchWithInterceptor(
        `${DATASHEETS_BASE_PATH}/${username}/${name}${
          collectionName ? `?collectionName=${collectionName}` : ''
        }`,
        {
          method: 'DELETE',
          headers: basicHeaders,
        }
      )
        .then(response => {
          if (!response.ok) {
            return Promise.reject(response);
          }
          return response.json();
        })
        .catch(error => Promise.reject(error as Error));
    },
    [fetchWithInterceptor, basicHeaders, username]
  );

  return useMemo(
    () => ({
      getDatsheets,
      getLoggedUserDatasheets,
      addDatasheetToCollection,
      removeDatasheetFromCollection,
      removeDatasheetByName,
    }),
    [
      getDatsheets,
      getLoggedUserDatasheets,
      addDatasheetToCollection,
      removeDatasheetFromCollection,
      removeDatasheetByName,
    ]
  );
}
