import request from 'supertest';
import UserMongoose from '../../../src/repositories/mongoose/models/UserMongoose';
import OrganizationMongoose from '../../../src/repositories/mongoose/models/OrganizationMongoose';
import OrganizationMembershipMongoose from '../../../src/repositories/mongoose/models/OrganizationMembershipMongoose';
import { BASE_PATH, TEST_PASSWORD } from '../config/variables';
import { randomSuffix } from '../helpers';

export type TestUserType = 'user' | 'admin';

export interface LeanTestUser {
  id: string;
  username: string;
  email: string;
  userType: TestUserType;
  token: string;
  tokenExpiration: Date;
  personalOrganizationId: string;
}

const getTracker = async () => (await import('../config/testContainer')).default;

export const buildUserPayload = (userType: TestUserType = 'user', username?: string) => {
  const suffix = randomSuffix();
  const safeUsername = username ?? `u_${suffix}`.slice(0, 15);

  return {
    firstName: 'John',
    lastName: 'Doe',
    username: safeUsername,
    email: `${safeUsername}_${suffix}@example.com`,
    password: TEST_PASSWORD,
    phone: '+34-600-000-000',
    address: 'Test Street',
    postalCode: '41001',
    userType,
  };
};

export const createDirectUserWithPersonalOrg = async (
  userType: TestUserType = 'user',
  username?: string,
  track = true
): Promise<LeanTestUser> => {
  const userData = {
    ...buildUserPayload(userType, username),
    token: `test-token-${randomSuffix()}-${Date.now()}`,
    tokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
    avatar: 'avatars/default-avatar.png',
  };

  const savedUser = await new UserMongoose(userData).save();
  const organization = await new OrganizationMongoose({
    name: userData.username,
    displayName: userData.username,
    isPersonal: true,
  }).save();

  await new OrganizationMembershipMongoose({
    _userId: savedUser._id,
    _organizationId: organization._id,
    role: 'owner',
    joinedAt: new Date(),
  }).save();

  if (track) {
    const testContainer = await getTracker();
    testContainer.resolve('usersToDelete').add(userData.username);
    testContainer.resolve('organizationIdsToDelete').add(organization._id.toString());
  }

  return {
    id: savedUser._id.toString(),
    username: userData.username,
    email: userData.email,
    userType,
    token: userData.token,
    tokenExpiration: userData.tokenExpiration,
    personalOrganizationId: organization._id.toString(),
  };
};

export const createTestUser = async (
  userType: TestUserType = 'user',
  username?: string
): Promise<LeanTestUser> => createDirectUserWithPersonalOrg(userType, username, true);

export const createAndLoginUser = async (
  app: any,
  userType: TestUserType = 'user',
  username?: string
): Promise<LeanTestUser> => {
  const user = await createTestUser(userType, username);
  const endpoint = userType === 'admin' ? `${BASE_PATH}/users/loginAdmin` : `${BASE_PATH}/users/login`;
  const response = await request(app).post(endpoint).send({
    loginField: user.username,
    password: TEST_PASSWORD,
  });

  return {
    ...user,
    token: response.body.token,
    tokenExpiration: response.body.tokenExpiration,
  };
};

export const loginSeedUser = async (
  app: any,
  credentials: { loginField: string; password: string },
  userType: TestUserType = 'user'
) => {
  const endpoint = userType === 'admin' ? `${BASE_PATH}/users/loginAdmin` : `${BASE_PATH}/users/login`;
  return request(app).post(endpoint).send(credentials);
};
