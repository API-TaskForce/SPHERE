import container from '../config/container';
import { GroupCollectionRepository } from '../types/repositories/GroupCollectionRepository';

class GroupCollectionService {
  private groupCollectionRepository: GroupCollectionRepository;

  constructor() {
    this.groupCollectionRepository = container.resolve('groupCollectionRepository');
  }

  async indexByGroup(groupId: string) {
    return await this.groupCollectionRepository.findByGroupId(groupId);
  }

  async indexByOrganization(organizationId: string) {
    return await this.groupCollectionRepository.findByOrganizationId(organizationId);
  }

  async indexByPricingCollection(pricingCollectionId: string) {
    return await this.groupCollectionRepository.findByPricingCollectionId(pricingCollectionId);
  }

  async show(id: string) {
    const groupCollection = await this.groupCollectionRepository.findById(id);
    if (!groupCollection) {
      throw new Error('Group collection not found');
    }
    return groupCollection;
  }

  async showByGroupAndCollection(groupId: string, pricingCollectionId: string) {
    const groupCollection = await this.groupCollectionRepository.findByGroupAndCollection(groupId, pricingCollectionId);
    if (!groupCollection) {
      throw new Error('Group collection not found');
    }
    return groupCollection;
  }

  async create(data: any) {
    return await this.groupCollectionRepository.create(data);
  }

  async update(id: string, data: any) {
    const groupCollection = await this.groupCollectionRepository.update(id, data);
    if (!groupCollection) {
      throw new Error('Group collection not found');
    }
    return groupCollection;
  }

  async updateByGroupAndCollection(groupId: string, pricingCollectionId: string, data: any) {
    const groupCollection = await this.groupCollectionRepository.updateByGroupAndCollection(groupId, pricingCollectionId, data);
    if (!groupCollection) {
      throw new Error('Group collection not found');
    }
    return groupCollection;
  }

  async destroy(id: string) {
    const result = await this.groupCollectionRepository.destroy(id);
    if (!result) {
      throw new Error('Group collection not found');
    }
    return true;
  }

  async destroyByGroupAndCollection(groupId: string, pricingCollectionId: string) {
    const result = await this.groupCollectionRepository.destroyByGroupAndCollection(groupId, pricingCollectionId);
    if (!result) {
      throw new Error('Group collection not found');
    }
    return true;
  }

  async destroyByGroupId(groupId: string) {
    return await this.groupCollectionRepository.destroyByGroupId(groupId);
  }

  async destroyByOrganizationId(organizationId: string) {
    return await this.groupCollectionRepository.destroyByOrganizationId(organizationId);
  }

  async exists(id: string) {
    return await this.groupCollectionRepository.findById(id);
  }
}

export default GroupCollectionService;
