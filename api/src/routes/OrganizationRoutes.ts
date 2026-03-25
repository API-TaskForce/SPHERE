import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware';
import path from 'path';

const loadFileRoutes = function (app: express.Application) {
  const organizationController = new OrganizationController();
  
  const baseUrl = process.env.BASE_URL_PATH;
  
  app
    .route(baseUrl + '/organizations')
    .get(organizationController.index)
    .post(isLoggedIn, organizationController.create);
  
  app
    .route(baseUrl + '/organizations/:organizationId')
    .get(organizationController.show)
    .put(isLoggedIn, organizationController.update, handleValidation)
    .delete(isLoggedIn, organizationController.destroy);
};

export default loadFileRoutes;