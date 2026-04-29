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

export interface OrgMemberWithUser {
  id: string;
  _userId: string;
  _organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
  };
}

export interface Group {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  _organizationId: string;
  _parentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationInvitation {
  id: string;
  _organizationId: string;
  code: string;
  createdBy: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  createdAt: string;
}

export interface UserLookup {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export type OrgPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface CreateOrganizationPayload {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  displayName?: string;
  description?: string;
  avatarUrl?: string;
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

  const getOrganizationByName = useCallback(async (name: string): Promise<Organization> => {
    const response = await fetchWithInterceptor(
      `${ORGANIZATIONS_BASE_PATH}/by-name/${name}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Organization not found');
    }

    return response.json();
  }, [fetchWithInterceptor, token]);

  const getOrgMembers = useCallback(async (orgId: string): Promise<OrgMemberWithUser[]> => {
    const response = await fetchWithInterceptor(
      `${ORGANIZATIONS_BASE_PATH}/${orgId}/members`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }

    return response.json();
  }, [fetchWithInterceptor, token]);

  const getOrgGroups = useCallback(async (orgId: string): Promise<Group[]> => {
    const response = await fetchWithInterceptor(
      `${ORGANIZATIONS_BASE_PATH}/${orgId}/groups`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }

    return response.json();
  }, [fetchWithInterceptor, token]);

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

  const updateOrganization = useCallback(
    async (orgId: string, payload: UpdateOrganizationPayload): Promise<Organization> => {
      const response = await fetchWithInterceptor(`${ORGANIZATIONS_BASE_PATH}/${orgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update organization');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const addMember = useCallback(
    async (orgId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
      const response = await fetchWithInterceptor(`${ORGANIZATIONS_BASE_PATH}/${orgId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to add member');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const updateMemberRole = useCallback(
    async (orgId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/members/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update member role');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const removeMember = useCallback(
    async (orgId: string, userId: string) => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/members/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to remove member');
      }
    },
    [fetchWithInterceptor, token]
  );

  const createInvitation = useCallback(
    async (orgId: string, options?: { expiresInDays?: number; maxUses?: number }): Promise<OrganizationInvitation> => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options ?? {}),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create invitation');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const listInvitations = useCallback(
    async (orgId: string): Promise<OrganizationInvitation[]> => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/invitations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const revokeInvitation = useCallback(
    async (orgId: string, invitationId: string) => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to revoke invitation');
      }
    },
    [fetchWithInterceptor, token]
  );

  const previewInvitation = useCallback(
    async (code: string): Promise<{ invitation: OrganizationInvitation; organization: Organization }> => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/invitations/preview/${code}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Invitation not found or expired');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const joinViaInvitation = useCallback(
    async (code: string): Promise<Organization> => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/join/${code}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to join organization');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const lookupUserByUsername = useCallback(
    async (username: string): Promise<UserLookup> => {
      const response = await fetchWithInterceptor(
        `${import.meta.env.VITE_API_URL}/users/by-username/${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'User not found');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const createGroup = useCallback(
    async (orgId: string, payload: { name: string; displayName?: string; description?: string }) => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/groups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create group');
      }

      return response.json();
    },
    [fetchWithInterceptor, token]
  );

  const getOrgPlan = useCallback(async (orgId: string): Promise<OrgPlan> => {
    const response = await fetchWithInterceptor(
      `${ORGANIZATIONS_BASE_PATH}/${orgId}/plan`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch plan');
    }

    const data = await response.json();
    return data.plan as OrgPlan;
  }, [fetchWithInterceptor, token]);

  const changeOrgPlan = useCallback(
    async (orgId: string, plan: OrgPlan): Promise<void> => {
      const response = await fetchWithInterceptor(
        `${ORGANIZATIONS_BASE_PATH}/${orgId}/plan`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error ?? 'Failed to change plan');
      }
    },
    [fetchWithInterceptor, token]
  );

  return {
    getMyOrganizations,
    getMyMemberships,
    getOrganizationByName,
    getOrgMembers,
    getOrgGroups,
    createOrganization,
    updateOrganization,
    addMember,
    updateMemberRole,
    removeMember,
    createInvitation,
    listInvitations,
    revokeInvitation,
    previewInvitation,
    joinViaInvitation,
    lookupUserByUsername,
    createGroup,
    getOrgPlan,
    changeOrgPlan,
  };
}
