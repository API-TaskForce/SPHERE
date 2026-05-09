import dotenv from 'dotenv';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH } from './utils/config/variables';
import { authHeader, cleanupTrackedData } from './utils/helpers';
import { createOrganizationForUser } from './utils/organizations/organizationTestUtils';
import { createGroupForOrganization } from './utils/groups/groupTestUtils';
import { createTestUser, type LeanTestUser } from './utils/users/userTestUtils';
import { createTestCollection } from './utils/collections/collectionTestUtils';
import { createPricingForUser } from './utils/pricings/pricingTestUtils';

dotenv.config();

describe('Groups API integration', () => {
  let app: TestApp;
  const testUser: LeanTestUser = testContainer.resolve('testUser');

  beforeAll(async () => {
    app = testContainer.resolve('app');
  });

  afterEach(async () => {
    await cleanupTrackedData();
  });

  afterAll(async () => {
    await shutdownApp();
  });

  describe('Organization group CRUD', () => {
    it('creates, lists, shows, updates, creates subgroups, and deletes groups', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const { response: createResponse, group } = await createGroupForOrganization({
        user: testUser,
        organizationId: organization.id,
      });

      const listResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/groups`)
        .set(authHeader(testUser));
      const showResponse = await request(app)
        .get(`${BASE_PATH}/groups/${group.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/groups/${group.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ displayName: 'Updated group' });
      const subgroupResponse = await request(app)
        .post(`${BASE_PATH}/groups/${group.id}/subgroups`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ name: 'subgroup-test', displayName: 'Subgroup Test' });
      if (subgroupResponse.body?.id) testContainer.resolve('groupIdsToDelete').add(subgroupResponse.body.id);
      const listSubgroupsResponse = await request(app)
        .get(`${BASE_PATH}/groups/${group.id}/subgroups`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const deleteResponse = await request(app)
        .delete(`${BASE_PATH}/groups/${group.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);

      expect(createResponse.status).toBe(201);
      expect(group.name).toBeDefined();
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.map((g: any) => g.id)).toContain(group.id);
      expect(showResponse.status).toBe(200);
      expect(showResponse.body.id).toBe(group.id);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.displayName).toBe('Updated group');
      expect(subgroupResponse.status).toBe(201);
      expect(subgroupResponse.body._parentGroupId?.toString?.() ?? subgroupResponse.body._parentGroupId).toBe(group.id);
      expect(listSubgroupsResponse.status).toBe(200);
      expect(listSubgroupsResponse.body.map((g: any) => g.id)).toContain(subgroupResponse.body.id);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Successfully deleted.');
    });

    it('returns 422 for invalid group payloads', async () => {
      const { organization } = await createOrganizationForUser(testUser);

      const response = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/groups`)
        .set(authHeader(testUser))
        .send({ name: 'ab' });

      expect(response.status).toBe(422);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('Group members', () => {
    it('adds, updates, lists, reads, and removes group members', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const member = await createTestUser('user');
      const { group } = await createGroupForOrganization({ user: testUser, organizationId: organization.id });

      await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/members`)
        .set(authHeader(testUser))
        .send({ userId: member.id, role: 'member' });

      const addResponse = await request(app)
        .post(`${BASE_PATH}/groups/${group.id}/members`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ userId: member.id, role: 'viewer' });
      if (addResponse.body?.id) testContainer.resolve('groupMembershipIdsToDelete').add(addResponse.body.id);

      const listResponse = await request(app)
        .get(`${BASE_PATH}/groups/${group.id}/members`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const showResponse = await request(app)
        .get(`${BASE_PATH}/group-memberships/${addResponse.body.id}`)
        .set(authHeader(testUser));
      const byUserResponse = await request(app)
        .get(`${BASE_PATH}/users/${member.id}/group-memberships`)
        .set(authHeader(testUser));
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/groups/${group.id}/members/${member.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ role: 'editor' });
      const removeResponse = await request(app)
        .delete(`${BASE_PATH}/groups/${group.id}/members/${member.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);

      expect(addResponse.status).toBe(201);
      expect(addResponse.body.role).toBe('viewer');
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(showResponse.status).toBe(200);
      expect(showResponse.body.id).toBe(addResponse.body.id);
      expect(byUserResponse.status).toBe(200);
      expect(Array.isArray(byUserResponse.body)).toBe(true);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.role).toBe('editor');
      expect(removeResponse.status).toBe(200);
      expect(removeResponse.body.message).toBe('Successfully removed.');
    });
  });

  describe('Group collections and pricings extras', () => {
    it('associates collections and pricings with a group, updates access, then removes them', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const { group } = await createGroupForOrganization({ user: testUser, organizationId: organization.id });
      const { collection } = await createTestCollection({ user: testUser, organizationId: organization.id });
      const pricing = await createPricingForUser({ user: testUser, organizationId: organization.id });

      const availableCollectionsResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/groups/${group.id}/available-collections`)
        .set(authHeader(testUser));
      const addCollectionResponse = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/groups/${group.id}/collections`)
        .set(authHeader(testUser))
        .send({ pricingCollectionId: collection.id, accessRole: 'viewer' });
      if (addCollectionResponse.body?.id) {
        testContainer.resolve('groupCollectionIdsToDelete').add(addCollectionResponse.body.id);
      }

      const listCollectionsResponse = await request(app)
        .get(`${BASE_PATH}/groups/${group.id}/collections`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const showGroupCollectionResponse = await request(app)
        .get(`${BASE_PATH}/group-collections/${addCollectionResponse.body.id}`)
        .set(authHeader(testUser));
      const indexGroupCollectionsResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/group-collections`)
        .set(authHeader(testUser));
      const updateCollectionResponse = await request(app)
        .put(`${BASE_PATH}/groups/${group.id}/collections/${collection.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ accessRole: 'editor' });
      const assignPricingResponse = await request(app)
        .put(`${BASE_PATH}/groups/${group.id}/pricings`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id)
        .send({ pricingId: pricing.pricing.id });
      const listPricingsResponse = await request(app)
        .get(`${BASE_PATH}/groups/${group.id}/pricings`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const removePricingResponse = await request(app)
        .delete(`${BASE_PATH}/groups/${group.id}/pricings/${pricing.pricing.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);
      const removeCollectionResponse = await request(app)
        .delete(`${BASE_PATH}/groups/${group.id}/collections/${collection.id}`)
        .set(authHeader(testUser))
        .set('X-Organization-Id', organization.id);

      expect(availableCollectionsResponse.status).toBe(200);
      expect(availableCollectionsResponse.body.map((c: any) => c.id)).toContain(collection.id);
      expect(addCollectionResponse.status).toBe(201);
      expect(addCollectionResponse.body.accessRole).toBe('viewer');
      expect(listCollectionsResponse.status).toBe(200);
      expect(Array.isArray(listCollectionsResponse.body)).toBe(true);
      expect(showGroupCollectionResponse.status).toBe(200);
      expect(showGroupCollectionResponse.body.id).toBe(addCollectionResponse.body.id);
      expect(indexGroupCollectionsResponse.status).toBe(200);
      expect(Array.isArray(indexGroupCollectionsResponse.body)).toBe(true);
      expect(updateCollectionResponse.status).toBe(200);
      expect(updateCollectionResponse.body.accessRole).toBe('editor');
      expect(assignPricingResponse.status).toBe(200);
      expect(assignPricingResponse.body.message).toBe('Pricing assigned to group.');
      expect(listPricingsResponse.status).toBe(200);
      expect(listPricingsResponse.body.pricings.map((p: any) => p.id)).toContain(pricing.pricing.id);
      expect(removePricingResponse.status).toBe(200);
      expect(removePricingResponse.body.message).toBe('Pricing removed from group.');
      expect(removeCollectionResponse.status).toBe(200);
      expect(removeCollectionResponse.body.message).toBe('Successfully removed.');
    });
  });
});
