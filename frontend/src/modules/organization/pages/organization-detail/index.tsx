import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Organization,
  OrgMemberWithUser,
  Group,
  OrganizationInvitation,
  useOrganizationsApi,
} from '../../api/organizationsApi';
import Iconify from '../../../core/components/iconify';
import { useRouter } from '../../../core/hooks/useRouter';
import { useAuth } from '../../../auth/hooks/useAuth';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Sub-components ───────────────────────────────────────────────────────────

function OrgAvatar({ org, size = 'md' }: { org: Organization; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-10 w-10', md: 'h-14 w-14', lg: 'h-20 w-20' };
  const iconSizes = { sm: 18, md: 24, lg: 32 };

  if (org.avatarUrl) {
    return (
      <img
        src={org.avatarUrl}
        alt={org.displayName}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-full bg-sphere-primary-800 text-white`}
    >
      <Iconify icon="mdi:domain" width={iconSizes[size]} />
    </span>
  );
}

// ── Edit Organization Modal ──────────────────────────────────────────────────

function EditOrgModal({
  org,
  onClose,
  onSaved,
}: {
  org: Organization;
  onClose: () => void;
  onSaved: (updated: Organization) => void;
}) {
  const [displayName, setDisplayName] = useState(org.displayName);
  const [description, setDescription] = useState(org.description ?? '');
  const [avatarUrl, setAvatarUrl] = useState(org.avatarUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { updateOrganization } = useOrganizationsApi();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateOrganization(org.id, {
      displayName,
      description: description || undefined,
      avatarUrl: avatarUrl || undefined,
    })
      .then((updated) => {
        onSaved(updated);
        onClose();
      })
      .catch((err: Error) => {
        customAlert(err.message);
        setIsSaving(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Edit Organization</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={255}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  orgId,
  onClose,
  onAdded,
}: {
  orgId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { lookupUserByUsername, addMember } = useOrganizationsApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await lookupUserByUsername(username.trim());
      await addMember(orgId, user.id, role);
      onAdded();
      onClose();
    } catch (err: any) {
      customAlert(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Add Member</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john-doe"
              required
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invite Members Modal ─────────────────────────────────────────────────────

function InviteModal({
  orgId,
  invitations,
  onClose,
  onRefresh,
}: {
  orgId: string;
  invitations: OrganizationInvitation[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { createInvitation, revokeInvitation } = useOrganizationsApi();

  const handleGenerate = () => {
    setIsGenerating(true);
    createInvitation(orgId)
      .then(() => onRefresh())
      .catch((err: Error) => customAlert(err.message))
      .finally(() => setIsGenerating(false));
  };

  const handleRevoke = (inv: OrganizationInvitation) => {
    customConfirm('Revoke this invitation? Members with this code will no longer be able to join.')
      .then(() =>
        revokeInvitation(orgId, inv.id)
          .then(() => onRefresh())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleCopy = (code: string) => {
    const joinUrl = `${window.location.origin}/organizations/join/${code}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const activeInvitations = invitations.filter(
    (inv) => !inv.expiresAt || new Date(inv.expiresAt) > new Date()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Invite Members</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-sphere-grey-600">
          Share an invite link. Anyone with the link can join this organization as a member.
        </p>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
        >
          <Iconify icon="mdi:link-plus" width={18} />
          {isGenerating ? 'Generating...' : 'Generate new invite link'}
        </button>

        {activeInvitations.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-sphere-grey-500">
              Active invitations
            </p>
            {activeInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-2 rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-3 py-2"
              >
                <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-sphere-grey-700">
                  {inv.code}
                </code>
                <span className="text-xs text-sphere-grey-500">
                  {inv.useCount} use{inv.useCount !== 1 ? 's' : ''}
                  {inv.expiresAt && (
                    <> · expires {new Date(inv.expiresAt).toLocaleDateString()}</>
                  )}
                </span>
                <button
                  onClick={() => handleCopy(inv.code)}
                  title="Copy invite link"
                  className="text-sphere-grey-400 hover:text-sphere-primary-700"
                >
                  <Iconify
                    icon={copiedCode === inv.code ? 'mdi:check' : 'mdi:content-copy'}
                    width={16}
                  />
                </button>
                <button
                  onClick={() => handleRevoke(inv)}
                  title="Revoke invitation"
                  className="text-sphere-grey-400 hover:text-red-600"
                >
                  <Iconify icon="mdi:trash-can-outline" width={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeInvitations.length === 0 && (
          <p className="text-center text-sm text-sphere-grey-400">No active invitations.</p>
        )}
      </div>
    </div>
  );
}

// ── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGroup } = useOrganizationsApi();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createGroup(orgId, { name, displayName: displayName || undefined, description: description || undefined })
      .then(() => {
        onCreated();
        onClose();
      })
      .catch((err: Error) => {
        customAlert(err.message);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Create Group</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-group"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-z0-9_-]+"
              title="Lowercase letters, numbers, hyphens and underscores only"
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
            <p className="text-xs text-sphere-grey-500">Lowercase letters, numbers, hyphens and underscores only</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Group"
              maxLength={255}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'members' | 'groups';

export default function OrganizationDetailPage() {
  const { orgName } = useParams<{ orgName: string }>();
  const { authUser } = useAuth();
  const router = useRouter();

  const [org, setOrg] = useState<Organization | null>(null);
  const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);

  const {
    getOrganizationByName,
    getMyMemberships,
    getOrgMembers,
    getOrgGroups,
    listInvitations,
    updateMemberRole,
    removeMember,
  } = useOrganizationsApi();

  const canManage = myRole === 'owner' || myRole === 'admin';

  const loadOrgData = useCallback(async () => {
    if (!authUser.user?.id || !orgName) return;

    try {
      const [orgData, memberships] = await Promise.all([
        getOrganizationByName(orgName),
        getMyMemberships(),
      ]);

      setOrg(orgData);
      const myMembership = memberships.find((m) => m.organization.name === orgName);
      const role = myMembership?.role ?? null;
      setMyRole(role);

      const isManager = role === 'owner' || role === 'admin';
      const [membersData, groupsData, invitationsData] = await Promise.all([
        getOrgMembers(orgData.id),
        getOrgGroups(orgData.id),
        isManager ? listInvitations(orgData.id) : Promise.resolve([]),
      ]);

      setMembers(membersData);
      setGroups(groupsData);
      setInvitations(invitationsData);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  }, [orgName, authUser.user?.id]);

  const refreshInvitations = useCallback(async () => {
    if (!org) return;
    try {
      const data = await listInvitations(org.id);
      setInvitations(data);
    } catch {
      // silently ignore
    }
  }, [org]);

  const refreshMembers = useCallback(async () => {
    if (!org) return;
    try {
      const data = await getOrgMembers(org.id);
      setMembers(data);
    } catch {
      // silently ignore
    }
  }, [org]);

  const refreshGroups = useCallback(async () => {
    if (!org) return;
    try {
      const data = await getOrgGroups(org.id);
      setGroups(data);
    } catch {
      // silently ignore
    }
  }, [org]);

  useEffect(() => {
    if (authUser.isLoading) return;
    if (!authUser.isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOrgData();
  }, [authUser.isLoading, authUser.isAuthenticated, orgName]);

  const handleRemoveMember = (member: OrgMemberWithUser) => {
    customConfirm(`Remove @${member.user.username} from this organization?`)
      .then(() =>
        removeMember(org!.id, member.user.id)
          .then(() => refreshMembers())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleRoleChange = async (member: OrgMemberWithUser, newRole: 'owner' | 'admin' | 'member') => {
    updateMemberRole(org!.id, member.user.id, newRole)
      .then(() => refreshMembers())
      .catch((err: Error) => customAlert(err.message));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sphere-grey-500">Loading...</span>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Organization not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          type="button"
          onClick={() => router.push('/me/organizations')}
          className="mt-1 text-sphere-grey-400 hover:text-sphere-grey-700"
        >
          <Iconify icon="mdi:arrow-left" width={20} />
        </button>
        <OrgAvatar org={org} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-sphere-grey-800">{org.displayName}</h1>
            {myRole && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STYLES[myRole]}`}
              >
                {ROLE_LABELS[myRole]}
              </span>
            )}
          </div>
          <p className="text-sm text-sphere-grey-500">@{org.name}</p>
          {org.description && (
            <p className="mt-1 text-sm text-sphere-grey-600">{org.description}</p>
          )}
        </div>

        {/* Action buttons */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              <Iconify icon="mdi:pencil-outline" width={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
            >
              <Iconify icon="mdi:link-plus" width={16} />
              Invite
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-6 flex gap-4 text-sm text-sphere-grey-600">
        <span className="flex items-center gap-1">
          <Iconify icon="mdi:account-multiple-outline" width={16} />
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Iconify icon="mdi:folder-multiple-outline" width={16} />
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Iconify icon="mdi:calendar-outline" width={16} />
          Created {new Date(org.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-sphere-grey-200">
        {(['overview', 'members', 'groups'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-sphere-primary-800 text-sphere-primary-800'
                : 'text-sphere-grey-500 hover:text-sphere-grey-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-sphere-grey-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sphere-grey-500">
              About
            </h2>
            {org.description ? (
              <p className="text-sm text-sphere-grey-700">{org.description}</p>
            ) : (
              <p className="text-sm italic text-sphere-grey-400">No description provided.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-sphere-grey-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-sphere-primary-800">{members.length}</p>
              <p className="text-xs text-sphere-grey-500">Members</p>
            </div>
            <div className="rounded-lg border border-sphere-grey-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-sphere-primary-800">{groups.length}</p>
              <p className="text-xs text-sphere-grey-500">Groups</p>
            </div>
            {canManage && (
              <div className="rounded-lg border border-sphere-grey-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-sphere-primary-800">
                  {invitations.filter(
                    (i) => !i.expiresAt || new Date(i.expiresAt) > new Date()
                  ).length}
                </p>
                <p className="text-xs text-sphere-grey-500">Active invitations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-3">
          {canManage && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
              >
                <Iconify icon="mdi:account-plus-outline" width={16} />
                Add member
              </button>
            </div>
          )}
          {members.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-sphere-grey-400">
              <Iconify icon="mdi:account-multiple-outline" width={36} />
              <p className="text-sm">No members yet.</p>
            </div>
          )}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border border-sphere-grey-200 bg-white px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sphere-grey-200 text-sphere-grey-600">
                <Iconify icon="mdi:account-outline" width={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sphere-grey-800">
                  @{member.user.username}
                </p>
                <p className="text-xs text-sphere-grey-500">{member.user.email}</p>
              </div>
              {canManage && member.user.id !== authUser.user?.id ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member, e.target.value as 'owner' | 'admin' | 'member')
                  }
                  className="rounded border border-sphere-grey-300 px-2 py-1 text-xs font-semibold"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {myRole === 'owner' && <option value="owner">Owner</option>}
                </select>
              ) : (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STYLES[member.role] ?? ROLE_STYLES.member}`}
                >
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              )}
              {canManage && member.role !== 'owner' && member.user.id !== authUser.user?.id && (
                <button
                  onClick={() => handleRemoveMember(member)}
                  title="Remove member"
                  className="text-sphere-grey-300 hover:text-red-500"
                >
                  <Iconify icon="mdi:account-remove-outline" width={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="flex flex-col gap-3">
          {canManage && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreateGroupModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
              >
                <Iconify icon="mdi:folder-plus-outline" width={16} />
                Create group
              </button>
            </div>
          )}
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-sphere-grey-400">
              <Iconify icon="mdi:folder-multiple-outline" width={36} />
              <p className="text-sm">No groups yet.</p>
            </div>
          )}
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-3 rounded-lg border border-sphere-grey-200 bg-white px-4 py-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sphere-grey-100 text-sphere-grey-600">
                <Iconify icon="mdi:folder-outline" width={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sphere-grey-800">
                  {group.displayName ?? group.name}
                </p>
                <p className="text-xs text-sphere-grey-500">@{group.name}</p>
                {group.description && (
                  <p className="mt-0.5 text-xs text-sphere-grey-400">{group.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editModalOpen && org && (
        <EditOrgModal
          org={org}
          onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => setOrg(updated)}
        />
      )}
      {addMemberModalOpen && org && (
        <AddMemberModal
          orgId={org.id}
          onClose={() => setAddMemberModalOpen(false)}
          onAdded={refreshMembers}
        />
      )}
      {inviteModalOpen && org && (
        <InviteModal
          orgId={org.id}
          invitations={invitations}
          onClose={() => setInviteModalOpen(false)}
          onRefresh={refreshInvitations}
        />
      )}
      {createGroupModalOpen && org && (
        <CreateGroupModal
          orgId={org.id}
          onClose={() => setCreateGroupModalOpen(false)}
          onCreated={refreshGroups}
        />
      )}
    </div>
  );
}
