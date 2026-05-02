import crypto from 'node:crypto';
import container from '../config/container';
import { OrganizationRepository } from '../types/repositories/OrganizationRepository';
import { OrganizationMembershipRepository } from '../types/repositories/OrganizationMembershipRepository';
import { OrganizationInvitationRepository } from '../types/repositories/OrganizationInvitationRepository';
import SpaceService from './SpaceService';

class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private organizationMembershipRepository: OrganizationMembershipRepository;
  private organizationInvitationRepository: OrganizationInvitationRepository;
  private spaceService: SpaceService;

  constructor() {
    this.organizationRepository = container.resolve('organizationRepository');
    this.organizationMembershipRepository = container.resolve('organizationMembershipRepository');
    this.organizationInvitationRepository = container.resolve('organizationInvitationRepository');
    this.spaceService = container.resolve('spaceService');
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
   * Creates an organization, assigns the given user as owner, and provisions
   * a FREE contract in SPACE for the new organization.
   */
  async createWithOwner(data: any, userId: string) {
    const organization = await this.organizationRepository.create(data);

    await this.organizationMembershipRepository.create({
      _userId: userId,
      _organizationId: organization.id,
      role: 'owner',
      joinedAt: new Date(),
    });

    await this.spaceService.ensureFreeContract(organization.id, organization.name);

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
   * Deletes an organization and all its memberships and invitations.
   */
  async destroy(id: string) {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new Error('Organization not found');
    }

    await this.organizationMembershipRepository.destroyByOrganizationId(id);
    await this.organizationInvitationRepository.destroyByOrganizationId(id);

    const result = await this.organizationRepository.destroy(id);
    if (!result) {
      throw new Error('Organization not found');
    }
    return true;
  }

  async exists(id: string) {
    return await this.organizationRepository.findById(id);
  }

  // ── Plan management ─────────────────────────────────────────────────────────

  async getPlan(organizationId: string): Promise<string> {
    return this.spaceService.getPlan(organizationId);
  }

  async changePlan(organizationId: string, plan: string): Promise<void> {
    const VALID_PLANS = ['FREE', 'PRO', 'ENTERPRISE'];
    if (!VALID_PLANS.includes(plan)) {
      throw new Error(`Invalid plan: ${plan}. Valid plans: ${VALID_PLANS.join(', ')}`);
    }
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }
    const ADDON_PLANS = ['PRO', 'ENTERPRISE'];
    const existingAddOns = ADDON_PLANS.includes(plan)
      ? await this.spaceService.getAddOns(organizationId)
      : {};
    await this.spaceService.updateContract(organizationId, plan, existingAddOns);
  }

  async getAddOns(organizationId: string): Promise<Record<string, number>> {
    return this.spaceService.getAddOns(organizationId);
  }

  async updateAddOns(organizationId: string, addOns: Record<string, number>): Promise<void> {
    const VALID_ADDON_PLANS = ['PRO', 'ENTERPRISE'];
    const VALID_ADDONS = ['extraPricings', 'extraCollections'];
    const ADDON_MAX = 10;

    const plan = await this.spaceService.getPlan(organizationId);
    if (!VALID_ADDON_PLANS.includes(plan)) {
      throw new Error('Add-ons are only available on PRO or ENTERPRISE plans');
    }

    for (const [key, qty] of Object.entries(addOns)) {
      if (!VALID_ADDONS.includes(key)) {
        throw new Error(`Invalid add-on: ${key}`);
      }
      if (!Number.isInteger(qty) || qty < 0 || qty > ADDON_MAX) {
        throw new Error(`Add-on quantity must be between 0 and ${ADDON_MAX}`);
      }
    }

    const filtered = Object.fromEntries(Object.entries(addOns).filter(([, qty]) => qty > 0));
    await this.spaceService.updateContract(organizationId, plan, filtered);
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

  // ── Invitation management ───────────────────────────────────────────────────

  async createInvitation(
    organizationId: string,
    userId: string,
    options?: { expiresInDays?: number; maxUses?: number }
  ) {
    const code = crypto.randomBytes(5).toString('hex'); // 10-char hex code
    const expiresInDays = options?.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    return await this.organizationInvitationRepository.create({
      _organizationId: organizationId,
      code,
      createdBy: userId,
      expiresAt,
      maxUses: options?.maxUses ?? null,
      useCount: 0,
    });
  }

  async listInvitations(organizationId: string) {
    return await this.organizationInvitationRepository.findByOrganizationId(organizationId);
  }

  async revokeInvitation(invitationId: string) {
    const result = await this.organizationInvitationRepository.destroy(invitationId);
    if (!result) {
      throw new Error('Invitation not found');
    }
    return true;
  }

  async previewInvitation(code: string) {
    const invitation = await this.organizationInvitationRepository.findByCode(code);
    if (!invitation) {
      throw new Error('Invitation not found or invalid');
    }
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      throw new Error('Invitation has expired');
    }
    if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      throw new Error('Invitation has reached its maximum number of uses');
    }

    const organization = await this.organizationRepository.findById(
      invitation._organizationId.toString()
    );
    if (!organization) {
      throw new Error('Organization not found');
    }

    return { invitation, organization };
  }

  async joinViaInvitation(code: string, userId: string) {
    const invitation = await this.organizationInvitationRepository.findByCode(code);
    if (!invitation) {
      throw new Error('Invitation not found or invalid');
    }
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      throw new Error('Invitation has expired');
    }
    if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      throw new Error('Invitation has reached its maximum number of uses');
    }

    const orgId = invitation._organizationId.toString();

    const existing = await this.organizationMembershipRepository.findByUserAndOrganization(
      userId,
      orgId
    );
    if (existing) {
      throw new Error('You are already a member of this organization');
    }

    await this.organizationMembershipRepository.create({
      _userId: userId,
      _organizationId: orgId,
      role: 'member',
      joinedAt: new Date(),
    });

    await this.organizationInvitationRepository.incrementUseCount(invitation.id);

    return await this.organizationRepository.findById(orgId);
  }
}

export default OrganizationService;
