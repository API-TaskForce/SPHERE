import container from '../config/container';
import { GroupRepository } from '../types/repositories/GroupRepository';
import { GroupMembershipRepository } from '../types/repositories/GroupMembershipRepository';
import { GroupCollectionRepository } from '../types/repositories/GroupCollectionRepository';
import { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository';

class GroupService {
  private groupRepository: GroupRepository;
  private groupMembershipRepository: GroupMembershipRepository;
  private groupCollectionRepository: GroupCollectionRepository;
  private organizationMembershipRepository: OrganizationMembershipRepository;

  constructor() {
    this.groupRepository = container.resolve('groupRepository');
    this.groupMembershipRepository = container.resolve('groupMembershipRepository');
    this.groupCollectionRepository = container.resolve('groupCollectionRepository');
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
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

  async update(id: string, data: any) {
    const group = await this.groupRepository.update(id, data);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  /**
   * Deletes a group and cascades to memberships and collection associations.
   */
  async destroy(id: string) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }

    await this.groupCollectionRepository.destroyByGroupId(id);
    await this.groupMembershipRepository.destroyByGroupId(id);

    const result = await this.groupRepository.destroy(id);
    if (!result) {
      throw new Error('Group not found');
    }
    return true;
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

  /**
   * Associates a pricing collection with a group.
   * Validates that the group belongs to the given organization.
   */
  async addCollection(
    groupId: string,
    pricingCollectionId: string,
    organizationId: string,
    accessRole: 'editor' | 'viewer'
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
      accessRole,
    });
  }

  async updateCollectionAccess(
    groupId: string,
    pricingCollectionId: string,
    accessRole: 'editor' | 'viewer'
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
