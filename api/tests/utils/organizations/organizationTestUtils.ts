import request from 'supertest';
import testContainer from '../config/testContainer';
import { BASE_PATH } from '../config/variables';
import { authHeader, randomSuffix } from '../helpers';
import type { LeanTestUser } from '../users/userTestUtils';

export const createOrganizationForUser = async (user: LeanTestUser, overrides: Record<string, any> = {}) => {
  const name = overrides.name ?? `org-${randomSuffix()}`;
  const response = await request(testContainer.resolve('app'))
    .post(`${BASE_PATH}/organizations`)
    .set(authHeader(user))
    .send({
      name,
      displayName: overrides.displayName ?? `Organization ${name}`,
      description: overrides.description ?? 'Organization created during integration tests',
      ...overrides,
    });

  if (response.body?.id) {
    testContainer.resolve('organizationIdsToDelete').add(response.body.id);
  }

  return { response, organization: response.body };
};
