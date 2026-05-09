import { OrganizationMembership } from "../database/OrganizationMembership";

export interface OrganizationMembershipRepository {
  findById(id: string, ...args: any): Promise<OrganizationMembership | null>;
  findByUserId(userId: string, ...args: any): Promise<OrganizationMembership[]>;
  findByOrganizationId(organizationId: string, ...args: any): Promise<OrganizationMembership[]>;
  findByUserAndOrganization(userId: string, organizationId: string, ...args: any): Promise<OrganizationMembership | null>;
  create(data: Partial<OrganizationMembership>, ...args: any): Promise<OrganizationMembership>;
  update(id: string, data: Partial<OrganizationMembership>, ...args: any): Promise<OrganizationMembership | null>;
  updateByUserAndOrganization(userId: string, organizationId: string, data: Partial<OrganizationMembership>, ...args: any): Promise<OrganizationMembership | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
  destroyByUserAndOrganization(userId: string, organizationId: string, ...args: any): Promise<boolean>;
  destroyByOrganizationId(organizationId: string, ...args: any): Promise<boolean>;
}
