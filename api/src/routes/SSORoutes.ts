import express from 'express';
import SSOController from '../controllers/SSOController.js';

const loadFileRoutes = function (app: express.Application) {
  const ssoController = new SSOController();
  const baseUrl = (process.env.BASE_URL_PATH ?? '/api') + '/auth/sso/us';

  app.route(`${baseUrl}`).get(ssoController.initiate);
  app.route(`${baseUrl}/callback`).get(ssoController.callback);
  app.route(`${baseUrl}/exchange`).get(ssoController.exchange);
};

export default loadFileRoutes;
