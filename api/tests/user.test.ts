import dotenv from 'dotenv';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH, TEST_PASSWORD } from './utils/config/variables';
import { authHeader, cleanupTrackedData } from './utils/helpers';
import { buildUserPayload, createTestUser, type LeanTestUser } from './utils/users/userTestUtils';
import OrganizationMongoose from '../src/repositories/mongoose/models/OrganizationMongoose';
import OrganizationMembershipMongoose from '../src/repositories/mongoose/models/OrganizationMembershipMongoose';

dotenv.config();

describe('Users API integration', () => {
  let app: TestApp;
  const adminUser: LeanTestUser = testContainer.resolve('adminUser');
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

  describe('POST /api/users/login', () => {
    it('returns 200 and user data when logging in by email or username', async () => {
      const user = await createTestUser('user');

      const byEmail = await request(app).post(`${BASE_PATH}/users/login`).send({
        loginField: user.email,
        password: TEST_PASSWORD,
      });
      const byUsername = await request(app).post(`${BASE_PATH}/users/login`).send({
        loginField: user.username,
        password: TEST_PASSWORD,
      });

      expect(byEmail.status).toBe(200);
      expect(byEmail.body.password).toBeUndefined();
      expect(byEmail.body.username).toBe(user.username);
      expect(byEmail.body.token).toBeDefined();
      expect(byUsername.status).toBe(200);
      expect(byUsername.body.email).toBe(user.email);
    });

    it('returns 401 for wrong credentials and 422 for malformed login fields', async () => {
      const user = await createTestUser('user');

      const wrongPassword = await request(app).post(`${BASE_PATH}/users/login`).send({
        loginField: user.username,
        password: 'wrong-password',
      });
      const malformed = await request(app).post(`${BASE_PATH}/users/login`).send({
        loginField: 'not valid!',
        password: TEST_PASSWORD,
      });

      expect(wrongPassword.status).toBe(401);
      expect(wrongPassword.body.error).toBeDefined();
      expect(malformed.status).toBe(422);
      expect(Array.isArray(malformed.body.errors)).toBe(true);
    });
  });

  describe('POST /api/users/register', () => {
    it('returns 201, hides password, and creates the personal organization for the user', async () => {
      const payload = buildUserPayload('user');

      const response = await request(app).post(`${BASE_PATH}/users/register`).send(payload);
      testContainer.resolve('usersToDelete').add(payload.username);

      const organization = await OrganizationMongoose.findOne({ name: payload.username, isPersonal: true });
      if (organization?._id) {
        testContainer.resolve('organizationIdsToDelete').add(organization._id.toString());
      }

      expect(response.status).toBe(201);
      expect(response.body.password).toBeUndefined();
      expect(response.body.username).toBe(payload.username);
      expect(response.body.userType).toBe('user');
      expect(organization).toBeTruthy();

      const membership = await OrganizationMembershipMongoose.findOne({
        _userId: response.body.id,
        _organizationId: organization!._id,
        role: 'owner',
      });
      expect(membership).toBeTruthy();
    });

    it('returns 422 for missing required fields and invalid email', async () => {
      const missing = await request(app).post(`${BASE_PATH}/users/register`).send({
        firstName: 'John',
      });
      const invalidEmail = await request(app)
        .post(`${BASE_PATH}/users/register`)
        .send(buildUserPayload('user', 'validname'))
        .send({ email: 'invalid-email' });

      expect(missing.status).toBe(422);
      expect(Array.isArray(missing.body.errors)).toBe(true);
      expect(invalidEmail.status).toBe(422);
      expect(Array.isArray(invalidEmail.body.errors)).toBe(true);
    });

    it('allows an admin to register another admin and rejects non-admin callers', async () => {
      const adminPayload = buildUserPayload('admin');
      const userPayload = buildUserPayload('admin');

      const created = await request(app)
        .post(`${BASE_PATH}/users/registerAdmin`)
        .set(authHeader(adminUser))
        .send(adminPayload);
      testContainer.resolve('usersToDelete').add(adminPayload.username);

      const rejected = await request(app)
        .post(`${BASE_PATH}/users/registerAdmin`)
        .set(authHeader(testUser))
        .send(userPayload);

      expect(created.status).toBe(201);
      expect(created.body.userType).toBe('admin');
      expect(rejected.status).toBe(403);
    });
  });

  describe('GET /api/users/by-username/:username', () => {
    it('returns public user data for an authenticated caller', async () => {
      const user = await createTestUser('user');

      const response = await request(app)
        .get(`${BASE_PATH}/users/by-username/${user.username}`)
        .set(authHeader(testUser));

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(user.username);
      expect(response.body.password).toBeUndefined();
      expect(response.body.token).toBeUndefined();
    });

    it('returns 401 without Authorization and 404 for unknown usernames', async () => {
      const unauthenticated = await request(app).get(`${BASE_PATH}/users/by-username/missing`);
      const missing = await request(app)
        .get(`${BASE_PATH}/users/by-username/missing`)
        .set(authHeader(testUser));

      expect(unauthenticated.status).toBe(401);
      expect(missing.status).toBe(404);
    });
  });

  describe('PUT/DELETE /api/users', () => {
    it('updates the authenticated user profile', async () => {
      const user = await createTestUser('user');

      const response = await request(app)
        .put(`${BASE_PATH}/users`)
        .set(authHeader(user))
        .send({ firstName: 'Updated', address: 'Updated street' });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.address).toBe('Updated street');
    });

    it('deletes the authenticated user account', async () => {
      const user = await createTestUser('user');

      const response = await request(app)
        .delete(`${BASE_PATH}/users`)
        .set(authHeader(user));

      expect(response.status).toBe(200);
      expect(response.body).toBe('Successfully deleted.');
    });
  });

  describe('POST /api/users/tokenLogin', () => {
    it('returns the user represented by a valid token', async () => {
      const response = await request(app)
        .post(`${BASE_PATH}/users/tokenLogin`)
        .send({ token: testUser.token });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.token).toBe(testUser.token);
    });
  });
});
