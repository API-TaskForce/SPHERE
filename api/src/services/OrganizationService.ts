import container from '../config/container';
import { OrganizationRepository } from '../types/repositories/OrganizationRepository';

class OrganizationService {
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.organizationRepository = container.resolve('organizationRepository');
  }

  async index() {
    return await this.organizationRepository.findAll();
  }

  async show(id: string) {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  async showByName(name: string) {
    const organization = await this.organizationRepository.findByName(name);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  async create(data: any) {
    return await this.organizationRepository.create(data);
  }

  async update(id: string, data: any) {
    const organization = await this.organizationRepository.update(id, data);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  async destroy(id: string) {
    const result = await this.organizationRepository.destroy(id);
    if (!result) {
      throw new Error('Organization not found');
    }
    return true;
  }

  async exists(id: string) {
    return await this.organizationRepository.findById(id);
  }
}

export default OrganizationService;
