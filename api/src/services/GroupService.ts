import container from '../config/container';
import { GroupRepository } from '../types/repositories/GroupRepository';
import { GroupMembershipRepository } from '../types/repositories/GroupMembershipRepository';
import { GroupCollectionRepository } from '../types/repositories/GroupCollectionRepository';
import { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository';
import PricingCollectionRepository from '../repositories/mongoose/PricingCollectionRepository';

class GroupService {
  private groupRepository: GroupRepository;
  private groupMembershipRepository: GroupMembershipRepository;
  private groupCollectionRepository: GroupCollectionRepository;
  private organizationMembershipRepository: OrganizationMembershipRepository;
  private pricingCollectionRepository: PricingCollectionRepository;

  constructor() {
    this.groupRepository = container.resolve('groupRepository');
    this.groupMembershipRepository = container.resolve('groupMembershipRepository');
    this.groupCollectionRepository = container.resolve('groupCollectionRepository');
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
    this.pricingCollectionRepository = container.resolve('pricingCollectionRepository');
  }

  // ── Group CRUD ──────────────────────────────────────────────────────────────

  async index() {
    return await this.groupRepository.findAll();
  }

  async indexByOrganization(organizationId: string) {
    return await this.groupRepository.findByOrganizationId(organizationId);
  }

  async indexByParent(parentGroupId: string) {
    return await this.groupRepository.findByParentGroupId(parentGroupId);
  }

  async show(id: string) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  async showByNameAndOrganization(name: string, organizationId: string) {
    const group = await this.groupRepository.findByNameAndOrganizationId(name, organizationId);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  /**
   * Creates a group bound to a specific organization.
   * _organizationId is always enforced from the argument, never trusted from body.
   */
  async createInOrganization(data: any, organizationId: string) {
    return await this.groupRepository.create({ ...data, _organizationId: organizationId });
  }

  /**
   * Creates a subgroup under an existing parent group.
   * _organizationId and _parentGroupId are always enforced server-side — never trusted from body.
   */
  async createInGroup(data: any, parentGroupId: string) {
    const parent = await this.groupRepository.findById(parentGroupId);
    if (!parent) {
      throw new Error('Parent group not found');
    }

    return await this.groupRepository.create({
      ...data,
      _organizationId: parent._organizationId,
      _parentGroupId: parentGroupId,
    });
  }

  async update(id: string, data: any) {
    const group = await this.groupRepository.update(id, data);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  /**
   * Deletes a group and cascades recursively to all subgroups, memberships and collection associations.
   * Depth-first: subgroups are fully destroyed before their parent is removed.
   */
  async destroy(id: string) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }

    await this.destroyRecursive(id);
    return true;
  }

  /**
   * Internal recursive helper — destroys a group and all its descendants.
   * Called by destroy() and recursively for each subgroup.
   */
  private async destroyRecursive(id: string): Promise<void> {
    // First, recursively destroy all direct subgroups
    const subgroups = await this.groupRepository.findByParentGroupId(id);
    for (const subgroup of subgroups) {
      await this.destroyRecursive(subgroup.id);
    }

    // Then clean up this group's own associations and delete it
    await this.groupCollectionRepository.destroyByGroupId(id);
    await this.groupMembershipRepository.destroyByGroupId(id);

    const result = await this.groupRepository.destroy(id);
    if (!result) {
      throw new Error(`Failed to delete group ${id}`);
    }
  }

  async exists(id: string) {
    return await this.groupRepository.findById(id);
  }

  // ── Member management ───────────────────────────────────────────────────────

  async listMembers(groupId: string) {
    return await this.groupMembershipRepository.findByGroupId(groupId);
  }

  /**
   * Adds a user to a group.
   * Requires the user to be an existing member of the group's organization.
   */
  async addMember(userId: string, groupId: string, role: 'admin' | 'editor' | 'viewer') {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const organizationId = group._organizationId.toString();

    const orgMembership = await this.organizationMembershipRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!orgMembership) {
      throw new Error('User is not a member of the organization this group belongs to');
    }

    const existing = await this.groupMembershipRepository.findByUserAndGroup(userId, groupId);
    if (existing) {
      throw new Error('User is already a member of this group');
    }

    return await this.groupMembershipRepository.create({
      _userId: userId,
      _groupId: groupId,
      _organizationId: organizationId,
      role,
      joinedAt: new Date(),
    });
  }

  async updateMemberRole(userId: string, groupId: string, role: 'admin' | 'editor' | 'viewer') {
    const membership = await this.groupMembershipRepository.updateByUserAndGroup(
      userId,
      groupId,
      { role }
    );
    if (!membership) {
      throw new Error('Group membership not found');
    }
    return membership;
  }

  async removeMember(userId: string, groupId: string) {
    const result = await this.groupMembershipRepository.destroyByUserAndGroup(userId, groupId);
    if (!result) {
      throw new Error('Group membership not found');
    }
    return true;
  }

  // ── Collection associations ─────────────────────────────────────────────────

  async listCollections(groupId: string) {
    return await this.groupCollectionRepository.findByGroupId(groupId);
  }

  async listAvailableCollections(groupId: string, organizationId: string) {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group._organizationId.toString() !== organizationId) {
      throw new Error('Group does not belong to the specified organization');
    }

    const [associatedCollections, organizationCollections] = await Promise.all([
      this.groupCollectionRepository.findByGroupId(groupId),
      this.pricingCollectionRepository.findByOrganizationId(organizationId),
    ]);

    const associatedIds = new Set(
      associatedCollections.map((collection: any) => collection._pricingCollectionId?.toString())
    );

    return organizationCollections.filter(
      (collection: any) => !associatedIds.has(collection.id)
    );
  }

  /**
   * Associates a pricing collection with a group.
   * Validates that the group belongs to the given organization.
   */
  async addCollection(
    groupId: string,
    pricingCollectionId: string,
    organizationId: string,
    accessRole?: 'editor' | 'viewer' | null
  ) {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group._organizationId.toString() !== organizationId) {
      throw new Error('Group does not belong to the specified organization');
    }

    const existing = await this.groupCollectionRepository.findByGroupAndCollection(
      groupId,
      pricingCollectionId
    );
    if (existing) {
      throw new Error('This collection is already associated with the group');
    }

    return await this.groupCollectionRepository.create({
      _groupId: groupId,
      _pricingCollectionId: pricingCollectionId,
      _organizationId: organizationId,
      accessRole: accessRole ?? null,
    });
  }

  async updateCollectionAccess(
    groupId: string,
    pricingCollectionId: string,
    accessRole: 'editor' | 'viewer' | null
  ) {
    const gc = await this.groupCollectionRepository.updateByGroupAndCollection(
      groupId,
      pricingCollectionId,
      { accessRole }
    );
    if (!gc) {
      throw new Error('Group collection not found');
    }
    return gc;
  }

  async removeCollection(groupId: string, pricingCollectionId: string) {
    const result = await this.groupCollectionRepository.destroyByGroupAndCollection(
      groupId,
      pricingCollectionId
    );
    if (!result) {
      throw new Error('Group collection not found');
    }
    return true;
  }
}

export default GroupService;
