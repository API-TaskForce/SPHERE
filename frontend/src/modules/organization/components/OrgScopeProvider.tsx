import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useOrganization } from '../hooks/useOrganization';

/**
 * Sets the active organization based on the :orgName URL parameter.
 * Renders children if the org is found in the user's organizations,
 * otherwise redirects to /error.
 */
export default function OrgScopeProvider({ children }: { children: React.ReactNode }) {
  const { orgName } = useParams<{ orgName: string }>();
  const { organizations, activeOrganization, setActiveOrganization, isLoading } = useOrganization();

  const targetOrg = organizations.find((o) => o.name === orgName);

  useEffect(() => {
    if (targetOrg && targetOrg.id !== activeOrganization?.id) {
      setActiveOrganization(targetOrg);
    }
  }, [targetOrg?.id, activeOrganization?.id]);

  if (isLoading) return null;

  if (!targetOrg) {
    return <Navigate to="/error" replace />;
  }

  return <>{children}</>;
}
