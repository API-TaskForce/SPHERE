import request from 'supertest';
import type { Server } from 'http';
import type { Application } from 'express';
import { initializeServer, disconnectDatabase } from '../../src/app';

let testServer: Server | null = null;
let testApp: Application | null = null;

export type TestApp = Parameters<typeof request>[0];

const getApp = async (): Promise<TestApp> => {
  if (!testServer) {
    const { server, app } = await initializeServer();
    testServer = server;
    testApp = app;
  }

  return testServer as TestApp;
};

const shutdownApp = async () => {
  if (!testServer) return;

  await new Promise<void>((resolve, reject) => {
    testServer!.close(error => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
  testApp = null;
  testServer = null;
};

export { getApp, shutdownApp };
