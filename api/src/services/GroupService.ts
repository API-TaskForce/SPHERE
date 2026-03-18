import container from '../config/container';
import { GroupRepository } from '../types/repositories/GroupRepository';

class GroupService {
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = container.resolve('groupRepository');
  }

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

  async create(data: any) {
    return await this.groupRepository.create(data);
  }

  async update(id: string, data: any) {
    const group = await this.groupRepository.update(id, data);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  async destroy(id: string) {
    const result = await this.groupRepository.destroy(id);
    if (!result) {
      throw new Error('Group not found');
    }
    return true;
  }

  async destroyByOrganizationId(organizationId: string) {
    return await this.groupRepository.destroyByOrganizationId(organizationId);
  }

  async exists(id: string) {
    return await this.groupRepository.findById(id);
  }
}

export default GroupService;
