import { User } from './User';
import { Group } from './Group';
import { Organization } from './Organization';

export interface GroupMembership {
  id: string;
  _userId: string;
  _groupId: string;
  _organizationId: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  user?: User;
  group?: Group;
  organization?: Organization;
}
