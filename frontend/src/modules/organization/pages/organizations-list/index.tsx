import { useEffect, useState } from 'react';
import { OrganizationMembershipWithOrg, useOrganizationsApi } from '../../api/organizationsApi';
import Iconify from '../../../core/components/iconify';
import { useRouter } from '../../../core/hooks/useRouter';
import { useAuth } from '../../../auth/hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-sphere-primary-100 text-sphere-primary-800',
  admin: 'bg-amber-100 text-amber-800',
  member: 'bg-sphere-grey-200 text-sphere-grey-700',
};

function OrgAvatar({ org }: { org: OrganizationMembershipWithOrg['organization'] }) {
  if (org.avatarUrl) {
    return (
      <img
        src={org.avatarUrl}
        alt={org.displayName}
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sphere-primary-800 text-white">
      <Iconify icon="mdi:domain" width={22} />
    </span>
  );
}

export default function OrganizationsListPage() {
  const [memberships, setMemberships] = useState<OrganizationMembershipWithOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getMyMemberships } = useOrganizationsApi();
  const { authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authUser.isLoading) return;
    if (!authUser.isAuthenticated || !authUser.user?.id) {
      setIsLoading(false);
      return;
    }

    getMyMemberships()
      .then(setMemberships)
      .catch(() => setError('Failed to load organizations'))
      .finally(() => setIsLoading(false));
  }, [authUser.isLoading, authUser.isAuthenticated, authUser.user?.id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sphere-grey-800">My Organizations</h1>
        <button
          type="button"
          onClick={() => router.push('/organizations/new')}
          className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sphere-primary-700"
        >
          <Iconify icon="mdi:plus" width={18} />
          New Organization
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sphere-grey-500">Loading...</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && memberships.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-sphere-grey-500">
          <Iconify icon="mdi:domain-off" width={40} />
          <p>No organizations yet.</p>
        </div>
      )}

      {!isLoading && !error && memberships.length > 0 && (
        <ul className="flex flex-col gap-3">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 rounded-lg border border-sphere-grey-300 bg-white px-5 py-4 shadow-sm"
            >
              <OrgAvatar org={m.organization} />
              <div className="min-w-0 flex-1">
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-sphere-grey-800">
                  {m.organization.displayName}
                </p>
                <p className="text-sm text-sphere-grey-600">@{m.organization.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STYLES[m.role] ?? ROLE_STYLES.member}`}
              >
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
