import { promises as fs } from 'fs';
import testContainer from './config/testContainer';
import UserMongoose from '../../src/repositories/mongoose/models/UserMongoose';
import PricingMongoose from '../../src/repositories/mongoose/models/PricingMongoose';
import PricingCollectionMongoose from '../../src/repositories/mongoose/models/PricingCollectionMongoose';
import OrganizationMongoose from '../../src/repositories/mongoose/models/OrganizationMongoose';
import OrganizationMembershipMongoose from '../../src/repositories/mongoose/models/OrganizationMembershipMongoose';
import OrganizationInvitationMongoose from '../../src/repositories/mongoose/models/OrganizationInvitationMongoose';
import GroupMongoose from '../../src/repositories/mongoose/models/GroupMongoose';
import GroupMembershipMongoose from '../../src/repositories/mongoose/models/GroupMembershipMongoose';
import GroupCollectionMongoose from '../../src/repositories/mongoose/models/GroupCollectionMongoose';

export const randomSuffix = () => Math.random().toString(36).substring(2, 10);

export const authHeader = (user: { token: string }) => ({
  Authorization: `Bearer ${user.token}`,
});

export const addOrgHeader = (
  requestBuilder: any,
  organizationId?: string
) => organizationId ? requestBuilder.set('X-Organization-Id', organizationId) : requestBuilder;

export const cleanupTrackedData = async () => {
  const groupCollectionIds: Set<string> = testContainer.resolve('groupCollectionIdsToDelete');
  for (const id of groupCollectionIds) await GroupCollectionMongoose.deleteOne({ _id: id });
  groupCollectionIds.clear();

  const groupMembershipIds: Set<string> = testContainer.resolve('groupMembershipIdsToDelete');
  for (const id of groupMembershipIds) await GroupMembershipMongoose.deleteOne({ _id: id });
  groupMembershipIds.clear();

  const groupIds: Set<string> = testContainer.resolve('groupIdsToDelete');
  for (const id of groupIds) {
    await GroupCollectionMongoose.deleteMany({ _groupId: id });
    await GroupMembershipMongoose.deleteMany({ _groupId: id });
    await GroupMongoose.deleteOne({ _id: id });
  }
  groupIds.clear();

  const pricingIds: Set<string> = testContainer.resolve('pricingIdsToDelete');
  for (const id of pricingIds) await PricingMongoose.deleteOne({ _id: id });
  pricingIds.clear();

  const collectionIds: Set<string> = testContainer.resolve('collectionIdsToDelete');
  for (const id of collectionIds) {
    await GroupCollectionMongoose.deleteMany({ _pricingCollectionId: id });
    await PricingMongoose.updateMany({ _collectionId: id }, { $unset: { _collectionId: '' } });
    await PricingCollectionMongoose.deleteOne({ _id: id });
  }
  collectionIds.clear();

  const invitationIds: Set<string> = testContainer.resolve('invitationIdsToDelete');
  for (const id of invitationIds) await OrganizationInvitationMongoose.deleteOne({ _id: id });
  invitationIds.clear();

  const organizationIds: Set<string> = testContainer.resolve('organizationIdsToDelete');
  for (const id of organizationIds) {
    await OrganizationInvitationMongoose.deleteMany({ _organizationId: id });
    await GroupCollectionMongoose.deleteMany({ _organizationId: id });
    await GroupMembershipMongoose.deleteMany({ _organizationId: id });
    await GroupMongoose.deleteMany({ _organizationId: id });
    await PricingCollectionMongoose.deleteMany({ _organizationId: id });
    await PricingMongoose.deleteMany({ _organizationId: id });
    await OrganizationMembershipMongoose.deleteMany({ _organizationId: id });
    await OrganizationMongoose.deleteOne({ _id: id });
  }
  organizationIds.clear();

  const usersToDelete: Set<string> = testContainer.resolve('usersToDelete');
  for (const username of usersToDelete) {
    const user = await UserMongoose.findOne({ username });
    if (user) {
      await OrganizationInvitationMongoose.deleteMany({ createdBy: user._id });
      await GroupMembershipMongoose.deleteMany({ _userId: user._id });
      await PricingCollectionMongoose.deleteMany({ _ownerId: user._id });
      await OrganizationMembershipMongoose.deleteMany({ _userId: user._id });
      await OrganizationMongoose.deleteOne({ name: username, isPersonal: true });
      await UserMongoose.deleteOne({ _id: user._id });
    }
  }
  usersToDelete.clear();

  const generatedFilesToDelete: Set<string> = testContainer.resolve('generatedFilesToDelete');
  for (const filePath of generatedFilesToDelete) {
    await fs.rm(filePath, { recursive: true, force: true });
  }
  generatedFilesToDelete.clear();
};
