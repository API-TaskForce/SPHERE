import { useAuth } from '../../auth/hooks/useAuth';
import { useCallback, useMemo } from 'react';
import { CollectionToCreate } from '../types/profile-types';
import { useOrgFetch } from '../../organization/hooks/useOrganization';

export const COLLECTIONS_BASE_PATH = import.meta.env.VITE_API_URL + '/pricings/collections';

export function usePricingCollectionsApi() {
  const { fetchWithInterceptor, authUser } = useAuth();
  const { fetchWithOrgContext } = useOrgFetch();

  const token = authUser?.token;

  const basicHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const getCollections = useCallback(async (filters?: Record<string, string | number>, orgId?: string) => {
    let requestUrl;

    if (Object.keys(filters ?? {}).length === 0) {
      requestUrl = `${COLLECTIONS_BASE_PATH}`;
    } else {
      const filterParams = new URLSearchParams();
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        // numeric pagination params
        if (key === 'limit' || key === 'offset') {
          filterParams.append(key, String(value));
          return;
        }
        if ((value as string).trim && (value as string).trim().length > 0) filterParams.append(key, value as string);
      });
      requestUrl = `${COLLECTIONS_BASE_PATH}?${filterParams.toString()}`;
    }

    const headers: Record<string, string> = { ...basicHeaders };
    if (orgId) headers['X-Organization-Id'] = orgId;

    return fetch(requestUrl, {
      method: 'GET',
      headers,
    })
      .then(response => response.json())
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [basicHeaders]);

  const getLoggedUserCollections = useCallback(async () => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/me/collections`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => response.json())
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders]);

  const createCollection = useCallback(async (collection: CollectionToCreate) => {
    return fetchWithOrgContext(COLLECTIONS_BASE_PATH, {
      method: 'POST',
      headers: basicHeaders,
      body: JSON.stringify(collection),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          // For PLAN_LIMIT_REACHED (403) prefer the human-readable `message` field.
          const message =
            response.status === 403
              ? (data?.message ?? 'Your current plan does not allow this action. Please upgrade to continue.')
              : (data?.error || data?.message || response.statusText || 'Error creating collection');
          type ErrorWithStatus = Error & { status?: number };
          const e = new Error(message) as ErrorWithStatus;
          e.status = response.status;
          return Promise.reject(e);
        }
        return data;
      })
      .catch(error => {
  return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      });
  }, [fetchWithOrgContext, basicHeaders]);

  const createBulkCollection = useCallback(async (formData: FormData) => {
    return fetchWithOrgContext(COLLECTIONS_BASE_PATH + "/bulk", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            response.status === 403
              ? (data?.message ?? 'Your current plan does not allow this action. Please upgrade to continue.')
              : (data?.error || data?.message || response.statusText || 'Error creating collection');
          type ErrorWithStatus = Error & { status?: number };
          const e = new Error(message) as ErrorWithStatus;
          e.status = response.status;
          return Promise.reject(e);
        }
        if (data.error){
          type ErrorWithStatus = Error & { status?: number };
          const e = new Error(data.error) as ErrorWithStatus;
          e.status = 500;
          return Promise.reject(e);
        }
        return data;
      })
      .catch(error => {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      });
  }, [fetchWithOrgContext, token]);

  const getCollectionByOwnerAndName = useCallback(async (ownerId: string, collectionName: string) => {
    // fetchWithOrgContext is required: the backend's orgContext middleware scopes the query
    // by _organizationId. Without the X-Organization-Id header it defaults to the personal
    // org, so collections belonging to a team org would return 404 for non-owners.
    return fetchWithOrgContext(`${COLLECTIONS_BASE_PATH}/${ownerId}/${collectionName}`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          return Promise.reject(new Error(data.error));
        }
        return data;
      })
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders]);

  const downloadCollection = useCallback(async (ownerId: string, collectionName: string) => {
    // Same orgContext requirement as getCollectionByOwnerAndName — the download route calls
    // showByNameAndUserId internally which also filters by _organizationId.
    return fetchWithOrgContext(`${COLLECTIONS_BASE_PATH}/${ownerId}/${collectionName}/download`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(async response => {
        if (!response.ok) {
          return Promise.reject(new Error('Error downloading collection'));
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = collectionName + '.zip';
        a.click();

        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCollection = useCallback(async (collectionName: string, collectionData: any) => {
    return fetchWithOrgContext(`${COLLECTIONS_BASE_PATH}/${authUser.user!.id}/${collectionName}`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify(collectionData),
    })
      .then(async response => response.json())
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders, authUser]);

  const deleteCollection = useCallback(async (collectionName: string, deleteCascade: boolean) => {
    return fetchWithOrgContext(`${COLLECTIONS_BASE_PATH}/${authUser.user!.id}/${collectionName}?cascade=${deleteCascade}`, {
      method: 'DELETE',
      headers: basicHeaders
    })
      .then(async response => response.json())
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders, authUser]);

  const getAllByUser = useCallback(async () => {
    return fetchWithInterceptor(`${import.meta.env.VITE_API_URL}/me/collections/all`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(async response => {
        if (!response.ok) return Promise.reject(response);
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithInterceptor, basicHeaders]);

  const assignCollectionToOrg = useCallback(async (organizationId: string, collectionId: string) => {
    return fetchWithInterceptor(
      `${import.meta.env.VITE_API_URL}/organizations/${organizationId}/collections/assign`,
      {
        method: 'POST',
        headers: basicHeaders,
        body: JSON.stringify({ collectionId }),
      }
    )
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to assign collection to organization');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error instanceof Error ? error : new Error(String(error))));
  }, [fetchWithInterceptor, basicHeaders]);

  const removeOrgCollection = useCallback(async (orgId: string, collectionId: string) => {
    return fetchWithOrgContext(
      `${import.meta.env.VITE_API_URL}/organizations/${orgId}/collections/${collectionId}`,
      { method: 'DELETE', headers: basicHeaders }
    )
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to remove collection from organization');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error instanceof Error ? error : new Error(String(error))));
  }, [fetchWithOrgContext, basicHeaders]);

  const createGroupCollection = useCallback(async (groupId: string, collection: CollectionToCreate) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/groups/${groupId}/collections`, {
      method: 'POST',
      headers: basicHeaders,
      body: JSON.stringify(collection),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = data?.error || data?.message || response.statusText || 'Error creating collection';
          type ErrorWithStatus = Error & { status?: number };
          const e = new Error(message) as ErrorWithStatus;
          e.status = response.status;
          return Promise.reject(e);
        }
        return data;
      })
      .catch(error => Promise.reject(error instanceof Error ? error : new Error(String(error))));
  }, [fetchWithOrgContext, basicHeaders]);

  return useMemo(() => ({
    getLoggedUserCollections,
    createCollection,
    createBulkCollection,
    getCollectionByOwnerAndName,
    getCollections,
    downloadCollection,
    updateCollection,
    deleteCollection,
    getAllByUser,
    assignCollectionToOrg,
    createGroupCollection,
    removeOrgCollection,
  }), [
    getLoggedUserCollections,
    createCollection,
    createBulkCollection,
    getCollectionByOwnerAndName,
    getCollections,
    downloadCollection,
    updateCollection,
    deleteCollection,
    getAllByUser,
    assignCollectionToOrg,
    createGroupCollection,
    removeOrgCollection,
  ]);
}
