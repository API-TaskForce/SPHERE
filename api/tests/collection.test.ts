import dotenv from 'dotenv';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH } from './utils/config/variables';
import { authHeader, cleanupTrackedData, randomSuffix } from './utils/helpers';
import {
  createBulkZipFixture,
  createTestCollection,
} from './utils/collections/collectionTestUtils';
import { createPricingForUser } from './utils/pricings/pricingTestUtils';
import { createOrganizationForUser } from './utils/organizations/organizationTestUtils';
import type { LeanTestUser } from './utils/users/userTestUtils';

dotenv.config();

describe('Pricing Collections API integration', () => {
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

  describe('GET/POST /api/pricings/collections', () => {
    it('requires authentication, creates collections, and lists the active organization collections', async () => {
      const unauthenticated = await request(app).get(`${BASE_PATH}/pricings/collections`);
      const { response: createResponse, collection } = await createTestCollection({ user: testUser });
      const listResponse = await request(app)
        .get(`${BASE_PATH}/pricings/collections?limit=10&offset=0`)
        .set(authHeader(testUser));

      expect(unauthenticated.status).toBe(401);
      expect(createResponse.status).toBe(200);
      expect(collection.name).toBeDefined();
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body.collections)).toBe(true);
      expect(listResponse.body.collections.map((c: any) => c.name)).toContain(collection.name);
    });

    it('returns 409 for duplicate collection names owned by the same user', async () => {
      const name = `collection_${randomSuffix()}`;
      await createTestCollection({ user: testUser, name });
      const duplicate = await createTestCollection({ user: testUser, name });

      expect(duplicate.response.status).toBe(409);
      expect(duplicate.response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/pricings/collections/bulk', () => {
    it('accepts a zip file and reports invalid pricings without rejecting the whole collection', async () => {
      const { zipPath } = await createBulkZipFixture();

      const response = await request(app)
        .post(`${BASE_PATH}/pricings/collections/bulk`)
        .set(authHeader(testUser))
        .field('name', `bulk_${randomSuffix()}`)
        .field('description', 'Bulk upload collection')
        .field('private', 'false')
        .attach('zip', zipPath);

      if (response.body?.collection?.id) {
        testContainer.resolve('collectionIdsToDelete').add(response.body.collection.id);
      }

      expect(response.status).toBe(200);
      expect(response.body.collection).toBeDefined();
      expect(Array.isArray(response.body.pricingsWithErrors)).toBe(true);
    });
  });

  describe('GET/PUT/DELETE /api/pricings/collections/:userId/:collectionName', () => {
    it('shows, updates, and deletes an owned collection', async () => {
      const { collection } = await createTestCollection({ user: testUser });

      const showResponse = await request(app)
        .get(`${BASE_PATH}/pricings/collections/${testUser.id}/${encodeURIComponent(collection.name)}`)
        .set(authHeader(testUser));
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/pricings/collections/${testUser.id}/${encodeURIComponent(collection.name)}`)
        .set(authHeader(testUser))
        .send({ description: 'Updated description' });
      const deleteResponse = await request(app)
        .delete(`${BASE_PATH}/pricings/collections/${testUser.id}/${encodeURIComponent(collection.name)}`)
        .set(authHeader(testUser));

      expect(showResponse.status).toBe(200);
      expect(showResponse.body.name).toBe(collection.name);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.description).toBe('Updated description');
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Successfully deleted.');
    });

    it('generates analytics for a collection with pricings', async () => {
      const pricing = await createPricingForUser({ user: testUser });
      const { collection } = await createTestCollection({
        user: testUser,
        pricings: [pricing.serviceName],
      });

      const response = await request(app)
        .post(`${BASE_PATH}/pricings/collections/${testUser.id}/${encodeURIComponent(collection.name)}`)
        .set(authHeader(testUser));

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Analytics generated successfully.');
    });
  });

  describe('Collection pricing membership', () => {
    it('removes a pricing from the current user collection through /api/me/collections/pricings/:pricingName', async () => {
      const pricing = await createPricingForUser({ user: testUser });
      const { collection } = await createTestCollection({
        user: testUser,
        pricings: [pricing.serviceName],
      });

      const response = await request(app)
        .delete(`${BASE_PATH}/me/collections/pricings/${encodeURIComponent(pricing.serviceName)}`)
        .set(authHeader(testUser));
      const refreshed = await request(app)
        .get(`${BASE_PATH}/pricings/collections/${testUser.id}/${encodeURIComponent(collection.name)}`)
        .set(authHeader(testUser));

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
      expect(refreshed.status).toBe(200);
      const names = refreshed.body.pricings?.[0]?.pricings?.map((p: any) => p.name) ?? [];
      expect(names).not.toContain(pricing.serviceName);
    });
  });

  describe('Organization collection assignment extras', () => {
    it('assigns a collection to an organization and removes it again', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const { collection } = await createTestCollection({ user: testUser });

      const assignResponse = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/collections/assign`)
        .set(authHeader(testUser))
        .send({ collectionId: collection.id });
      const removeResponse = await request(app)
        .delete(`${BASE_PATH}/organizations/${organization.id}/collections/${collection.id}`)
        .set(authHeader(testUser));

      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.message).toBe('Collection assigned to organization.');
      expect(removeResponse.status).toBe(200);
      expect(removeResponse.body.message).toBe('Collection removed from organization.');
    });
  });
});
