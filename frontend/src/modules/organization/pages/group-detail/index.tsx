import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Iconify from '../../../core/components/iconify';
import { useRouter } from '../../../core/hooks/useRouter';
import { useAuth } from '../../../auth/hooks/useAuth';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';
import { useOrganization } from '../../hooks/useOrganization';
import { Group, useOrganizationsApi } from '../../api/organizationsApi';
import {
  AvailableGroupCollectionOption,
  GroupCollectionAccessRole,
  GroupCollectionWithCollection,
  GroupMemberWithUser,
  GroupRole,
  useGroupsApi,
} from '../../api/groupsApi';
import { usePricingsApi } from '../../../pricing/api/pricingsApi';
import { usePricingCollectionsApi } from '../../../profile/api/pricingCollectionsApi';

const GROUP_ROLE_LABELS: Record<GroupRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const GROUP_ROLE_STYLES: Record<GroupRole, string> = {
  admin: 'bg-sphere-primary-100 text-sphere-primary-800',
  editor: 'bg-amber-100 text-amber-800',
  viewer: 'bg-sphere-grey-200 text-sphere-grey-700',
};

const COLLECTION_ROLE_LABELS: Record<NonNullable<GroupCollectionAccessRole> | 'none', string> = {
  editor: 'Editor',
  viewer: 'Viewer',
  none: 'Group role',
};

const COLLECTION_ROLE_STYLES: Record<NonNullable<GroupCollectionAccessRole> | 'none', string> = {
  editor: 'bg-emerald-100 text-emerald-800',
  viewer: 'bg-slate-100 text-slate-700',
  none: 'bg-sphere-grey-100 text-sphere-grey-500',
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function EditGroupModal({
  group,
  onClose,
  onSaved,
}: {
  group: Group;
  onClose: () => void;
  onSaved: (updated: Group) => void;
}) {
  const [displayName, setDisplayName] = useState(group.displayName ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { updateGroup } = useGroupsApi();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    updateGroup(group.id, {
      displayName: displayName || undefined,
      description: description || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Edit Group</h2>
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
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="My group"
              maxLength={255}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
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

// Candidate user shape shared between org-member and group-member responses
interface MemberCandidate {
  id: string;
  username: string;
  email: string;
}

function AddGroupMemberModal({
  groupId,
  candidates,
  isLoadingCandidates,
  isSubgroup,
  onClose,
  onAdded,
}: {
  groupId: string;
  /** Users eligible to be added — org members (L1) or parent-group members (L2+), already filtered. */
  candidates: MemberCandidate[];
  isLoadingCandidates: boolean;
  /** True when the group has a parent (used only for the empty-state label). */
  isSubgroup: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<GroupRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addGroupMember } = useGroupsApi();

  // Auto-select first candidate once list loads
  useEffect(() => {
    if (candidates.length > 0 && !selectedUserId) {
      setSelectedUserId(candidates[0].id);
    }
  }, [candidates, selectedUserId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) return;
    setIsSubmitting(true);

    try {
      await addGroupMember(groupId, selectedUserId, role);
      onAdded();
      onClose();
    } catch (error: unknown) {
      customAlert(getErrorMessage(error, 'Failed to add group member'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Add Group Member</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>

        {isLoadingCandidates && (
          <p className="py-8 text-center text-sm text-sphere-grey-500">Loading eligible members…</p>
        )}

        {!isLoadingCandidates && candidates.length === 0 && (
          <div className="rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-6 text-center text-sm text-sphere-grey-500">
            {isSubgroup
              ? 'All members of the parent group are already in this subgroup.'
              : 'All organization members are already in this group.'}
          </div>
        )}

        {!isLoadingCandidates && candidates.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">
                {isSubgroup ? 'Member (from parent group)' : 'Member (from organization)'}
              </label>
              {/* Scrollable candidate list — select by clicking */}
              <div className="max-h-48 overflow-y-auto rounded-md border border-sphere-grey-300">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedUserId(c.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-sphere-grey-50 ${
                      selectedUserId === c.id ? 'bg-sphere-primary-50 font-semibold' : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sphere-grey-200 text-sphere-grey-600">
                      <Iconify icon="mdi:account-outline" width={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-sphere-grey-800">@{c.username}</p>
                      <p className="truncate text-xs text-sphere-grey-500">{c.email}</p>
                    </div>
                    {selectedUserId === c.id && (
                      <Iconify icon="mdi:check-circle" width={16} className="ml-auto shrink-0 text-sphere-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as GroupRole)}
                className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
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
                disabled={isSubmitting || !selectedUserId}
                className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AddGroupCollectionModal({
  orgId,
  groupId,
  collections,
  isLoading,
  onClose,
  onAdded,
}: {
  orgId: string;
  groupId: string;
  collections: AvailableGroupCollectionOption[];
  isLoading: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [accessRole, setAccessRole] = useState<GroupCollectionAccessRole>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addGroupCollection } = useGroupsApi();

  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCollectionId) return;

    setIsSubmitting(true);
    try {
      await addGroupCollection(orgId, groupId, selectedCollectionId, accessRole);
      await onAdded();
      onClose();
    } catch (err: unknown) {
      customAlert(getErrorMessage(err, 'Failed to associate collection'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Associate Collection</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm text-sphere-grey-500">Loading available collections...</div>
        )}

        {!isLoading && collections.length === 0 && (
          <div className="rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-6 text-center text-sm text-sphere-grey-500">
            There are no more collections available to associate with this group.
          </div>
        )}

        {!isLoading && collections.length > 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Collection</label>
              <select
                value={selectedCollectionId}
                onChange={(event) => setSelectedCollectionId(event.target.value)}
                className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} · @{collection.owner.username}
                  </option>
                ))}
              </select>
              {selectedCollectionId && (
                <p className="text-xs text-sphere-grey-500">
                  {collections.find((collection) => collection.id === selectedCollectionId)?.description ||
                    'No description provided.'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-sphere-grey-700">Access role override</label>
              <select
                value={accessRole ?? ''}
                onChange={(event) => {
                  const val = event.target.value;
                  setAccessRole(val === '' ? null : (val as NonNullable<GroupCollectionAccessRole>));
                }}
                className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
              >
                <option value="">Use group role</option>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <p className="text-xs text-sphere-grey-500">
                Leave as "Use group role" to inherit each member's role within this group.
              </p>
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
                disabled={isSubmitting || !selectedCollectionId}
                className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Associating...' : 'Associate collection'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Create Group Collection Modal ─────────────────────────────────────────────

function CreateGroupCollectionModal({
  groupId,
  onClose,
  onCreated,
}: {
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGroupCollection } = usePricingCollectionsApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createGroupCollection(groupId, { name, description, private: false, pricings: [] });
      onCreated();
      onClose();
    } catch (err: unknown) {
      customAlert(getErrorMessage(err, 'Failed to create collection'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Create Collection</h2>
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sphere-grey-300 px-4 py-2 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Existing Pricing to Group Modal ──────────────────────────────────────

function AddExistingPricingToGroupModal({
  groupId,
  onClose,
  onAdded,
}: {
  groupId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [pricings, setPricings] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAllByOwner, assignExistingPricingToGroup } = usePricingsApi();

  useEffect(() => {
    getAllByOwner()
      .then((res: any) => {
        const list = res.pricings ?? [];
        setPricings(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .catch(() => setPricings([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await assignExistingPricingToGroup(groupId, selected);
      onAdded();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to add pricing');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Add Existing Pricing</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        {isLoading && <p className="py-4 text-center text-sm text-sphere-grey-500">Loading...</p>}
        {!isLoading && pricings.length === 0 && (
          <p className="py-4 text-center text-sm text-sphere-grey-400">No pricings available to add.</p>
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
                  <option key={p.id} value={p.id}>
                    {p.name} (v{p.version})
                  </option>
                ))}
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
                {isSubmitting ? 'Adding...' : 'Add pricing'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Assign Group Pricing to Group Collection Modal ───────────────────────────

function AssignGroupPricingToCollectionModal({
  groupId,
  groupPricings,
  groupCollections,
  onClose,
  onAssigned,
}: {
  groupId: string;
  groupPricings: any[];
  groupCollections: GroupCollectionWithCollection[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  // Only offer pricings that are not already in a collection
  const availablePricings = groupPricings.filter((p: any) => !p._collectionId);

  const [selectedPricing, setSelectedPricing] = useState(availablePricings[0]?.name ?? '');
  const [selectedCollection, setSelectedCollection] = useState(
    groupCollections[0]?._pricingCollectionId ?? ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPricingToCollection } = usePricingsApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPricing || !selectedCollection) return;
    setIsSubmitting(true);
    try {
      await addPricingToCollection(selectedPricing, selectedCollection);
      onAssigned();
      onClose();
    } catch (err: any) {
      customAlert(err.message ?? 'Failed to assign pricing to collection');
      setIsSubmitting(false);
    }
  };

  if (availablePricings.length === 0 || groupCollections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-sphere-grey-800">Assign Pricing to Collection</h2>
            <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
              <Iconify icon="mdi:close" width={20} />
            </button>
          </div>
          <p className="py-4 text-center text-sm text-sphere-grey-400">
            {groupCollections.length === 0
              ? 'This group needs at least one collection.'
              : 'All group pricings are already assigned to a collection.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Assign Pricing to Collection</h2>
          <button onClick={onClose} className="text-sphere-grey-400 hover:text-sphere-grey-700">
            <Iconify icon="mdi:close" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Pricing</label>
            <select
              value={selectedPricing}
              onChange={(e) => setSelectedPricing(e.target.value)}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            >
              {availablePricings.map((p: any) => (
                <option key={p.id} value={p.name}>
                  {p.name} (v{p.version})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            >
              {groupCollections.map((gc) => (
                <option key={gc._pricingCollectionId} value={gc._pricingCollectionId}>
                  {gc.pricingCollection.name}
                </option>
              ))}
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
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Subgroup Modal ──────────────────────────────────────────────────────

function CreateSubgroupModal({
  parentGroupId,
  onClose,
  onCreated,
}: {
  parentGroupId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSubgroup } = useGroupsApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSubgroup(parentGroupId, {
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      customAlert(getErrorMessage(err, 'Failed to create subgroup'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-sphere-grey-800">Create Subgroup</h2>
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
              required
              minLength={3}
              maxLength={50}
              placeholder="my-subgroup"
              className="rounded-md border border-sphere-grey-300 px-3 py-2 text-sm outline-none focus:border-sphere-primary-500 focus:ring-1 focus:ring-sphere-primary-500"
            />
            <p className="text-xs text-sphere-grey-400">Unique identifier within the organization (3–50 chars).</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-sphere-grey-700">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Subgroup"
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
              disabled={isSubmitting || name.trim().length < 3}
              className="rounded-md bg-sphere-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sphere-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create subgroup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  const { orgName, groupId } = useParams<{ orgName: string; groupId: string }>();
  const { authUser } = useAuth();
  const router = useRouter();
  const { activeOrganization, isLoading: isOrgLoading } = useOrganization();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [collections, setCollections] = useState<GroupCollectionWithCollection[]>([]);
  const [groupPricings, setGroupPricings] = useState<any[]>([]);
  const [availableCollections, setAvailableCollections] = useState<AvailableGroupCollectionOption[]>([]);
  const [myOrgRole, setMyOrgRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [myGroupRole, setMyGroupRole] = useState<GroupRole | null>(null);
  const [myParentGroupRole, setMyParentGroupRole] = useState<GroupRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailableCollections, setIsLoadingAvailableCollections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subgroups, setSubgroups] = useState<Group[]>([]);
  const [memberCandidates, setMemberCandidates] = useState<{ id: string; username: string; email: string }[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [addCollectionModalOpen, setAddCollectionModalOpen] = useState(false);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [addExistingPricingModalOpen, setAddExistingPricingModalOpen] = useState(false);
  const [assignPricingToCollectionModalOpen, setAssignPricingToCollectionModalOpen] = useState(false);
  const [createSubgroupModalOpen, setCreateSubgroupModalOpen] = useState(false);

  const { getMyMemberships, getOrgMembers } = useOrganizationsApi();
  const {
    getGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    getGroupCollections,
    getAvailableCollections,
    getMyGroupMemberships,
    updateGroupMemberRole,
    removeGroupMember,
    updateGroupCollectionAccess,
    removeGroupCollection,
    getSubgroups,
  } = useGroupsApi();
  const { getGroupPricings, removeGroupPricing } = usePricingsApi();

  const isSubgroup = !!group?._parentGroupId;
  const canManageOrg = myOrgRole === 'owner' || myOrgRole === 'admin';
  // Parent group admin has the same management rights over direct subgroups as org admin has over groups.
  const canManageGroup = canManageOrg || myGroupRole === 'admin' || (isSubgroup && myParentGroupRole === 'admin');
  const canManageMembers = canManageGroup;
  const canManageCollections = canManageGroup;

  // Resource-owner bypass: the owner of a collection/pricing can always unassign it from the group,
  // regardless of their group role (backed by the Cedar isResourceOwner policy).
  const canRemoveCollectionFromGroup = (collection: GroupCollectionWithCollection) =>
    canManageGroup || collection.pricingCollection.ownerId === authUser.user?.id;

  const canRemovePricingFromGroup = (pricing: any) =>
    canManageGroup || pricing.owner === authUser.user?.username;
  const canDeleteGroup = canManageOrg || (!!group?._parentGroupId && myParentGroupRole === 'admin');
  // Any group member (admin/editor/viewer) or org owner/admin can view group content.
  // Derived from the already-fetched members list (loaded via getGroupMembers with org context)
  // instead of myGroupRole, which relies on getMyGroupMemberships (no org context header).
  const isGroupMember = canManageOrg || members.some((m) => m.user.id === authUser.user?.id);

  const refreshMembers = useCallback(async () => {
    if (!groupId) return;

    try {
      const data = await getGroupMembers(groupId);
      setMembers(data);
    } catch {
      // Ignore refresh errors to avoid disrupting the screen.
    }
  }, [groupId, getGroupMembers]);

  const refreshCollections = useCallback(async () => {
    if (!groupId) return;

    try {
      const data = await getGroupCollections(groupId);
      setCollections(data);
    } catch {
      // Ignore refresh errors to avoid disrupting the screen.
    }
  }, [groupId, getGroupCollections]);

  const refreshPricings = useCallback(async () => {
    if (!groupId) return;

    try {
      const data = await getGroupPricings(groupId);
      setGroupPricings(data?.pricings ?? []);
    } catch {
      // Ignore refresh errors to avoid disrupting the screen.
    }
  }, [groupId, getGroupPricings]);

  const refreshSubgroups = useCallback(async () => {
    if (!groupId) return;

    try {
      const data = await getSubgroups(groupId);
      setSubgroups(data);
    } catch {
      // Ignore refresh errors to avoid disrupting the screen.
    }
  }, [groupId, getSubgroups]);

  /**
   * Loads the eligible candidates for adding a new member to this group:
   *   - L1 group (no parent) → all org members not already in this group
   *   - L2+ group (has parent) → parent group members not already in this group
   */
  const loadMemberCandidates = useCallback(async () => {
    if (!group || !activeOrganization?.id) return;

    setIsLoadingCandidates(true);
    try {
      const existingIds = new Set(members.map((m) => m.user.id));

      if (!group._parentGroupId) {
        // Level-1: source = org members
        const orgMembers = await getOrgMembers(activeOrganization.id);
        setMemberCandidates(
          orgMembers
            .filter((m) => !existingIds.has(m.user.id))
            .map((m) => ({ id: m.user.id, username: m.user.username, email: m.user.email }))
        );
      } else {
        // Level-2+: source = parent group members (only parent-group members can be added here)
        const parentMembers = await getGroupMembers(group._parentGroupId);
        setMemberCandidates(
          parentMembers
            .filter((m) => !existingIds.has(m.user.id))
            .map((m) => ({ id: m.user.id, username: m.user.username, email: m.user.email }))
        );
      }
    } catch {
      setMemberCandidates([]);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [group, activeOrganization?.id, members, getOrgMembers, getGroupMembers]);

  const loadAvailableCollections = useCallback(async () => {
    if (!groupId || !activeOrganization?.id || !canManageCollections) return;

    setIsLoadingAvailableCollections(true);

    try {
      const data = await getAvailableCollections(activeOrganization.id, groupId);
      setAvailableCollections(data);
    } catch (error: unknown) {
      customAlert(getErrorMessage(error, 'Failed to load available collections'));
    } finally {
      setIsLoadingAvailableCollections(false);
    }
  }, [groupId, activeOrganization?.id, canManageCollections, getAvailableCollections]);

  const loadGroupData = useCallback(async () => {
    if (!authUser.user?.id || !groupId || !orgName || !activeOrganization?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [orgMemberships, userGroupMemberships, groupData] = await Promise.all([
        getMyMemberships(),
        getMyGroupMemberships(authUser.user.id),
        getGroup(groupId),
      ]);

      const organizationMembership = orgMemberships.find(
        (membership) => membership.organization.name === orgName
      );
      const groupMembership = userGroupMemberships.find(
        (membership) => membership.group.id === groupId
      );
      const parentGroupMembership = groupData._parentGroupId
        ? userGroupMemberships.find((membership) => membership.group.id === groupData._parentGroupId)
        : undefined;

      setMyOrgRole(organizationMembership?.role ?? null);
      setMyGroupRole(groupMembership?.role ?? null);
      setMyParentGroupRole(parentGroupMembership?.role ?? null);
      setGroup(groupData);

      const [membersData, collectionsData, pricingsData, subgroupsData] = await Promise.all([
        getGroupMembers(groupId),
        getGroupCollections(groupId),
        getGroupPricings(groupId).catch(() => ({ pricings: [] })),
        getSubgroups(groupId).catch(() => []),
      ]);

      setMembers(membersData);
      setCollections(collectionsData);
      setGroupPricings(pricingsData?.pricings ?? []);
      setSubgroups(subgroupsData);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load group'));
    } finally {
      setIsLoading(false);
    }
  }, [
    authUser.user?.id,
    groupId,
    orgName,
    activeOrganization?.id,
    getMyMemberships,
    getMyGroupMemberships,
    getGroup,
    getGroupMembers,
    getGroupCollections,
    getGroupPricings,
    getSubgroups,
  ]);

  useEffect(() => {
    if (authUser.isLoading || isOrgLoading) return;

    if (!authUser.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!activeOrganization || activeOrganization.name !== orgName) {
      return;
    }

    loadGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authUser.isLoading,
    authUser.isAuthenticated,
    isOrgLoading,
    activeOrganization?.id,
    activeOrganization?.name,
    orgName,
    groupId,
  ]);

  useEffect(() => {
    if (addMemberModalOpen) {
      loadMemberCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMemberModalOpen]);

  useEffect(() => {
    if (addCollectionModalOpen) {
      loadAvailableCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addCollectionModalOpen]);

  const handleDeleteGroup = () => {
    if (!group) return;

    customConfirm(`Delete the group ${group.displayName ?? group.name}?`)
      .then(() =>
        deleteGroup(group.id)
          .then(() => router.push(`/me/organizations/${orgName}`))
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  /**
   * Promotes a subgroup to root-level by clearing its _parentGroupId.
   * Restricted to org admin/owner (canManageOrg guard enforced at render time).
   */
  const handlePromoteToRoot = () => {
    if (!group || !canManageOrg) return;

    customConfirm(
      `Promote "${group.displayName ?? group.name}" to root-level group? It will no longer be nested under its current parent.`
    )
      .then(() =>
        updateGroup(group.id, { _parentGroupId: null })
          .then((updated: Group) => {
            setGroup(updated);
            // Back navigation will now point to the org since _parentGroupId is null
          })
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleMemberRoleChange = (member: GroupMemberWithUser, role: GroupRole) => {
    if (!group) return;

    updateGroupMemberRole(group.id, member.user.id, role)
      .then(() => refreshMembers())
      .catch((err: Error) => customAlert(err.message));
  };

  const handleRemoveMember = (member: GroupMemberWithUser) => {
    if (!group) return;

    customConfirm(`Remove @${member.user.username} from this group?`)
      .then(() =>
        removeGroupMember(group.id, member.user.id)
          .then(() => refreshMembers())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleCollectionRoleChange = (
    collection: GroupCollectionWithCollection,
    accessRole: GroupCollectionAccessRole
  ) => {
    if (!group) return;

    updateGroupCollectionAccess(group.id, collection._pricingCollectionId, accessRole)
      .then(() => refreshCollections())
      .catch((err: Error) => customAlert(err.message));
  };

  const handleRemoveCollection = (collection: GroupCollectionWithCollection) => {
    if (!group) return;

    customConfirm(`Remove ${collection.pricingCollection.name} from this group?`)
      .then(() =>
        removeGroupCollection(group.id, collection._pricingCollectionId)
          .then(async () => {
            await refreshCollections();
            if (addCollectionModalOpen) {
              await loadAvailableCollections();
            }
          })
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  const handleRemovePricingFromGroup = (pricing: any) => {
    if (!group) return;

    customConfirm(`Remove "${pricing.name}" from this group?`)
      .then(() =>
        removeGroupPricing(group.id, pricing.id)
          .then(() => refreshPricings())
          .catch((err: Error) => customAlert(err.message))
      )
      .catch(() => {});
  };

  if (isLoading || isOrgLoading || !activeOrganization || activeOrganization.name !== orgName) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sphere-grey-500">Loading...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Group not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <button
          type="button"
          onClick={() =>
            group._parentGroupId
              ? router.push(`/me/organizations/${orgName}/groups/${group._parentGroupId}`)
              : router.push(`/me/organizations/${orgName}`)
          }
          className="mt-1 text-sphere-grey-400 hover:text-sphere-grey-700"
        >
          <Iconify icon="mdi:arrow-left" width={20} />
        </button>

        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sphere-grey-100 text-sphere-grey-600">
          <Iconify icon="mdi:folder-outline" width={28} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-sphere-grey-800">
              {group.displayName ?? group.name}
            </h1>
            {myGroupRole && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_ROLE_STYLES[myGroupRole]}`}
              >
                {GROUP_ROLE_LABELS[myGroupRole]}
              </span>
            )}
          </div>
          <p className="text-sm text-sphere-grey-500">@{group.name}</p>
          {group.description && (
            <p className="mt-1 max-w-2xl text-sm text-sphere-grey-600">{group.description}</p>
          )}
        </div>

        {canManageGroup && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
            >
              <Iconify icon="mdi:pencil-outline" width={16} />
              Edit
            </button>
            {/* Promote to root: only org admin/owner, only for subgroups */}
            {canManageOrg && isSubgroup && (
              <button
                type="button"
                onClick={handlePromoteToRoot}
                title="Move this subgroup to root level"
                className="flex items-center gap-1 rounded-md border border-sphere-primary-200 px-3 py-1.5 text-sm font-semibold text-sphere-primary-700 hover:bg-sphere-primary-50"
              >
                <Iconify icon="mdi:arrow-up-bold-circle-outline" width={16} />
                Promote to root
              </button>
            )}
            {canDeleteGroup && (
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Iconify icon="mdi:trash-can-outline" width={16} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-sphere-grey-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sphere-grey-500">
            Organization
          </p>
          <p className="mt-2 text-sm font-semibold text-sphere-grey-800">
            {activeOrganization.displayName}
          </p>
          <p className="text-xs text-sphere-grey-500">@{activeOrganization.name}</p>
        </div>

        <div className="rounded-lg border border-sphere-grey-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sphere-grey-500">
            Members
          </p>
          <p className="mt-2 text-2xl font-bold text-sphere-primary-800">{members.length}</p>
        </div>

        <div className="rounded-lg border border-sphere-grey-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sphere-grey-500">
            Collections
          </p>
          <p className="mt-2 text-2xl font-bold text-sphere-primary-800">{collections.length}</p>
        </div>

        <div className="rounded-lg border border-sphere-grey-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sphere-grey-500">
            Created
          </p>
          <p className="mt-2 text-sm font-semibold text-sphere-grey-800">
            {new Date(group.createdAt).toLocaleDateString()}
          </p>
          {group._parentGroupId && (
            <button
              type="button"
              onClick={() => router.push(`/me/organizations/${orgName}/groups/${group._parentGroupId}`)}
              className="mt-0.5 flex items-center gap-1 text-xs text-sphere-primary-600 hover:underline"
            >
              <Iconify icon="mdi:arrow-up-circle-outline" width={13} />
              View parent group
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-xl border border-sphere-grey-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-sphere-grey-800">Members</h2>
              <p className="text-sm text-sphere-grey-500">
                Roles inside this group determine management and editing permissions.
              </p>
            </div>
            {canManageMembers && (
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
              >
                <Iconify icon="mdi:account-plus-outline" width={16} />
                Add member
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {members.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
                <Iconify icon="mdi:account-group-outline" width={36} />
                <p className="text-sm">No members in this group yet.</p>
              </div>
            )}

            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sphere-grey-600">
                  <Iconify icon="mdi:account-outline" width={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-sphere-grey-800">
                    @{member.user.username}
                  </p>
                  <p className="text-xs text-sphere-grey-500">{member.user.email}</p>
                </div>

                {canManageMembers && member.user.id !== authUser.user?.id ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      handleMemberRoleChange(member, event.target.value as GroupRole)
                    }
                    className="rounded border border-sphere-grey-300 bg-white px-2 py-1 text-xs font-semibold text-sphere-grey-700"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_ROLE_STYLES[member.role]}`}
                  >
                    {GROUP_ROLE_LABELS[member.role]}
                  </span>
                )}

                {canManageMembers && member.user.id !== authUser.user?.id && (
                  <button
                    type="button"
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
        </section>

        <section className="rounded-xl border border-sphere-grey-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-sphere-grey-800">Associated Collections</h2>
              <p className="text-sm text-sphere-grey-500">
                The access role overrides what group members can do inside each collection.
              </p>
            </div>
            {canManageCollections && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCreateCollectionModalOpen(true)}
                  className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
                >
                  <Iconify icon="mdi:plus" width={16} />
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setAddCollectionModalOpen(true)}
                  className="flex items-center gap-2 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
                >
                  <Iconify icon="mdi:link-plus" width={16} />
                  Associate
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {!isGroupMember ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
                <Iconify icon="mdi:lock-outline" width={36} />
                <p className="text-sm">Join this group to view its collections.</p>
              </div>
            ) : (
              <>
                {collections.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
                    <Iconify icon="mdi:folder-link-outline" width={36} />
                    <p className="text-sm">No collections associated with this group.</p>
                  </div>
                )}

                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sphere-grey-600">
                      <Iconify icon="mdi:view-grid-outline" width={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-sphere-grey-800">
                        {collection.pricingCollection.name}
                      </p>
                      <p className="text-xs text-sphere-grey-500">
                        {collection.pricingCollection.description || 'No description provided.'}
                      </p>
                    </div>

                    {canManageCollections ? (
                      <select
                        value={collection.accessRole ?? ''}
                        onChange={(event) => {
                          const val = event.target.value;
                          handleCollectionRoleChange(
                            collection,
                            val === '' ? null : (val as NonNullable<GroupCollectionAccessRole>)
                          );
                        }}
                        className="rounded border border-sphere-grey-300 bg-white px-2 py-1 text-xs font-semibold text-sphere-grey-700"
                      >
                        <option value="">Group role</option>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${COLLECTION_ROLE_STYLES[collection.accessRole ?? 'none']}`}
                      >
                        {COLLECTION_ROLE_LABELS[collection.accessRole ?? 'none']}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/pricings/collections/${collection.pricingCollection.ownerId}/${collection.pricingCollection.name}`
                        )
                      }
                      title="View collection"
                      className="text-sphere-grey-300 hover:text-sphere-primary-700"
                    >
                      <Iconify icon="mdi:open-in-new" width={18} />
                    </button>

                    {canRemoveCollectionFromGroup(collection) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCollection(collection)}
                        title="Remove association"
                        className="text-sphere-grey-300 hover:text-red-500"
                      >
                        <Iconify icon="mdi:link-variant-remove" width={18} />
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-sphere-grey-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-sphere-grey-800">Pricings</h2>
            <p className="text-sm text-sphere-grey-500">
              Pricings created in or assigned to this group.
            </p>
          </div>
          {canManageGroup && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAddExistingPricingModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
              >
                <Iconify icon="mdi:link-variant-plus" width={16} />
                Add pricing
              </button>
              <button
                type="button"
                onClick={() => setAssignPricingToCollectionModalOpen(true)}
                className="flex items-center gap-2 rounded-md border border-sphere-grey-300 px-3 py-1.5 text-sm font-semibold text-sphere-grey-700 hover:bg-sphere-grey-100"
              >
                <Iconify icon="mdi:folder-arrow-right-outline" width={16} />
                Assign to collection
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!isGroupMember ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
              <Iconify icon="mdi:lock-outline" width={36} />
              <p className="text-sm">Join this group to view its pricings.</p>
            </div>
          ) : (
            <>
              {groupPricings.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
                  <Iconify icon="mdi:tag-outline" width={36} />
                  <p className="text-sm">No pricings in this group yet.</p>
                </div>
              )}
              {groupPricings.map((pricing: any) => (
                <div
                  key={pricing.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sphere-grey-600">
                    <Iconify icon="mdi:tag-outline" width={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-sphere-grey-800">{pricing.name}</p>
                    <p className="text-xs text-sphere-grey-500">v{pricing.version} · @{pricing.owner}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/pricings/${pricing.owner}/${pricing.name}?collectionName=${pricing.collectionName ?? 'undefined'}`)}
                    title="View pricing"
                    className="text-sphere-grey-300 hover:text-sphere-primary-700"
                  >
                    <Iconify icon="mdi:open-in-new" width={18} />
                  </button>
                  {canRemovePricingFromGroup(pricing) && (
                    <button
                      type="button"
                      onClick={() => handleRemovePricingFromGroup(pricing)}
                      title="Remove from group"
                      className="text-sphere-grey-300 hover:text-red-500"
                    >
                      <Iconify icon="mdi:link-variant-remove" width={18} />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-sphere-grey-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-sphere-grey-800">Subgroups</h2>
            <p className="text-sm text-sphere-grey-500">
              Nested groups within this group. Members of this group can view them.
            </p>
          </div>
          {canManageGroup && (
            <button
              type="button"
              onClick={() => setCreateSubgroupModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-sphere-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sphere-primary-700"
            >
              <Iconify icon="mdi:plus" width={16} />
              Create subgroup
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!isGroupMember ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
              <Iconify icon="mdi:lock-outline" width={36} />
              <p className="text-sm">Join this group to view its subgroups.</p>
            </div>
          ) : subgroups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sphere-grey-400">
              <Iconify icon="mdi:folder-multiple-outline" width={36} />
              <p className="text-sm">No subgroups in this group yet.</p>
            </div>
          ) : (
            subgroups.map((subgroup) => (
              <button
                key={subgroup.id}
                type="button"
                onClick={() => router.push(`/me/organizations/${orgName}/groups/${subgroup.id}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-sphere-grey-200 bg-sphere-grey-50 px-4 py-3 text-left transition-colors hover:border-sphere-primary-200 hover:bg-sphere-primary-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sphere-grey-600">
                  <Iconify icon="mdi:folder-outline" width={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-sphere-grey-800">
                    {subgroup.displayName ?? subgroup.name}
                  </p>
                  <p className="text-xs text-sphere-grey-500">
                    @{subgroup.name}
                    {subgroup.description && ` · ${subgroup.description}`}
                  </p>
                </div>

                <Iconify icon="mdi:chevron-right" width={18} className="shrink-0 text-sphere-grey-400" />
              </button>
            ))
          )}
        </div>
      </section>

      {editModalOpen && (
        <EditGroupModal
          group={group}
          onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => setGroup(updated)}
        />
      )}

      {addMemberModalOpen && (
        <AddGroupMemberModal
          groupId={group.id}
          candidates={memberCandidates}
          isLoadingCandidates={isLoadingCandidates}
          isSubgroup={isSubgroup}
          onClose={() => { setAddMemberModalOpen(false); setMemberCandidates([]); }}
          onAdded={refreshMembers}
        />
      )}

      {createCollectionModalOpen && (
        <CreateGroupCollectionModal
          groupId={group.id}
          onClose={() => setCreateCollectionModalOpen(false)}
          onCreated={() => { setCreateCollectionModalOpen(false); refreshCollections(); }}
        />
      )}

      {addCollectionModalOpen && activeOrganization && (
        <AddGroupCollectionModal
          orgId={activeOrganization.id}
          groupId={group.id}
          collections={availableCollections}
          isLoading={isLoadingAvailableCollections}
          onClose={() => setAddCollectionModalOpen(false)}
          onAdded={refreshCollections}
        />
      )}

      {addExistingPricingModalOpen && (
        <AddExistingPricingToGroupModal
          groupId={group.id}
          onClose={() => setAddExistingPricingModalOpen(false)}
          onAdded={() => { setAddExistingPricingModalOpen(false); refreshPricings(); }}
        />
      )}

      {assignPricingToCollectionModalOpen && (
        <AssignGroupPricingToCollectionModal
          groupId={group.id}
          groupPricings={groupPricings}
          groupCollections={collections}
          onClose={() => setAssignPricingToCollectionModalOpen(false)}
          onAssigned={() => { setAssignPricingToCollectionModalOpen(false); }}
        />
      )}

      {createSubgroupModalOpen && (
        <CreateSubgroupModal
          parentGroupId={group.id}
          onClose={() => setCreateSubgroupModalOpen(false)}
          onCreated={refreshSubgroups}
        />
      )}
    </div>
  );
}
