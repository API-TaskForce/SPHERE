import request from 'supertest';
import testContainer from '../config/testContainer';
import { BASE_PATH } from '../config/variables';
import { authHeader, randomSuffix } from '../helpers';
import type { LeanTestUser } from '../users/userTestUtils';

export const createGroupForOrganization = async (params: {
  user: LeanTestUser;
  organizationId: string;
  name?: string;
  displayName?: string;
}) => {
  const name = params.name ?? `group_${randomSuffix()}`;
  const response = await request(testContainer.resolve('app'))
    .post(`${BASE_PATH}/organizations/${params.organizationId}/groups`)
    .set(authHeader(params.user))
    .send({
      name,
      displayName: params.displayName ?? `Group ${name}`,
      description: 'Group created during integration tests',
    });

  if (response.body?.id) {
    testContainer.resolve('groupIdsToDelete').add(response.body.id);
  }

  return { response, group: response.body };
};
