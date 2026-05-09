import dotenv from 'dotenv';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { shutdownApp, type TestApp } from './utils/testApp';
import testContainer from './utils/config/testContainer';
import { BASE_PATH } from './utils/config/variables';
import { randomSuffix } from './utils/helpers';

dotenv.config();

describe('Cache API integration', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = testContainer.resolve('app');
  });

  afterAll(async () => {
    await shutdownApp();
  });

  it('sets and gets cache values through the fork endpoints', async () => {
    const key = `cache-${randomSuffix()}`;
    const value = { value: randomSuffix() };

    const setResponse = await request(app)
      .post(`${BASE_PATH}/cache/set`)
      .send({ key, value, expirationInSeconds: 120 });
    const getResponse = await request(app).get(`${BASE_PATH}/cache/get?key=${key}`);

    expect(setResponse.status).toBe(200);
    expect(setResponse.body.message).toBe('Cache set successfully');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(value);
  });

  it('returns null for missing keys and 500 for conflicting values', async () => {
    const key = `cache-conflict-${randomSuffix()}`;

    const missing = await request(app).get(`${BASE_PATH}/cache/get?key=missing-${randomSuffix()}`);
    await request(app).post(`${BASE_PATH}/cache/set`).send({ key, value: { a: 1 } });
    const conflict = await request(app).post(`${BASE_PATH}/cache/set`).send({ key, value: { a: 2 } });

    expect(missing.status).toBe(200);
    expect(missing.body).toBeNull();
    expect(conflict.status).toBe(500);
    expect(conflict.body.error).toContain('Value already exists in cache');
  });
});
