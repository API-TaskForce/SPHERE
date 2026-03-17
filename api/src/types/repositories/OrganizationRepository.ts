import { Organization } from "../database/Organization";

export interface OrganizationRepository {
  findById(id: string, ...args: any): Promise<Organization | null>;
  findAll(...args: any): Promise<Organization[]>;
  findByName(name: string, ...args: any): Promise<Organization | null>;
  create(data: Partial<Organization>, ...args: any): Promise<Organization>;
  update(id: string, data: Partial<Organization>, ...args: any): Promise<Organization | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
}
