import dotenv from 'dotenv';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH } from './utils/config/variables';
import { authHeader, cleanupTrackedData, randomSuffix } from './utils/helpers';
import { createOrganizationForUser } from './utils/organizations/organizationTestUtils';
import { createTestUser, type LeanTestUser } from './utils/users/userTestUtils';

dotenv.config();

describe('Organizations API integration', () => {
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

  describe('Organization CRUD', () => {
    it('lists organizations, creates an organization, resolves it by name, updates it, and deletes it', async () => {
      const listResponse = await request(app).get(`${BASE_PATH}/organizations`);
      const { response: createResponse, organization } = await createOrganizationForUser(testUser);
      const byNameResponse = await request(app)
        .get(`${BASE_PATH}/organizations/by-name/${organization.name}`);
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/organizations/${organization.id}`)
        .set(authHeader(testUser))
        .send({ displayName: 'Updated organization' });
      const deleteResponse = await request(app)
        .delete(`${BASE_PATH}/organizations/${organization.id}`)
        .set(authHeader(testUser));

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(createResponse.status).toBe(201);
      expect(organization.isPersonal).toBe(false);
      expect(byNameResponse.status).toBe(200);
      expect(byNameResponse.body.id).toBe(organization.id);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.displayName).toBe('Updated organization');
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Successfully deleted.');
    });

    it('returns validation errors for invalid organization creation', async () => {
      const response = await request(app)
        .post(`${BASE_PATH}/organizations`)
        .set(authHeader(testUser))
        .send({ name: 'Invalid Name With Spaces', displayName: 'Invalid' });

      expect(response.status).toBe(422);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('User organization memberships', () => {
    it('lists the organizations available to the authenticated user', async () => {
      const { organization } = await createOrganizationForUser(testUser);

      const response = await request(app)
        .get(`${BASE_PATH}/users/me/organizations`)
        .set(authHeader(testUser));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.map((org: any) => org.id)).toContain(organization.id);
      expect(response.body.some((org: any) => org.isPersonal)).toBe(true);
    });

    it('adds, updates, reads, and removes an organization member', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const member = await createTestUser('user');

      const addResponse = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/members`)
        .set(authHeader(testUser))
        .send({ userId: member.id, role: 'member' });
      const listResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/members`)
        .set(authHeader(testUser));
      const membershipId = addResponse.body.id;
      const showMembershipResponse = await request(app)
        .get(`${BASE_PATH}/organization-memberships/${membershipId}`)
        .set(authHeader(testUser));
      const byUserResponse = await request(app)
        .get(`${BASE_PATH}/users/${member.id}/organization-memberships`)
        .set(authHeader(testUser));
      const updateResponse = await request(app)
        .put(`${BASE_PATH}/organizations/${organization.id}/members/${member.id}`)
        .set(authHeader(testUser))
        .send({ role: 'admin' });
      const removeResponse = await request(app)
        .delete(`${BASE_PATH}/organizations/${organization.id}/members/${member.id}`)
        .set(authHeader(testUser));

      expect(addResponse.status).toBe(201);
      expect(addResponse.body.role).toBe('member');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.map((m: any) => m._userId?.toString?.() ?? m.user?.id)).toBeDefined();
      expect(showMembershipResponse.status).toBe(200);
      expect(showMembershipResponse.body.id).toBe(membershipId);
      expect(byUserResponse.status).toBe(200);
      expect(Array.isArray(byUserResponse.body)).toBe(true);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.role).toBe('admin');
      expect(removeResponse.status).toBe(200);
      expect(removeResponse.body.message).toBe('Successfully removed.');
    });
  });

  describe('Invitations and subscription extras', () => {
    it('creates, previews, joins, lists, and revokes organization invitations', async () => {
      const { organization } = await createOrganizationForUser(testUser);
      const invitee = await createTestUser('user');

      const createInvitationResponse = await request(app)
        .post(`${BASE_PATH}/organizations/${organization.id}/invitations`)
        .set(authHeader(testUser))
        .send({ expiresInDays: 7, maxUses: 2 });
      if (createInvitationResponse.body?.id) {
        testContainer.resolve('invitationIdsToDelete').add(createInvitationResponse.body.id);
      }

      const code = createInvitationResponse.body.code;
      const previewResponse = await request(app)
        .get(`${BASE_PATH}/organizations/invitations/preview/${code}`)
        .set(authHeader(invitee));
      const joinResponse = await request(app)
        .post(`${BASE_PATH}/organizations/join/${code}`)
        .set(authHeader(invitee));
      const listResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/invitations`)
        .set(authHeader(testUser));
      const revokeResponse = await request(app)
        .delete(`${BASE_PATH}/organizations/${organization.id}/invitations/${createInvitationResponse.body.id}`)
        .set(authHeader(testUser));

      expect(createInvitationResponse.status).toBe(201);
      expect(code).toBeDefined();
      expect(previewResponse.status).toBe(200);
      expect(previewResponse.body.organization.id).toBe(organization.id);
      expect(joinResponse.status).toBe(200);
      expect(joinResponse.body.id).toBe(organization.id);
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(revokeResponse.status).toBe(200);
      expect(revokeResponse.body.message).toBe('Invitation revoked.');
    });

    it('reads and updates SPACE-backed plan data through the mocked test service', async () => {
      const { organization } = await createOrganizationForUser(testUser, {
        name: `plan-${randomSuffix()}`,
      });

      const getPlanResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/plan`)
        .set(authHeader(testUser));
      const changePlanResponse = await request(app)
        .put(`${BASE_PATH}/organizations/${organization.id}/plan`)
        .set(authHeader(testUser))
        .send({ plan: 'PRO' });
      const getAddOnsResponse = await request(app)
        .get(`${BASE_PATH}/organizations/${organization.id}/add-ons`)
        .set(authHeader(testUser));
      const updateAddOnsResponse = await request(app)
        .put(`${BASE_PATH}/organizations/${organization.id}/add-ons`)
        .set(authHeader(testUser))
        .send({ addOns: { extraPricings: 1 } });

      expect(getPlanResponse.status).toBe(200);
      expect(getPlanResponse.body.plan).toBe('ENTERPRISE');
      expect(changePlanResponse.status).toBe(200);
      expect(changePlanResponse.body.plan).toBe('PRO');
      expect(getAddOnsResponse.status).toBe(200);
      expect(getAddOnsResponse.body.addOns).toEqual({});
      expect(updateAddOnsResponse.status).toBe(200);
      expect(updateAddOnsResponse.body.addOns).toEqual({ extraPricings: 1 });
    });
  });
});
