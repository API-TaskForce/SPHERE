import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useOrgFetch } from '../hooks/useOrganization';

export const GROUPS_BASE_PATH = import.meta.env.VITE_API_URL + '/groups';

export type GroupRole = 'admin' | 'editor' | 'viewer';
export type GroupCollectionAccessRole = 'editor' | 'viewer' | null;

export interface GroupMemberWithUser {
  id: string;
  _userId: string;
  _groupId: string;
  _organizationId: string;
  role: GroupRole;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
  };
}

export interface GroupMembershipWithGroup {
  id: string;
  _userId: string;
  _groupId: string;
  _organizationId: string;
  role: GroupRole;
  joinedAt: string;
  group: {
    id: string;
    name: string;
    displayName: string | null;
  };
}

export interface GroupCollectionWithCollection {
  id: string;
  _groupId: string;
  _pricingCollectionId: string;
  _organizationId: string;
  accessRole: GroupCollectionAccessRole;
  createdAt: string;
  pricingCollection: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
  };
}

export interface AvailableGroupCollectionOption {
  id: string;
  name: string;
  description: string | null;
  private: boolean;
  numberOfPricings: number;
  owner: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export function useGroupsApi() {
  const { fetchWithInterceptor, authUser } = useAuth();
  const { fetchWithOrgContext } = useOrgFetch();
  const token = authUser?.token;

  const basicHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const getGroup = useCallback(async (groupId: string) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}`, {
      method: 'GET',
      headers: basicHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to fetch group');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const updateGroup = useCallback(async (
    groupId: string,
    payload: { displayName?: string; description?: string }
  ) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to update group');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const deleteGroup = useCallback(async (groupId: string) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}`, {
      method: 'DELETE',
      headers: basicHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to delete group');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const getGroupMembers = useCallback(async (groupId: string): Promise<GroupMemberWithUser[]> => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}/members`, {
      method: 'GET',
      headers: basicHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to fetch group members');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const addGroupMember = useCallback(async (
    groupId: string,
    userId: string,
    role: GroupRole
  ) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}/members`, {
      method: 'POST',
      headers: basicHeaders,
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to add group member');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const updateGroupMemberRole = useCallback(async (
    groupId: string,
    userId: string,
    role: GroupRole
  ) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}/members/${userId}`, {
      method: 'PUT',
      headers: basicHeaders,
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to update group member role');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const removeGroupMember = useCallback(async (groupId: string, userId: string) => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers: basicHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to remove group member');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const getGroupCollections = useCallback(async (
    groupId: string
  ): Promise<GroupCollectionWithCollection[]> => {
    const response = await fetchWithOrgContext(`${GROUPS_BASE_PATH}/${groupId}/collections`, {
      method: 'GET',
      headers: basicHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to fetch associated collections');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const addGroupCollection = useCallback(async (
    organizationId: string,
    groupId: string,
    pricingCollectionId: string,
    accessRole: GroupCollectionAccessRole
  ) => {
    const response = await fetchWithOrgContext(
      `${import.meta.env.VITE_API_URL}/organizations/${organizationId}/groups/${groupId}/collections`,
      {
        method: 'POST',
        headers: basicHeaders,
        body: JSON.stringify({ pricingCollectionId, accessRole: accessRole ?? null }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to associate collection');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const getAvailableCollections = useCallback(async (
    organizationId: string,
    groupId: string
  ): Promise<AvailableGroupCollectionOption[]> => {
    const response = await fetchWithOrgContext(
      `${import.meta.env.VITE_API_URL}/organizations/${organizationId}/groups/${groupId}/available-collections`,
      {
        method: 'GET',
        headers: basicHeaders,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to fetch available collections');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const updateGroupCollectionAccess = useCallback(async (
    groupId: string,
    pricingCollectionId: string,
    accessRole: GroupCollectionAccessRole
  ) => {
    const response = await fetchWithOrgContext(
      `${GROUPS_BASE_PATH}/${groupId}/collections/${pricingCollectionId}`,
      {
        method: 'PUT',
        headers: basicHeaders,
        body: JSON.stringify({ accessRole }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to update collection access');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const removeGroupCollection = useCallback(async (
    groupId: string,
    pricingCollectionId: string
  ) => {
    const response = await fetchWithOrgContext(
      `${GROUPS_BASE_PATH}/${groupId}/collections/${pricingCollectionId}`,
      {
        method: 'DELETE',
        headers: basicHeaders,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to remove collection association');
    }

    return response.json();
  }, [fetchWithOrgContext, basicHeaders]);

  const getMyGroupMemberships = useCallback(async (
    userId: string
  ): Promise<GroupMembershipWithGroup[]> => {
    const response = await fetchWithInterceptor(
      `${import.meta.env.VITE_API_URL}/users/${userId}/group-memberships`,
      {
        method: 'GET',
        headers: basicHeaders,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to fetch group memberships');
    }

    return response.json();
  }, [fetchWithInterceptor, basicHeaders]);

  return useMemo(() => ({
    getGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addGroupMember,
    updateGroupMemberRole,
    removeGroupMember,
    getGroupCollections,
    addGroupCollection,
    getAvailableCollections,
    updateGroupCollectionAccess,
    removeGroupCollection,
    getMyGroupMemberships,
  }), [
    getGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addGroupMember,
    updateGroupMemberRole,
    removeGroupMember,
    getGroupCollections,
    addGroupCollection,
    getAvailableCollections,
    updateGroupCollectionAccess,
    removeGroupCollection,
    getMyGroupMemberships,
  ]);
}
