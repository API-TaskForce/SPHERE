import container from '../config/container';
import { OrganizationRepository } from '../types/repositories/OrganizationRepository';
import { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository';

class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private organizationMembershipRepository: OrganizationMembershipRepository;

  constructor() {
    this.organizationRepository = container.resolve('organizationRepository');
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
  }

  // ── Organization CRUD ───────────────────────────────────────────────────────

  async index() {
    return await this.organizationRepository.findAll();
  }

  async indexByUser(userId: string) {
    const memberships = await this.organizationMembershipRepository.findByUserId(userId);
    return memberships.map((m: any) => m.organization);
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

  /**
   * Creates an organization and automatically assigns the given user as owner.
   */
  async createWithOwner(data: any, userId: string) {
    const organization = await this.organizationRepository.create(data);

    await this.organizationMembershipRepository.create({
      _userId: userId,
      _organizationId: organization.id,
      role: 'owner',
      joinedAt: new Date(),
    });

    return organization;
  }

  /**
   * Creates a personal organization for a user upon registration.
   * The name is derived from the username to ensure uniqueness.
   */
  async createPersonal(userId: string, username: string) {
    const personalOrgData = {
      name: username,
      displayName: username,
      description: null,
      avatarUrl: null,
      isPersonal: true,
    };

    return await this.createWithOwner(personalOrgData, userId);
  }

  async update(id: string, data: any) {
    const organization = await this.organizationRepository.update(id, data);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  /**
   * Deletes an organization and all its memberships.
   */
  async destroy(id: string) {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new Error('Organization not found');
    }

    await this.organizationMembershipRepository.destroyByOrganizationId(id);

    const result = await this.organizationRepository.destroy(id);
    if (!result) {
      throw new Error('Organization not found');
    }
    return true;
  }

  async exists(id: string) {
    return await this.organizationRepository.findById(id);
  }

  // ── Member management ───────────────────────────────────────────────────────

  async listMembers(organizationId: string) {
    return await this.organizationMembershipRepository.findByOrganizationId(organizationId);
  }

  /**
   * Adds a user to an organization with the given role.
   * Prevents duplicate memberships.
   */
  async addMember(userId: string, organizationId: string, role: 'owner' | 'admin' | 'member') {
    const existing = await this.organizationMembershipRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (existing) {
      throw new Error('User is already a member of this organization');
    }

    return await this.organizationMembershipRepository.create({
      _userId: userId,
      _organizationId: organizationId,
      role,
      joinedAt: new Date(),
    });
  }

  async updateMemberRole(userId: string, organizationId: string, role: 'owner' | 'admin' | 'member') {
    const membership = await this.organizationMembershipRepository.updateByUserAndOrganization(
      userId,
      organizationId,
      { role }
    );
    if (!membership) {
      throw new Error('Organization membership not found');
    }
    return membership;
  }

  async removeMember(userId: string, organizationId: string) {
    const result = await this.organizationMembershipRepository.destroyByUserAndOrganization(
      userId,
      organizationId
    );
    if (!result) {
      throw new Error('Organization membership not found');
    }
    return true;
  }
}

export default OrganizationService;
