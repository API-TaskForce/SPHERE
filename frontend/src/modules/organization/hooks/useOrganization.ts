import { useContext, useEffect, useState } from 'react';
import { OrganizationContext } from '../contexts/organizationContext';
import { Organization, useOrganizationsApi } from '../api/organizationsApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLocalStorage } from '../../core/hooks/useLocalStorage';

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  return context;
};

export const useOrganizationManager = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authUser } = useAuth();
  const { getMyOrganizations } = useOrganizationsApi();
  const { getItem, setItem, removeItem } = useLocalStorage();

  const setActiveOrganization = (org: Organization) => {
    setActiveOrganizationState(org);
    setItem('activeOrgId', org.id);
  };

  useEffect(() => {
    if (!authUser.isAuthenticated || authUser.isLoading) {
      if (!authUser.isLoading) {
        setOrganizations([]);
        setActiveOrganizationState(null);
        setIsLoading(false);
        removeItem('activeOrgId');
      }
      return;
    }

    setIsLoading(true);

    getMyOrganizations()
      .then((orgs) => {
        setOrganizations(orgs);

        const savedOrgId = getItem('activeOrgId');
        const savedOrg = savedOrgId ? orgs.find((o) => o.id === savedOrgId) : null;

        if (savedOrg) {
          setActiveOrganizationState(savedOrg);
        } else {
          // Default to personal organization
          const personalOrg = orgs.find((o) => o.isPersonal) ?? orgs[0] ?? null;
          setActiveOrganizationState(personalOrg);
          if (personalOrg) {
            setItem('activeOrgId', personalOrg.id);
          }
        }
      })
      .catch(() => {
        setOrganizations([]);
        setActiveOrganizationState(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authUser.isAuthenticated, authUser.isLoading]);

  return { organizations, activeOrganization, setActiveOrganization, isLoading };
};

/**
 * Returns a fetch wrapper that automatically injects the X-Organization-Id header
 * for the currently active organization.
 */
export const useOrgFetch = () => {
  const { activeOrganization } = useOrganization();
  const { fetchWithInterceptor, authUser } = useAuth();

  const fetchWithOrgContext = (
    url: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
    const orgHeader = activeOrganization?.id
      ? { 'X-Organization-Id': activeOrganization.id }
      : {};

    return fetchWithInterceptor(url, {
      ...options,
      headers: {
        ...(options?.headers as Record<string, string>),
        ...orgHeader,
      },
    });
  };

  return { fetchWithOrgContext, authUser };
};
