import { Group } from "../database/Group";

export interface GroupRepository {
  findById(id: string, ...args: any): Promise<Group | null>;
  findAll(...args: any): Promise<Group[]>;
  findByOrganizationId(organizationId: string, ...args: any): Promise<Group[]>;
  findByParentGroupId(parentGroupId: string, ...args: any): Promise<Group[]>;
  findByNameAndOrganizationId(name: string, organizationId: string, ...args: any): Promise<Group | null>;
  create(data: Partial<Group>, ...args: any): Promise<Group>;
  update(id: string, data: Partial<Group>, ...args: any): Promise<Group | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
  destroyByOrganizationId(organizationId: string, ...args: any): Promise<boolean>;
}
