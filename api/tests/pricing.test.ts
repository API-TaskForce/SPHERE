import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH } from './utils/config/variables';
import { addOrgHeader, authHeader, cleanupTrackedData, randomSuffix } from './utils/helpers';
import { createOrganizationForUser } from './utils/organizations/organizationTestUtils';
import { createTestCollection } from './utils/collections/collectionTestUtils';
import {
  createPricingForUser,
  createValidPricingYaml,
} from './utils/pricings/pricingTestUtils';
import type { LeanTestUser } from './utils/users/userTestUtils';

dotenv.config();

describe('Pricings API integration', () => {
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

  describe('GET /api/pricings', () => {
    it('requires authentication and returns the authenticated organization pricing index', async () => {
      const unauthenticated = await request(app).get(`${BASE_PATH}/pricings`);
      await createPricingForUser({ user: testUser });

      const response = await request(app)
        .get(`${BASE_PATH}/pricings?limit=5&offset=0`)
        .set(authHeader(testUser));

      expect(unauthenticated.status).toBe(401);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.pricings)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('POST /api/pricings', () => {
    it('creates a pricing from a valid YAML upload', async () => {
      const fixture = await createValidPricingYaml(`pricing_${randomSuffix()}`);

      const response = await request(app)
        .post(`${BASE_PATH}/pricings`)
        .set(authHeader(testUser))
        .field('saasName', fixture.saasName)
        .field('version', fixture.version)
        .attach('yaml', fixture.filePath);

      const created = response.body[0];
      if (created?.id) testContainer.resolve('pricingIdsToDelete').add(created.id);

      expect(response.status).toBe(200);
      expect(created.name).toBe(fixture.saasName);
      expect(created.owner).toBe(testUser.username);
      expect(created.yaml).toContain('static/pricings/uploaded');
    });

    it('returns 401 without a bearer token', async () => {
      const fixture = await createValidPricingYaml(`pricing_${randomSuffix()}`);

      const response = await request(app)
        .post(`${BASE_PATH}/pricings`)
        .field('saasName', fixture.saasName)
        .field('version', fixture.version)
        .attach('yaml', fixture.filePath);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/pricings', () => {
    it('parses a pricing YAML string in memory', async () => {
      const fixture = await createValidPricingYaml(`updated_${randomSuffix()}`);
      const pricingYaml = await fs.readFile(fixture.filePath, 'utf8');

      const response = await request(app)
        .put(`${BASE_PATH}/pricings`)
        .set(authHeader(testUser))
        .send({ pricing: pricingYaml });

      expect(response.status).toBe(200);
      expect(response.body.version).toBeDefined();
      expect(response.body.features).toBeDefined();
      expect(response.body.plans).toBeDefined();
    });

    it('returns 400 for malformed pricing text instead of a server crash', async () => {
      const response = await request(app)
        .put(`${BASE_PATH}/pricings`)
        .set(authHeader(testUser))
        .send({ pricing: '::::invalid-yaml::::' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Error updating pricing');
    });
  });

  describe('GET/PUT/DELETE /api/pricings/:owner/:pricingName', () => {
    it('shows, updates, and deletes an owned pricing', async () => {
      const { serviceName, version } = await createPricingForUser({ user: testUser });

      const showResponse = await request(app)
        .get(`${BASE_PATH}/pricings/${testUser.username}/${encodeURIComponent(serviceName)}`)
        .set(authHeader(testUser));
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/pricings/${testUser.username}/${encodeURIComponent(serviceName)}`)
        .set(authHeader(testUser))
        .send({ url: 'https://example.com/pricing' });
      const deleteVersionResponse = await request(app)
        .delete(`${BASE_PATH}/pricings/${testUser.username}/${encodeURIComponent(serviceName)}/${encodeURIComponent(version)}`)
        .set(authHeader(testUser));

      expect(showResponse.status).toBe(200);
      expect(showResponse.body.name).toBe(serviceName);
      expect(Array.isArray(showResponse.body.versions)).toBe(true);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe(serviceName);
      expect(deleteVersionResponse.status).toBe(200);
      expect(deleteVersionResponse.body.message).toBe('Pricing version deleted successfully');
    });

    it('returns 404 for unknown pricings and 422 for invalid updates', async () => {
      const missing = await request(app)
        .get(`${BASE_PATH}/pricings/${testUser.username}/missing-pricing`)
        .set(authHeader(testUser));
      const { serviceName } = await createPricingForUser({ user: testUser });
      const invalidUpdate = await request(app)
        .put(`${BASE_PATH}/pricings/${testUser.username}/${serviceName}`)
        .set(authHeader(testUser))
        .send({ url: 'not-a-url' });

      expect(missing.status).toBe(404);
      expect(invalidUpdate.status).toBe(422);
      expect(Array.isArray(invalidUpdate.body.errors)).toBe(true);
    });
  });

  describe('GET /api/pricings/:pricingId/configuration-space', () => {
    it('returns 404 for unknown pricing ids without bypassing auth/org guards', async () => {
      const response = await request(app)
        .get(`${BASE_PATH}/pricings/507f1f77bcf86cd799439011/configuration-space?limit=1&offset=0`)
        .set(authHeader(testUser));

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/me/pricings', () => {
    it('adds a standalone pricing to a collection', async () => {
      const { serviceName } = await createPricingForUser({ user: testUser });
      const { collection } = await createTestCollection({ user: testUser });

      const response = await request(app)
        .put(`${BASE_PATH}/me/pricings`)
        .set(authHeader(testUser))
        .send({ pricingName: serviceName, collectionId: collection.id });

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });
  });

  describe('Organization pricing assignment extras', () => {
    it('assigns a user-owned pricing to an organization and removes it again', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const { pricing, serviceName } = await createPricingForUser({ user: testUser });

      const assignResponse = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/pricings/assign`)
        .set(authHeader(testUser))
        .send({ pricingId: pricing.id });

      let orgIndex = request(app)
        .get(`${BASE_PATH}/pricings?name=${encodeURIComponent(serviceName)}`)
        .set(authHeader(testUser));
      orgIndex = addOrgHeader(orgIndex, organization.id);
      const orgIndexResponse = await orgIndex;

      const removeResponse = await request(app)
        .delete(`${BASE_PATH}/organizations/${organization.id}/pricings/${testUser.username}/${encodeURIComponent(serviceName)}`)
        .set(authHeader(testUser));

      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.message).toBe('Pricing assigned to organization.');
      expect(orgIndexResponse.status).toBe(200);
      expect(orgIndexResponse.body.pricings.map((p: any) => p.name)).toContain(serviceName);
      expect(removeResponse.status).toBe(200);
      expect(removeResponse.body.message).toBe('Pricing removed from organization.');
    });
  });
});
