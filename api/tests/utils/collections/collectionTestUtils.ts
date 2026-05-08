import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import os from 'os';
import path from 'path';
import archiver from 'archiver';
import request from 'supertest';
import testContainer from '../config/testContainer';
import { BASE_PATH } from '../config/variables';
import { addOrgHeader, authHeader, randomSuffix } from '../helpers';
import type { LeanTestUser } from '../users/userTestUtils';
import { createValidPricingYaml } from '../pricings/pricingTestUtils';

export const createTestCollection = async (params: {
  user: LeanTestUser;
  name?: string;
  description?: string;
  private?: boolean;
  pricings?: string[];
  organizationId?: string;
  groupId?: string;
}) => {
  const payload = {
    name: params.name ?? `collection_${randomSuffix()}`,
    description: params.description ?? 'Integration test collection',
    private: params.private ?? false,
    pricings: params.pricings ?? [],
  };

  const url = params.groupId
    ? `${BASE_PATH}/groups/${params.groupId}/collections`
    : `${BASE_PATH}/pricings/collections`;

  let builder = request(testContainer.resolve('app'))
    .post(url)
    .set(authHeader(params.user))
    .send(payload);

  builder = addOrgHeader(builder, params.organizationId);
  const response = await builder;
  const collection = response.body;

  if (collection?.id) {
    testContainer.resolve('collectionIdsToDelete').add(collection.id);
  }

  return { response, collection };
};

export const createBulkZipFixture = async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bulk-pricing-'));
  const validDir = path.join(rootDir, 'valid');
  const invalidDir = path.join(rootDir, 'invalid');

  await fs.mkdir(validDir, { recursive: true });
  await fs.mkdir(invalidDir, { recursive: true });

  const validPricing = await createValidPricingYaml(`bulk_${randomSuffix()}`);
  await fs.copyFile(validPricing.filePath, path.join(validDir, 'valid.yml'));
  await fs.writeFile(path.join(invalidDir, 'invalid.yml'), 'invalid: [', 'utf8');

  const zipPath = path.join(os.tmpdir(), `bulk_${randomSuffix()}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(rootDir, false);
    archive.finalize();
  });

  testContainer.resolve('generatedFilesToDelete').add(rootDir);
  testContainer.resolve('generatedFilesToDelete').add(zipPath);

  return { zipPath };
};
