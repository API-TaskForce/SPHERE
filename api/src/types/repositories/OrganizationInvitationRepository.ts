import { OrganizationInvitation } from '../database/OrganizationInvitation';

export interface OrganizationInvitationRepository {
  findById(id: string, ...args: any): Promise<OrganizationInvitation | null>;
  findByCode(code: string, ...args: any): Promise<OrganizationInvitation | null>;
  findByOrganizationId(organizationId: string, ...args: any): Promise<OrganizationInvitation[]>;
  create(data: Partial<OrganizationInvitation>, ...args: any): Promise<OrganizationInvitation>;
  incrementUseCount(id: string, ...args: any): Promise<OrganizationInvitation | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
  destroyByOrganizationId(organizationId: string, ...args: any): Promise<boolean>;
}
