import { User } from './User';
import { Organization } from './Organization';

export interface OrganizationMembership {
  id: string;
  _userId: string;
  _organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  user?: User;
  organization?: Organization;
}
