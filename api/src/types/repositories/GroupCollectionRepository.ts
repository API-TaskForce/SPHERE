import { GroupCollection } from "../database/GroupCollection";

export interface GroupCollectionRepository {
  findById(id: string, ...args: any): Promise<GroupCollection | null>;
  findByGroupId(groupId: string, ...args: any): Promise<GroupCollection[]>;
  findByOrganizationId(organizationId: string, ...args: any): Promise<GroupCollection[]>;
  findByPricingCollectionId(pricingCollectionId: string, ...args: any): Promise<GroupCollection[]>;
  findByGroupAndCollection(groupId: string, pricingCollectionId: string, ...args: any): Promise<GroupCollection | null>;
  create(data: Partial<GroupCollection>, ...args: any): Promise<GroupCollection>;
  update(id: string, data: Partial<GroupCollection>, ...args: any): Promise<GroupCollection | null>;
  updateByGroupAndCollection(groupId: string, pricingCollectionId: string, data: Partial<GroupCollection>, ...args: any): Promise<GroupCollection | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
  destroyByGroupAndCollection(groupId: string, pricingCollectionId: string, ...args: any): Promise<boolean>;
  destroyByGroupId(groupId: string, ...args: any): Promise<boolean>;
  destroyByOrganizationId(organizationId: string, ...args: any): Promise<boolean>;
}
