import container from '../config/container';
import { GroupMembershipRepository } from '../types/repositories/GroupMembershipRepository';

class GroupMembershipService {
  private groupMembershipRepository: GroupMembershipRepository;

  constructor() {
    this.groupMembershipRepository = container.resolve('groupMembershipRepository');
  }

  async indexByUser(userId: string) {
    return await this.groupMembershipRepository.findByUserId(userId);
  }

  async indexByGroup(groupId: string) {
    return await this.groupMembershipRepository.findByGroupId(groupId);
  }

  async indexByOrganization(organizationId: string) {
    return await this.groupMembershipRepository.findByOrganizationId(organizationId);
  }

  async show(id: string) {
    const membership = await this.groupMembershipRepository.findById(id);
    if (!membership) {
      throw new Error('Group membership not found');
    }
    return membership;
  }

  async showByUserAndGroup(userId: string, groupId: string) {
    const membership = await this.groupMembershipRepository.findByUserAndGroup(userId, groupId);
    if (!membership) {
      throw new Error('Group membership not found');
    }
    return membership;
  }

  async create(data: any) {
    return await this.groupMembershipRepository.create(data);
  }

  async update(id: string, data: any) {
    const membership = await this.groupMembershipRepository.update(id, data);
    if (!membership) {
      throw new Error('Group membership not found');
    }
    return membership;
  }

  async updateByUserAndGroup(userId: string, groupId: string, data: any) {
    const membership = await this.groupMembershipRepository.updateByUserAndGroup(userId, groupId, data);
    if (!membership) {
      throw new Error('Group membership not found');
    }
    return membership;
  }

  async destroy(id: string) {
    const result = await this.groupMembershipRepository.destroy(id);
    if (!result) {
      throw new Error('Group membership not found');
    }
    return true;
  }

  async destroyByUserAndGroup(userId: string, groupId: string) {
    const result = await this.groupMembershipRepository.destroyByUserAndGroup(userId, groupId);
    if (!result) {
      throw new Error('Group membership not found');
    }
    return true;
  }

  async destroyByGroupId(groupId: string) {
    return await this.groupMembershipRepository.destroyByGroupId(groupId);
  }

  async destroyByOrganizationId(organizationId: string) {
    return await this.groupMembershipRepository.destroyByOrganizationId(organizationId);
  }

  async exists(id: string) {
    return await this.groupMembershipRepository.findById(id);
  }
}

export default GroupMembershipService;
