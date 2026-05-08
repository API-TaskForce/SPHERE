import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import testContainer from '../config/testContainer';
import { BASE_PATH } from '../config/variables';
import { addOrgHeader, authHeader, randomSuffix } from '../helpers';
import type { LeanTestUser } from '../users/userTestUtils';

const pricingTemplatePath = () => {
  const fromApiCwd = path.resolve(process.cwd(), 'public', 'static', 'pricings', 'templates', 'petclinic.yml');
  const fromRepoCwd = path.resolve(process.cwd(), 'api', 'public', 'static', 'pricings', 'templates', 'petclinic.yml');
  return fromApiCwd;
};

export const createValidPricingYaml = async (requestedName?: string, explicitVersion?: string) => {
  let templatePath = pricingTemplatePath();
  try {
    await fs.access(templatePath);
  } catch {
    templatePath = path.resolve(process.cwd(), 'api', 'public', 'static', 'pricings', 'templates', 'petclinic.yml');
  }

  const rawTemplate = await fs.readFile(templatePath, 'utf8');
  const saasName = requestedName ?? `pricing_${randomSuffix()}`;
  const version = explicitVersion ?? `${Date.now()}.0.0`;
  const today = new Date().toISOString().slice(0, 10);

  const content = rawTemplate
    .replace(/^saasName:\s*.*$/m, `saasName: ${saasName}`)
    .replace(/^version:\s*.*$/m, `version: "${version}"`)
    .replace(/^createdAt:\s*.*$/m, `createdAt: "${today}"`);

  const filePath = path.join(os.tmpdir(), `pricing_${randomSuffix()}.yml`);
  await fs.writeFile(filePath, content, 'utf8');
  testContainer.resolve('generatedFilesToDelete').add(filePath);

  return { filePath, saasName, version };
};

export const createPricingForUser = async (params: {
  user: LeanTestUser;
  serviceName?: string;
  version?: string;
  organizationId?: string;
}) => {
  const fixture = await createValidPricingYaml(params.serviceName, params.version);
  let builder = request(testContainer.resolve('app'))
    .post(`${BASE_PATH}/pricings`)
    .set(authHeader(params.user))
    .field('saasName', fixture.saasName)
    .field('version', fixture.version)
    .attach('yaml', fixture.filePath);

  builder = addOrgHeader(builder, params.organizationId);
  const response = await builder;
  const created = Array.isArray(response.body) ? response.body[0] : response.body;

  if (created?.id) {
    testContainer.resolve('pricingIdsToDelete').add(created.id);
  }

  return {
    response,
    pricing: created,
    serviceName: fixture.saasName,
    version: fixture.version,
  };
};
