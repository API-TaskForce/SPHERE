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

export interface OrganizationMembershipWithOrg {
  id: string;
  _userId: string;
  _organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  organization: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface CreateOrganizationPayload {
  name: string;
  displayName: string;
  description?: string;
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

  const getMyMemberships = useCallback(async (): Promise<OrganizationMembershipWithOrg[]> => {
    const userId = authUser?.user?.id;
    const response = await fetchWithInterceptor(
      `${import.meta.env.VITE_API_URL}/users/${userId}/organization-memberships`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch memberships');
    }

    return response.json();
  }, [fetchWithInterceptor, token, authUser?.user?.id]);

  const createOrganization = useCallback(
    async (payload: CreateOrganizationPayload): Promise<Organization> => {
      const response = await fetchWithInterceptor(ORGANIZATIONS_BASE_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create organization');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  return { getMyOrganizations, getMyMemberships, createOrganization };
}
