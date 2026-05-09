import container from '../config/container';
import { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository';

class OrganizationMembershipService {
  private organizationMembershipRepository: OrganizationMembershipRepository;

  constructor() {
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
  }

  async indexByUser(userId: string) {
    return await this.organizationMembershipRepository.findByUserId(userId);
  }

  async indexByOrganization(organizationId: string) {
    return await this.organizationMembershipRepository.findByOrganizationId(organizationId);
  }

  async show(id: string) {
    const membership = await this.organizationMembershipRepository.findById(id);
    if (!membership) {
      throw new Error('Organization membership not found');
    }
    return membership;
  }

  async showByUserAndOrganization(userId: string, organizationId: string) {
    const membership = await this.organizationMembershipRepository.findByUserAndOrganization(userId, organizationId);
    if (!membership) {
      throw new Error('Organization membership not found');
    }
    return membership;
  }

  async create(data: any) {
    return await this.organizationMembershipRepository.create(data);
  }

  async update(id: string, data: any) {
    const membership = await this.organizationMembershipRepository.update(id, data);
    if (!membership) {
      throw new Error('Organization membership not found');
    }
    return membership;
  }

  async updateByUserAndOrganization(userId: string, organizationId: string, data: any) {
    const membership = await this.organizationMembershipRepository.updateByUserAndOrganization(userId, organizationId, data);
    if (!membership) {
      throw new Error('Organization membership not found');
    }
    return membership;
  }

  async destroy(id: string) {
    const result = await this.organizationMembershipRepository.destroy(id);
    if (!result) {
      throw new Error('Organization membership not found');
    }
    return true;
  }

  async destroyByUserAndOrganization(userId: string, organizationId: string) {
    const result = await this.organizationMembershipRepository.destroyByUserAndOrganization(userId, organizationId);
    if (!result) {
      throw new Error('Organization membership not found');
    }
    return true;
  }

  async destroyByOrganizationId(organizationId: string) {
    return await this.organizationMembershipRepository.destroyByOrganizationId(organizationId);
  }

  async exists(id: string) {
    return await this.organizationMembershipRepository.findById(id);
  }
}

export default OrganizationMembershipService;
