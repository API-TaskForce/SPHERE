import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Feature, On, Default, Loading, useSpaceClient } from 'space-react-client';
import UpgradeBanner from '../../../space/components/UpgradeBanner';
import {
  Organization,
  OrgMemberWithUser,
  Group,
  OrganizationInvitation,
  OrgPlan,
  useOrganizationsApi,
} from '../../api/organizationsApi';
import { useGroupsApi, GroupCollectionWithCollection, GroupMembershipWithGroup } from '../../api/groupsApi';
import Iconify from '../../../core/components/iconify';
import { useRouter } from '../../../core/hooks/useRouter';
import { useAuth } from '../../../auth/hooks/useAuth';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';
import { usePricingsApi } from '../../../pricing/api/pricingsApi';
import { usePricingCollectionsApi } from '../../../profile/api/pricingCollectionsApi';

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

// ── Create Org Collection Modal ──────────────────────────────────────────────

function CreateOrgCollectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCollection } = usePricingCollectionsApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCollection({ name, description, private: false, pricings: [] });
      onCreated();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to create collection');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Create Collection</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
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
            <button type="button" onClick={onClose} className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">Cancel</button>
            <button type="submit" disabled={isSubmitting || !name.trim()} className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Existing Pricing to Org Modal ───────────────────────────────────────

function AddExistingPricingModal({
  orgId,
  onClose,
  onAdded,
}: {
  orgId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [pricings, setPricings] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAllByOwner, assignPricingToOrg } = usePricingsApi();

  useEffect(() => {
    getAllByOwner()
      .then((res: any) => {
        setPricings(res.pricings ?? []);
        if (res.pricings?.length > 0) setSelected(res.pricings[0].id);
      })
      .catch(() => setPricings([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await assignPricingToOrg(orgId, selected);
      onAdded();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to add pricing');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Add Existing Pricing</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700"><Iconify icon="mdi:close" width={20} /></button>
        </div>
        {isLoading && <p className="text-sm text-sphere-grey-500 py-4 text-center">Loading...</p>}
        {!isLoading && pricings.length === 0 && (
          <p className="text-sm text-sphere-grey-400 py-4 text-center">No pricings available to add.</p>
        )}
        {!isLoading && pricings.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Pricing</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
              >
                {pricings.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50">
                {isSubmitting ? 'Adding...' : 'Add pricing'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Add Existing Collection to Org Modal ─────────────────────────────────────

function AddExistingCollectionModal({
  orgId,
  onClose,
  onAdded,
}: {
  orgId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAllByUser, assignCollectionToOrg } = usePricingCollectionsApi();

  useEffect(() => {
    getAllByUser()
      .then((res: any) => {
        setCollections(res.collections ?? []);
        if (res.collections?.length > 0) setSelected(res.collections[0].id);
      })
      .catch(() => setCollections([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await assignCollectionToOrg(orgId, selected);
      onAdded();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to add collection');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Add Existing Collection</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700"><Iconify icon="mdi:close" width={20} /></button>
        </div>
        {isLoading && <p className="text-sm text-sphere-grey-500 py-4 text-center">Loading...</p>}
        {!isLoading && collections.length === 0 && (
          <p className="text-sm text-sphere-grey-400 py-4 text-center">No collections available to add.</p>
        )}
        {!isLoading && collections.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Collection</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
              >
                {collections.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} · @{c.owner?.username}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50">
                {isSubmitting ? 'Adding...' : 'Add collection'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Assign Pricing to Collection Modal ───────────────────────────────────────

function AssignPricingToCollectionModal({
  onClose,
  onAssigned,
}: {
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [pricings, setPricings] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedPricing, setSelectedPricing] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getLoggedUserPricings, addPricingToCollection } = usePricingsApi();
  const { getLoggedUserCollections } = usePricingCollectionsApi();

  useEffect(() => {
    Promise.all([getLoggedUserPricings(), getLoggedUserCollections()])
      .then(([pricingsRes, collectionsRes]) => {
        const pricingList = pricingsRes?.pricings?.pricings ?? [];
        const collectionList = collectionsRes?.collections ?? [];
        setPricings(pricingList);
        setCollections(collectionList);
        if (pricingList.length > 0) setSelectedPricing(pricingList[0]?.name ?? '');
        if (collectionList.length > 0) setSelectedCollection(collectionList[0].id ?? '');
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPricing || !selectedCollection) return;
    setIsSubmitting(true);
    try {
      await addPricingToCollection(selectedPricing, selectedCollection);
      onAssigned();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to assign pricing');
      setIsSubmitting(false);
    }
  };

  const allPricings = pricings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Assign Pricing to Collection</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700"><Iconify icon="mdi:close" width={20} /></button>
        </div>
        {isLoading && <p className="text-sm text-sphere-grey-500 py-4 text-center">Loading...</p>}
        {!isLoading && (allPricings.length === 0 || collections.length === 0) && (
          <p className="text-sm text-sphere-grey-400 py-4 text-center">No pricings or collections available.</p>
        )}
        {!isLoading && allPricings.length > 0 && collections.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Pricing</label>
              <select value={selectedPricing} onChange={(e) => setSelectedPricing(e.target.value)} className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500">
                {allPricings.map((p: any) => (
                  <option key={`${p.name}-${p.version}`} value={p.name}>{p.name} (v{p.version})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Collection</label>
              <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500">
                {collections.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50">
                {isSubmitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Assign Collection to Group Modal ─────────────────────────────────────────

function AssignCollectionToGroupModal({
  orgId,
  groups,
  onClose,
  onAssigned,
}: {
  orgId: string;
  groups: Group[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? '');
  const [accessRole, setAccessRole] = useState<'editor' | 'viewer' | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getLoggedUserCollections } = usePricingCollectionsApi();
  const { addGroupCollection } = useGroupsApi();

  useEffect(() => {
    getLoggedUserCollections()
      .then((res: any) => {
        const list = res?.collections ?? [];
        setCollections(list);
        if (list.length > 0) setSelectedCollection(list[0].id ?? '');
      })
      .catch(() => setCollections([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollection || !selectedGroup) return;
    setIsSubmitting(true);
    try {
      await addGroupCollection(orgId, selectedGroup, selectedCollection, accessRole || null);
      onAssigned();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to assign collection to group');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Assign Collection to Group</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700"><Iconify icon="mdi:close" width={20} /></button>
        </div>
        {isLoading && <p className="text-sm text-sphere-grey-500 py-4 text-center">Loading...</p>}
        {!isLoading && (collections.length === 0 || groups.length === 0) && (
          <p className="text-sm text-sphere-grey-400 py-4 text-center">No collections or groups available.</p>
        )}
        {!isLoading && collections.length > 0 && groups.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Collection</label>
              <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500">
                {collections.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Group</label>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500">
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.displayName ?? g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Access role override</label>
              <select value={accessRole} onChange={(e) => setAccessRole(e.target.value as 'editor' | 'viewer' | '')} className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500">
                <option value="">Use group role</option>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50">
                {isSubmitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Group Tree ────────────────────────────────────────────────────────────────

interface GroupTreeNode extends Group {
  children: GroupTreeNode[];
}

/** Converts a flat group list (may include subgroups) into a nested tree. */
function buildGroupTree(groups: Group[]): GroupTreeNode[] {
  const nodeMap = new Map<string, GroupTreeNode>(
    groups.map((g) => [g.id, { ...g, children: [] }])
  );
  const roots: GroupTreeNode[] = [];

  for (const node of nodeMap.values()) {
    if (node._parentGroupId && nodeMap.has(node._parentGroupId)) {
      nodeMap.get(node._parentGroupId)!.children.push(node);
    } else {
      // Root group — either no parent, or parent belongs to a different org
      roots.push(node);
    }
  }

  return roots;
}

function GroupTreeItem({
  node,
  depth,
  orgName,
  onNavigate,
}: {
  node: GroupTreeNode;
  depth: number;
  orgName: string;
  onNavigate: (groupId: string) => void;
}) {
  const isNested = depth > 0;
  const indent = depth * 20; // px per level

  return (
    <>
      <div
        style={{ marginLeft: `${indent}px` }}
        className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
          isNested
            ? 'border-sphere-grey-200 border-l-4 border-l-sphere-primary-200'
            : 'border-sphere-grey-200'
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sphere-grey-100 text-sphere-grey-600">
          <Iconify
            icon={isNested ? 'mdi:folder-open-outline' : 'mdi:folder-outline'}
            width={18}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isNested && (
              <Iconify icon="mdi:subdirectory-arrow-right" width={14} className="shrink-0 text-sphere-grey-400" />
            )}
            <p className="truncate text-sm font-semibold text-sphere-grey-800">
              {node.displayName ?? node.name}
            </p>
            {node.children.length > 0 && (
              <span className="shrink-0 rounded-full bg-sphere-grey-100 px-1.5 py-0.5 text-xs text-sphere-grey-500">
                {node.children.length}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-sphere-grey-500">@{node.name}</p>
          {node.description && (
            <p className="mt-0.5 truncate text-xs text-sphere-grey-400">{node.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate(node.id)}
          className="shrink-0 flex items-center gap-1 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-xs font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
        >
          Open
          <Iconify icon="mdi:chevron-right" width={16} />
        </button>
      </div>

      {node.children.map((child) => (
        <GroupTreeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          orgName={orgName}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

// ── Plan Modals ───────────────────────────────────────────────────────────────

const PLAN_META: Record<OrgPlan, { label: string; price: string; features: string[] }> = {
  FREE:       { label: 'Free',       price: '€0/month',  features: ['15 pricings', '5 collections', '1 member', 'Core analysis tools'] },
  PRO:        { label: 'Pro',        price: '€9/month',  features: ['200 pricings', '30 collections', '15 members', 'Group management', 'Collection analytics', 'Bulk import & export'] },
  ENTERPRISE: { label: 'Enterprise', price: '€29/month', features: ['Unlimited everything', 'All features'] },
};

const UPGRADE_PASSWORD = 'sphere';

function UpgradePlanModal({
  currentPlan,
  targetPlan,
  onClose,
  onConfirm,
}: {
  currentPlan: OrgPlan;
  targetPlan: OrgPlan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== UPGRADE_PASSWORD) {
      setError('Incorrect password.');
      return;
    }
    setIsSaving(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">
            Upgrade to {PLAN_META[targetPlan].label}
          </h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <p className="mb-1 text-sm text-sphere-grey-600">
          You are upgrading from <strong>{PLAN_META[currentPlan].label}</strong> to{' '}
          <strong>{PLAN_META[targetPlan].label}</strong> ({PLAN_META[targetPlan].price}).
        </p>
        <ul className="mb-4 mt-2 space-y-1 pl-4 text-sm text-sphere-grey-600">
          {PLAN_META[targetPlan].features.map((f) => (
            <li key={f} className="flex items-center gap-1">
              <Iconify icon="mdi:check-circle-outline" width={14} className="text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-sphere-grey-700">
              Confirm with password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password to confirm"
              className="w-full rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !password}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Upgrading…' : 'Upgrade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DowngradePlanModal({
  currentPlan,
  targetPlan,
  onClose,
  onConfirm,
}: {
  currentPlan: OrgPlan;
  targetPlan: OrgPlan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = () => {
    if (confirmText.trim().toUpperCase() !== 'CONFIRM') return;
    setIsSaving(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">
            Downgrade to {PLAN_META[targetPlan].label}
          </h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="mb-2 font-semibold">⚠️ You will lose access to:</p>
              <ul className="space-y-1 pl-4">
                {PLAN_META[currentPlan].features
                  .filter((f) => !PLAN_META[targetPlan].features.includes(f))
                  .map((f) => (
                    <li key={f} className="flex items-center gap-1">
                      <Iconify icon="mdi:close-circle-outline" width={14} className="text-red-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                <li className="flex items-center gap-1">
                  <Iconify icon="mdi:close-circle-outline" width={14} className="text-red-500 shrink-0" />
                  Group management, collection analytics, bulk import &amp; export
                </li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-md border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                I understand, proceed
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-sphere-grey-600">
              Type <strong>CONFIRM</strong> to downgrade from{' '}
              <strong>{PLAN_META[currentPlan].label}</strong> to{' '}
              <strong>{PLAN_META[targetPlan].label}</strong>.
            </p>
            <input
              type="text"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="mb-4 w-full rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSaving || confirmText.trim().toUpperCase() !== 'CONFIRM'}
                onClick={handleConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? 'Downgrading…' : 'Downgrade'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'members' | 'groups' | 'pricings' | 'collections' | 'settings';

export default function OrganizationDetailPage() {
  const { orgName } = useParams<{ orgName: string }>();
  const { authUser } = useAuth();
  const router = useRouter();
  const spaceClient = useSpaceClient();

  const [org, setOrg] = useState<Organization | null>(null);
  const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [orgPricings, setOrgPricings] = useState<any[]>([]);
  const [orgCollections, setOrgCollections] = useState<any[]>([]);
  // "ownerId/collectionName" → groupIds that contain it (within this org)
  const [collectionGroupMap, setCollectionGroupMap] = useState<Map<string, string[]>>(new Map());
  // "ownerUsername/pricingName" → groupIds that directly contain it (within this org)
  const [pricingGroupMap, setPricingGroupMap] = useState<Map<string, string[]>>(new Map());
  // group IDs where current user has ANY role (admin/editor/viewer) within this org
  const [myGroupMemberIds, setMyGroupMemberIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [addExistingPricingModalOpen, setAddExistingPricingModalOpen] = useState(false);
  const [addExistingCollectionModalOpen, setAddExistingCollectionModalOpen] = useState(false);
  const [assignPricingToCollectionModalOpen, setAssignPricingToCollectionModalOpen] = useState(false);
  const [assignCollectionToGroupModalOpen, setAssignCollectionToGroupModalOpen] = useState(false);

  // Plan management state
  const [currentPlan, setCurrentPlan] = useState<OrgPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [upgradePlanModalOpen, setUpgradePlanModalOpen] = useState(false);
  const [downgradePlanModalOpen, setDowngradePlanModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<OrgPlan | null>(null);

  const {
    getOrganizationByName,
    getMyMemberships,
    getOrgMembers,
    getOrgGroups,
    listInvitations,
    updateMemberRole,
    removeMember,
    getOrgPlan,
    changeOrgPlan,
  } = useOrganizationsApi();

  const { getPricings, getGroupPricings, removeOrgPricing } = usePricingsApi();
  const { getCollections, removeOrgCollection } = usePricingCollectionsApi();
  const { getGroupCollections, getMyGroupMemberships } = useGroupsApi();

  const canManage = myRole === 'owner' || myRole === 'admin';

  /**
   * Returns true if the current user may navigate to a collection's detail page.
   * A collection assigned to ≥1 group is restricted to:
   *   - org owner / admin
   *   - any member (admin/editor/viewer) of any group that contains the collection
   *   - the collection owner (by user ID)
   * Collections not assigned to any group are accessible by all org members.
   */
  const canAccessCollection = useCallback(
    (collection: any): boolean => {
      if (canManage) return true;
      if (collection.owner?.id === authUser.user?.id) return true;
      const key = `${collection.owner?.id}/${collection.name}`;
      const groupIds = collectionGroupMap.get(key) ?? [];
      if (groupIds.length === 0) return true; // collection not assigned to any group
      return groupIds.some((gId) => myGroupMemberIds.has(gId));
    },
    [canManage, authUser.user?.id, collectionGroupMap, myGroupMemberIds]
  );

  /**
   * Returns true if the current user may navigate to a pricing's detail page.
   * Restriction applies when:
   *   - the pricing is directly assigned to a group, OR
   *   - the pricing belongs to a collection that is assigned to a group.
   * Allowed: org owner/admin, creator, any member of the relevant group(s).
   */
  const canAccessPricing = useCallback(
    (pricing: any): boolean => {
      if (canManage) return true;
      if (pricing.owner === authUser.user?.username) return true;

      // Check if pricing is directly in a group (key: ownerUsername/pricingName)
      const pricingKey = `${pricing.owner}/${pricing.name}`;
      const directGroupIds = pricingGroupMap.get(pricingKey) ?? [];
      if (directGroupIds.length > 0) {
        return directGroupIds.some((gId) => myGroupMemberIds.has(gId));
      }

      // Check if pricing's collection is assigned to a group
      const collection = pricing.collectionName
        ? orgCollections.find(
            (c) => c.name === pricing.collectionName && c.owner?.username === pricing.owner
          )
        : null;
      if (!collection) return true; // no group context → unrestricted
      const colKey = `${collection.owner?.id}/${collection.name}`;
      const colGroupIds = collectionGroupMap.get(colKey) ?? [];
      if (colGroupIds.length === 0) return true; // collection not in any group
      return colGroupIds.some((gId) => myGroupMemberIds.has(gId));
    },
    [canManage, authUser.user?.username, pricingGroupMap, orgCollections, collectionGroupMap, myGroupMemberIds]
  );

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
      const [membersData, groupsData, invitationsData, pricingsData, collectionsData] = await Promise.all([
        getOrgMembers(orgData.id),
        getOrgGroups(orgData.id),
        isManager ? listInvitations(orgData.id) : Promise.resolve([]),
        getPricings({}, orgData.id).catch(() => ({ pricings: [] })),
        getCollections({}, orgData.id).catch(() => ({ collections: [] })),
      ]);

      setMembers(membersData);
      setGroups(groupsData);
      setInvitations(invitationsData);
      setOrgPricings(pricingsData?.pricings ?? []);
      setOrgCollections(collectionsData?.collections ?? []);

      // Build group-access maps for collection/pricing detail access control.
      // Fetch in parallel: every group's collections, every group's pricings, and my memberships.
      const [allGroupCollections, allGroupPricings, myGroupMemberships] = await Promise.all([
        Promise.all(
          groupsData.map((g) =>
            getGroupCollections(g.id).catch((): GroupCollectionWithCollection[] => [])
          )
        ),
        Promise.all(
          groupsData.map((g) =>
            getGroupPricings(g.id)
              .then((res: any) => res?.pricings ?? [])
              .catch((): any[] => [])
          )
        ),
        authUser.user?.id
          ? getMyGroupMemberships(authUser.user.id).catch((): GroupMembershipWithGroup[] => [])
          : Promise.resolve([] as GroupMembershipWithGroup[]),
      ]);

      // Map: "ownerId/collectionName" → groupIds[] (only groups within this org).
      // Composite key avoids relying on collection.id (absent from Collection type).
      const colGroupMap = new Map<string, string[]>();
      allGroupCollections.forEach((cols, idx) => {
        const groupId = groupsData[idx].id;
        cols.forEach((gc) => {
          const key = `${gc.pricingCollection.ownerId}/${gc.pricingCollection.name}`;
          const existing = colGroupMap.get(key) ?? [];
          existing.push(groupId);
          colGroupMap.set(key, existing);
        });
      });
      setCollectionGroupMap(colGroupMap);

      // Map: "ownerUsername/pricingName" → groupIds[] for pricings directly in a group.
      const pricGrpMap = new Map<string, string[]>();
      allGroupPricings.forEach((pricings, idx) => {
        const groupId = groupsData[idx].id;
        pricings.forEach((p: any) => {
          const key = `${p.owner}/${p.name}`;
          const existing = pricGrpMap.get(key) ?? [];
          existing.push(groupId);
          pricGrpMap.set(key, existing);
        });
      });
      setPricingGroupMap(pricGrpMap);

      // Set of group IDs where the current user has ANY role (admin/editor/viewer) in this org.
      // Members of a group — regardless of role — may access that group's content.
      setMyGroupMemberIds(
        new Set(
          myGroupMemberships
            .filter((m) => m._organizationId === orgData.id)
            .map((m) => m._groupId)
        )
      );
    } catch (err: any) {
      setError(err.message ?? 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  }, [orgName, authUser.user?.id]);

  const refreshPricings = useCallback(async () => {
    if (!org?.id) return;
    try {
      const data = await getPricings({}, org.id);
      setOrgPricings(data?.pricings ?? []);
    } catch {
      // ignore
    }
  }, [getPricings, org]);

  const refreshCollections = useCallback(async () => {
    if (!org?.id) return;
    try {
      const data = await getCollections({}, org.id);
      setOrgCollections(data?.collections ?? []);
    } catch {
      // ignore
    }
  }, [getCollections, org]);

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

  // Load plan when settings tab opens (owner-only)
  useEffect(() => {
    if (activeTab !== 'settings' || !org?.id || myRole !== 'owner') return;
    setPlanLoading(true);
    setPlanError(null);
    getOrgPlan(org.id)
      .then((plan) => setCurrentPlan(plan))
      .catch((err: Error) => setPlanError(err.message))
      .finally(() => setPlanLoading(false));
  }, [activeTab, org?.id, myRole]);

  const handleChangePlan = async (newPlan: OrgPlan) => {
    if (!org?.id) return;
    try {
      await changeOrgPlan(org.id, newPlan);
      setCurrentPlan(newPlan);
      setUpgradePlanModalOpen(false);
      setDowngradePlanModalOpen(false);
      setTargetPlan(null);
      // Refresh the SPACE pricing token so Feature components immediately
      // reflect the new plan without requiring a page reload.
      spaceClient.setUserId(org.id).catch(() => {});
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to change plan');
      setUpgradePlanModalOpen(false);
      setDowngradePlanModalOpen(false);
    }
  };

  const openPlanModal = (plan: OrgPlan) => {
    const planOrder: OrgPlan[] = ['FREE', 'PRO', 'ENTERPRISE'];
    const isUpgrade = planOrder.indexOf(plan) > planOrder.indexOf(currentPlan ?? 'FREE');
    setTargetPlan(plan);
    if (isUpgrade) {
      setUpgradePlanModalOpen(true);
    } else {
      setDowngradePlanModalOpen(true);
    }
  };

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

  const handleRemoveOrgPricing = (pricing: any) => {
    customConfirm(`Remove "${pricing.name}" from this organization?`)
      .then(() =>
        // org-pricings list does not expose id (aggregator uses _id:0); identify by owner+name
        removeOrgPricing(org!.id, pricing.owner, pricing.name)
          .then(() => refreshPricings())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleRemoveOrgCollection = (collection: any) => {
    customConfirm(`Remove "${collection.name}" from this organization?`)
      .then(() =>
        // org-collections list does not map _id to 'id'; _id is present as the raw Mongo field
        removeOrgCollection(org!.id, collection._id ?? collection.id)
          .then(() => refreshCollections())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
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
        {((['overview', 'members', 'groups', 'pricings', 'collections'] as Tab[]).concat(myRole === 'owner' ? ['settings' as Tab] : [])).map((tab) => (
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

      {/* Groups Tab — tree view */}
      {activeTab === 'groups' && (
        <Feature id="sphere-groupManagement">
          <On>
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
              {buildGroupTree(groups).map((root) => (
                <GroupTreeItem
                  key={root.id}
                  node={root}
                  depth={0}
                  orgName={org.name}
                  onNavigate={(groupId) => router.push(`/me/organizations/${org.name}/groups/${groupId}`)}
                />
              ))}
            </div>
          </On>
          <Default>
            <UpgradeBanner feature="Group Management" />
          </Default>
          <Loading>
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </Loading>
        </Feature>
      )}

      {/* Pricings Tab */}
      {activeTab === 'pricings' && (
        <div className="flex flex-col gap-3">
          {canManage && (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setAddExistingPricingModalOpen(true)} className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700">
                <Iconify icon="mdi:link-variant-plus" width={16} />Add pricing
              </button>
              <button type="button" onClick={() => setAssignPricingToCollectionModalOpen(true)} className="flex items-center gap-2 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">
                <Iconify icon="mdi:folder-arrow-right-outline" width={16} />Assign to collection
              </button>
            </div>
          )}
          {orgPricings.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-sphere-grey-400">
              <Iconify icon="mdi:tag-outline" width={36} />
              <p className="text-sm">No pricings in this organization yet.</p>
            </div>
          )}
          {orgPricings.map((pricing: any) => (
            <div key={`${pricing.name}-${pricing.version}`} className="flex items-center gap-3 rounded-lg border border-sphere-grey-200 bg-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sphere-grey-100 text-sphere-grey-600">
                <Iconify icon="mdi:tag-outline" width={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sphere-grey-800">{pricing.name}</p>
                <p className="text-xs text-sphere-grey-500">v{pricing.version} · @{pricing.owner}</p>
              </div>
              {canAccessPricing(pricing) ? (
                <button
                  type="button"
                  onClick={() => router.push(`/pricings/${pricing.owner}/${pricing.name}?collectionName=${pricing.collectionName ?? 'undefined'}`)}
                  className="flex items-center gap-1 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-xs font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
                >
                  Open<Iconify icon="mdi:chevron-right" width={16} />
                </button>
              ) : (
                <span
                  title="Only the group admin, collection owner, or org admin can access this pricing"
                  className="flex items-center gap-1 rounded-md border border-sphere-grey-200 px-3 py-1.5 text-xs text-sphere-grey-400 cursor-not-allowed select-none"
                >
                  <Iconify icon="mdi:lock-outline" width={14} />
                  Restricted
                </span>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveOrgPricing(pricing)}
                  title="Remove from organization"
                  className="text-sphere-grey-300 hover:text-red-500"
                >
                  <Iconify icon="mdi:link-variant-remove" width={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="flex flex-col gap-3">
          {canManage && (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setCreateCollectionModalOpen(true)} className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700">
                <Iconify icon="mdi:plus" width={16} />Create collection
              </button>
              <button type="button" onClick={() => setAddExistingCollectionModalOpen(true)} className="flex items-center gap-2 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">
                <Iconify icon="mdi:link-variant-plus" width={16} />Add existing
              </button>
              <Feature id="sphere-sharedCollections">
                <On>
                  <button type="button" onClick={() => setAssignCollectionToGroupModalOpen(true)} className="flex items-center gap-2 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100">
                    <Iconify icon="mdi:folder-arrow-right-outline" width={16} />Assign to group
                  </button>
                </On>
                <Default>
                  <UpgradeBanner feature="Shared Collections" compact />
                </Default>
                <Loading>{null}</Loading>
              </Feature>
            </div>
          )}
          {orgCollections.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-sphere-grey-400">
              <Iconify icon="mdi:view-grid-outline" width={36} />
              <p className="text-sm">No collections in this organization yet.</p>
            </div>
          )}
          {orgCollections.map((collection: any) => (
            <div key={collection.id} className="flex items-center gap-3 rounded-lg border border-sphere-grey-200 bg-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sphere-grey-100 text-sphere-grey-600">
                <Iconify icon="mdi:view-grid-outline" width={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sphere-grey-800">{collection.name}</p>
                <p className="text-xs text-sphere-grey-500">{collection.numberOfPricings ?? 0} pricing{collection.numberOfPricings !== 1 ? 's' : ''} · @{collection.owner?.username}</p>
              </div>
              {canAccessCollection(collection) ? (
                <button
                  type="button"
                  onClick={() => router.push(`/pricings/collections/${collection.owner?.id}/${collection.name}`)}
                  className="flex items-center gap-1 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-xs font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
                >
                  Open<Iconify icon="mdi:chevron-right" width={16} />
                </button>
              ) : (
                <span
                  title="Only the group admin, collection owner, or org admin can access this collection"
                  className="flex items-center gap-1 rounded-md border border-sphere-grey-200 px-3 py-1.5 text-xs text-sphere-grey-400 cursor-not-allowed select-none"
                >
                  <Iconify icon="mdi:lock-outline" width={14} />
                  Restricted
                </span>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveOrgCollection(collection)}
                  title="Remove from organization"
                  className="text-sphere-grey-300 hover:text-red-500"
                >
                  <Iconify icon="mdi:link-variant-remove" width={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab — owner-only plan management */}
      {activeTab === 'settings' && myRole === 'owner' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-sphere-grey-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-sphere-grey-500">
              Subscription Plan
            </h2>
            {planLoading && (
              <p className="text-sm text-sphere-grey-400">Loading plan…</p>
            )}
            {planError && (
              <p className="text-sm text-red-600">{planError}</p>
            )}
            {!planLoading && !planError && currentPlan && (
              <>
                <p className="mb-4 text-sm text-sphere-grey-600">
                  Current plan:{' '}
                  <span className="font-semibold text-sphere-primary-800">
                    {PLAN_META[currentPlan].label}
                  </span>{' '}
                  — {PLAN_META[currentPlan].price}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(['FREE', 'PRO', 'ENTERPRISE'] as OrgPlan[]).map((plan) => {
                    const isCurrent = plan === currentPlan;
                    return (
                      <div
                        key={plan}
                        className={`flex flex-col gap-3 rounded-lg border p-4 ${
                          isCurrent
                            ? 'border-sphere-primary-400 bg-sphere-primary-50'
                            : 'border-sphere-grey-200 bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sphere-grey-800">{PLAN_META[plan].label}</p>
                          <p className="text-sm text-sphere-grey-500">{PLAN_META[plan].price}</p>
                        </div>
                        <ul className="flex-1 space-y-1 text-xs text-sphere-grey-600">
                          {PLAN_META[plan].features.map((f) => (
                            <li key={f} className="flex items-center gap-1">
                              <Iconify icon="mdi:check" width={12} className="text-green-500 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <span className="inline-flex items-center justify-center rounded-md bg-sphere-primary-100 px-3 py-1.5 text-xs font-semibold text-sphere-primary-800">
                            Current plan
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPlanModal(plan)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                              (['FREE', 'PRO', 'ENTERPRISE'] as OrgPlan[]).indexOf(plan) >
                              (['FREE', 'PRO', 'ENTERPRISE'] as OrgPlan[]).indexOf(currentPlan)
                                ? 'bg-sphere-primary-800 text-white hover:bg-sphere-primary-700'
                                : 'border border-red-400 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {(['FREE', 'PRO', 'ENTERPRISE'] as OrgPlan[]).indexOf(plan) >
                            (['FREE', 'PRO', 'ENTERPRISE'] as OrgPlan[]).indexOf(currentPlan)
                              ? 'Upgrade'
                              : 'Downgrade'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
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
      {createCollectionModalOpen && (
        <CreateOrgCollectionModal
          onClose={() => setCreateCollectionModalOpen(false)}
          onCreated={() => { setCreateCollectionModalOpen(false); refreshCollections(); }}
        />
      )}
      {addExistingPricingModalOpen && org && (
        <AddExistingPricingModal
          orgId={org.id}
          onClose={() => setAddExistingPricingModalOpen(false)}
          onAdded={() => { setAddExistingPricingModalOpen(false); refreshPricings(); }}
        />
      )}
      {addExistingCollectionModalOpen && org && (
        <AddExistingCollectionModal
          orgId={org.id}
          onClose={() => setAddExistingCollectionModalOpen(false)}
          onAdded={() => { setAddExistingCollectionModalOpen(false); refreshCollections(); }}
        />
      )}
      {assignPricingToCollectionModalOpen && (
        <AssignPricingToCollectionModal
          onClose={() => setAssignPricingToCollectionModalOpen(false)}
          onAssigned={() => { setAssignPricingToCollectionModalOpen(false); refreshPricings(); refreshCollections(); }}
        />
      )}
      {assignCollectionToGroupModalOpen && org && (
        <AssignCollectionToGroupModal
          orgId={org.id}
          groups={groups}
          onClose={() => setAssignCollectionToGroupModalOpen(false)}
          onAssigned={() => { setAssignCollectionToGroupModalOpen(false); refreshCollections(); }}
        />
      )}

      {/* Plan change modals */}
      {upgradePlanModalOpen && currentPlan && targetPlan && (
        <UpgradePlanModal
          currentPlan={currentPlan}
          targetPlan={targetPlan}
          onClose={() => { setUpgradePlanModalOpen(false); setTargetPlan(null); }}
          onConfirm={() => handleChangePlan(targetPlan)}
        />
      )}
      {downgradePlanModalOpen && currentPlan && targetPlan && (
        <DowngradePlanModal
          currentPlan={currentPlan}
          targetPlan={targetPlan}
          onClose={() => { setDowngradePlanModalOpen(false); setTargetPlan(null); }}
          onConfirm={() => handleChangePlan(targetPlan)}
        />
      )}
    </div>
  );
}
