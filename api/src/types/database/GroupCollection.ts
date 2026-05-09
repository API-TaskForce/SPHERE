import { Group } from './Group';
import { Organization } from './Organization';

export interface GroupCollection {
  id: string;
  _groupId: string;
  _pricingCollectionId: string;
  _organizationId: string;
  accessRole: 'editor' | 'viewer';
  createdAt: Date;
  group?: Group;
  organization?: Organization;
}
