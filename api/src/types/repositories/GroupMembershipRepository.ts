import { GroupMembership } from "../database/GroupMembership";

export interface GroupMembershipRepository {
  findById(id: string, ...args: any): Promise<GroupMembership | null>;
  findByUserId(userId: string, ...args: any): Promise<GroupMembership[]>;
  findByGroupId(groupId: string, ...args: any): Promise<GroupMembership[]>;
  findByOrganizationId(organizationId: string, ...args: any): Promise<GroupMembership[]>;
  findByUserAndGroup(userId: string, groupId: string, ...args: any): Promise<GroupMembership | null>;
  create(data: Partial<GroupMembership>, ...args: any): Promise<GroupMembership>;
  update(id: string, data: Partial<GroupMembership>, ...args: any): Promise<GroupMembership | null>;
  updateByUserAndGroup(userId: string, groupId: string, data: Partial<GroupMembership>, ...args: any): Promise<GroupMembership | null>;
  destroy(id: string, ...args: any): Promise<boolean>;
  destroyByUserAndGroup(userId: string, groupId: string, ...args: any): Promise<boolean>;
  destroyByGroupId(groupId: string, ...args: any): Promise<boolean>;
  destroyByOrganizationId(organizationId: string, ...args: any): Promise<boolean>;
}
