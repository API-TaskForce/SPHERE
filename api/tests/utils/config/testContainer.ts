// deno-lint-ignore-file no-explicit-any
import { createContainer, asValue, type AwilixContainer } from 'awilix';
import dotenv from 'dotenv';
import { getApp } from '../testApp';
import appContainer from '../../../src/config/container';
import { createDirectUserWithPersonalOrg } from '../users/userTestUtils';

dotenv.config();

const mockSpaceServiceForTests = () => {
  const spaceService: any = appContainer.resolve('spaceService');
  spaceService.evaluateFeature = async () => ({ eval: true, used: 0, limit: 9999 });
  spaceService.revertFeatureEvaluation = async () => undefined;
  spaceService.ensureContract = async () => undefined;
  spaceService.ensureFreeContract = async () => undefined;
  spaceService.ensureEnterpriseContract = async () => undefined;
  spaceService.updateContract = async () => undefined;
  spaceService.deleteContract = async () => undefined;
  spaceService.getPlan = async () => 'ENTERPRISE';
  spaceService.getAddOns = async () => ({});
  spaceService.getPlanLimits = async () => ({
    maxPricings: 9999,
    maxCollections: 9999,
    maxOrgMembers: 9999,
    maxGroups: 9999,
    maxGroupMembers: 9999,
  });
};

async function initTestContainer(): Promise<AwilixContainer> {
  const container: AwilixContainer = createContainer();
  const app = await getApp();
  mockSpaceServiceForTests();

  container.register({
    app: asValue(app),
    usersToDelete: asValue(new Set<string>()),
    pricingIdsToDelete: asValue(new Set<string>()),
    collectionIdsToDelete: asValue(new Set<string>()),
    organizationIdsToDelete: asValue(new Set<string>()),
    invitationIdsToDelete: asValue(new Set<string>()),
    groupIdsToDelete: asValue(new Set<string>()),
    groupMembershipIdsToDelete: asValue(new Set<string>()),
    groupCollectionIdsToDelete: asValue(new Set<string>()),
    generatedFilesToDelete: asValue(new Set<string>()),
  });

  container.register({
    adminUser: asValue(await createDirectUserWithPersonalOrg('admin', undefined, false)),
    testUser: asValue(await createDirectUserWithPersonalOrg('user', undefined, false)),
  });

  return container;
}

let container: AwilixContainer | null = null;
if (!container) {
  container = await initTestContainer();
}

export default container as AwilixContainer;
