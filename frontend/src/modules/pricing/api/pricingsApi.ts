import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useOrgFetch } from '../../organization/hooks/useOrganization';
import { FilterValues } from '../pages/list';

export const PRICINGS_BASE_PATH = import.meta.env.VITE_API_URL + '/pricings';

export function usePricingsApi() {
  const { fetchWithInterceptor, authUser } = useAuth();
  const { fetchWithOrgContext } = useOrgFetch();
  const token = authUser?.token;
  const username = authUser?.user?.username;

  const basicHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const getPricings = useCallback(async (filters: Record<string, string | FilterValues | number> = {}, orgId?: string) => {
    let requestUrl;

    if (Object.keys(filters).length === 0) {
      requestUrl = `${PRICINGS_BASE_PATH}`;
    } else {
      const filterParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // handle numeric pagination params
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
      requestUrl = `${PRICINGS_BASE_PATH}?${filterParams.toString()}`;
    }

    const headers: Record<string, string> = { ...basicHeaders };
    if (orgId) headers['X-Organization-Id'] = orgId;

    return fetch(requestUrl as string, {
      method: 'GET',
      headers,
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

  const getPricingByName = useCallback(async (name: string, owner: string, collectionName: string | null) => {
    // fetchWithOrgContext is required so the backend's orgContext middleware resolves
    // the correct organization instead of defaulting to the personal org. Without the
    // X-Organization-Id header the query filters by personal-org and misses pricings
    // that are scoped to a team org (e.g. pricings assigned to a group).
    return fetchWithOrgContext(
      `${PRICINGS_BASE_PATH}/${owner}/${name}${
        collectionName && collectionName !== 'undefined' ? `?collectionName=${collectionName}` : ''
      }`,
      {
        method: 'GET',
        headers: basicHeaders,
      }
    )
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
  }, [fetchWithOrgContext, basicHeaders]);

  const getLoggedUserPricings = useCallback(async () => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/me/pricings`, {
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
  }, [fetchWithOrgContext, basicHeaders]);

  const getConfigurationSpace = useCallback(async (pricingId: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();

    if (limit !== undefined) params.set('limit', limit.toString());
    if (offset !== undefined) params.set('offset', offset.toString());

    const queryString = params.toString();

    // fetchWithOrgContext is required: the backend's checkCedar('readPricing') resolves
    // authorization against req.organizationId. Without X-Organization-Id the org context
    // defaults to the personal org, which causes Cedar to deny access for pricings that
    // belong to a team organization.
    return fetchWithOrgContext(
      `${PRICINGS_BASE_PATH}/${pricingId}/configuration-space${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: basicHeaders,
      }
    )
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          return Promise.reject(data.error);
        } else {
          return data;
        }
      })
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithInterceptor, basicHeaders]);

  const createPricing = useCallback(async (formData: FormData, setErrors: (errors: string[]) => void = () => {}, orgId?: string) => {
    const fetchFn = orgId
      ? (url: RequestInfo | URL, opts?: RequestInit) =>
          fetchWithInterceptor(url, {
            ...opts,
            headers: { ...(opts?.headers as Record<string, string>), 'X-Organization-Id': orgId },
          })
      : fetchWithOrgContext;

    return fetchFn(PRICINGS_BASE_PATH, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async response => {
        const parsedResponse = await response.json().catch(() => ({}));

        if (!response.ok) {
          type ApiError = Error & { status?: number };
          const message =
            response.status === 403
              ? ((parsedResponse as any).message ?? 'Your current plan does not allow this action. Please upgrade to continue.')
              : ((parsedResponse as any).error ?? 'Failed to create pricing');
          const e = new Error(message) as ApiError;
          e.status = response.status;
          throw e;
        }

        return parsedResponse;
      })
      .catch((error: Error) => {
        setErrors([error.message]);
        throw error;
      });
  }, [fetchWithOrgContext, token]);

  const addPricingToCollection = useCallback(async (pricingName: string, collectionId: string) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/me/pricings`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify({ pricingName, collectionId }),
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
  }, [fetchWithOrgContext, basicHeaders]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePricing = useCallback((pricingName: string, pricingData: any) => {
    return fetchWithOrgContext(`${PRICINGS_BASE_PATH}/${username}/${pricingName}`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify(pricingData),
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
  }, [fetchWithOrgContext, basicHeaders, username]);

  const updateClientPricingVersion = useCallback(async (pricingString: string) => {
    return fetchWithInterceptor(`${PRICINGS_BASE_PATH}`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify({pricing: pricingString}),
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
  }, [fetchWithInterceptor, basicHeaders]);

  const removePricingVersion = useCallback(async (pricingName: string, pricingVersion: string) => {
    return fetchWithOrgContext(
      `${PRICINGS_BASE_PATH}/${username}/${pricingName}/${pricingVersion}`,
      {
        method: 'DELETE',
        headers: basicHeaders,
      }
    )
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
  }, [fetchWithOrgContext, basicHeaders, username]);

  const removePricingFromCollection = useCallback(async (pricingName: string) => {
    return fetchWithOrgContext(
      `${import.meta.env.VITE_API_URL}/me/collections/pricings/${pricingName}`,
      {
        method: 'DELETE',
        headers: basicHeaders,
      }
    )
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
  }, [fetchWithOrgContext, basicHeaders]);

  const getAllByOwner = useCallback(async () => {
    return fetchWithInterceptor(`${import.meta.env.VITE_API_URL}/me/pricings/all`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => {
        if (!response.ok) return Promise.reject(response);
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithInterceptor, basicHeaders]);

  const assignPricingToOrg = useCallback(async (organizationId: string, pricingId: string) => {
    return fetchWithInterceptor(
      `${import.meta.env.VITE_API_URL}/organizations/${organizationId}/pricings/assign`,
      {
        method: 'POST',
        headers: basicHeaders,
        body: JSON.stringify({ pricingId }),
      }
    )
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to assign pricing to organization');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithInterceptor, basicHeaders]);

  const createGroupPricing = useCallback(async (groupId: string, formData: FormData) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/groups/${groupId}/pricings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
      .then(async response => {
        const parsed = await response.json();
        if (!response.ok) throw new Error(parsed.error);
        return parsed;
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithOrgContext, token]);

  const assignExistingPricingToGroup = useCallback(async (groupId: string, pricingId: string) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/groups/${groupId}/pricings`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify({ pricingId }),
    })
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to assign pricing to group');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithOrgContext, basicHeaders]);

  const removeGroupPricing = useCallback(async (groupId: string, pricingId: string) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/groups/${groupId}/pricings/${pricingId}`, {
      method: 'DELETE',
      headers: basicHeaders,
    })
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to remove pricing from group');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithOrgContext, basicHeaders]);

  const removeOrgPricing = useCallback(async (orgId: string, owner: string, pricingName: string) => {
    return fetchWithOrgContext(
      `${import.meta.env.VITE_API_URL}/organizations/${orgId}/pricings/${owner}/${pricingName}`,
      { method: 'DELETE', headers: basicHeaders }
    )
      .then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).error ?? 'Failed to remove pricing from organization');
        }
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithOrgContext, basicHeaders]);

  const getGroupPricings = useCallback(async (groupId: string) => {
    return fetchWithOrgContext(`${import.meta.env.VITE_API_URL}/groups/${groupId}/pricings`, {
      method: 'GET',
      headers: basicHeaders,
    })
      .then(response => {
        if (!response.ok) return Promise.reject(response);
        return response.json();
      })
      .catch(error => Promise.reject(error as Error));
  }, [fetchWithOrgContext, basicHeaders]);

  const removePricingByName = useCallback(async (name: string, collectionName?: string) => {
    return fetchWithOrgContext(
      `${PRICINGS_BASE_PATH}/${username}/${name}${
        collectionName ? `?collectionName=${collectionName}` : ''
      }`,
      {
        method: 'DELETE',
        headers: basicHeaders,
      }
    )
      .then(async response => response.json())
      .then(data => {
        if (data.error) {
          return Promise.reject(data.error);
        } else {
          return data;
        }
      })
      .catch(error => {
        return Promise.reject(error as Error);
      });
  }, [fetchWithOrgContext, basicHeaders, username]);

  return useMemo(
    () => ({
      getPricings,
      getPricingByName,
      getLoggedUserPricings,
      getConfigurationSpace,
      createPricing,
      addPricingToCollection,
      removePricingFromCollection,
      removePricingByName,
      updatePricing,
      updateClientPricingVersion,
      removePricingVersion,
      getAllByOwner,
      assignPricingToOrg,
      createGroupPricing,
      assignExistingPricingToGroup,
      getGroupPricings,
      removeGroupPricing,
      removeOrgPricing,
    }),
    [
      getPricings,
      getPricingByName,
      getLoggedUserPricings,
      getConfigurationSpace,
      createPricing,
      addPricingToCollection,
      removePricingFromCollection,
      removePricingByName,
      updatePricing,
      updateClientPricingVersion,
      removePricingVersion,
      getAllByOwner,
      assignPricingToOrg,
      createGroupPricing,
      assignExistingPricingToGroup,
      getGroupPricings,
      removeGroupPricing,
      removeOrgPricing,
    ]
  );
}
