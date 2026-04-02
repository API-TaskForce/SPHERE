import { useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

export const ORGANIZATIONS_BASE_PATH = import.meta.env.VITE_API_URL + '/organizations';
export const USERS_ORGANIZATIONS_PATH = import.meta.env.VITE_API_URL + '/users/me/organizations';

export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useOrganizationsApi() {
  const { fetchWithInterceptor, authUser } = useAuth();
  const token = authUser?.token;

  const getMyOrganizations = useCallback(async (): Promise<Organization[]> => {
    const response = await fetchWithInterceptor(USERS_ORGANIZATIONS_PATH, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }

    return response.json();
  }, [fetchWithInterceptor, token]);

  return { getMyOrganizations };
}
