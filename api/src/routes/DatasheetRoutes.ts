import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import DatasheetController from '../controllers/DatasheetController';
import { handlePricingUpload } from '../middlewares/FileHandlerMiddleware';
import path from 'path';

const loadFileRoutes = function (app: express.Application) {
  const datasheetController = new DatasheetController();
  const upload = handlePricingUpload(
    ["yaml"],
    path.resolve(process.cwd(), "public", "static", "datasheets", "uploaded")
  );

  const baseUrl = process.env.BASE_URL_PATH;

  app
    .route(baseUrl + '/datasheets')
    .get(datasheetController.index)
    .post(isLoggedIn, upload, datasheetController.create);

  app
    .route(baseUrl + '/datasheets/:owner/:datasheetName')
    .get(datasheetController.show)
    .put(isLoggedIn, datasheetController.update)
    .delete(isLoggedIn, datasheetController.destroyByNameAndOwner);
  
  app
    .route(baseUrl + '/datasheets/:owner/:datasheetName/:datasheetVersion')
    .delete(isLoggedIn, datasheetController.destroyVersionByNameAndOwner);

  app
    .route(baseUrl + '/me/datasheets')
    .get(isLoggedIn, datasheetController.indexByUserWithoutCollection)
    .put(isLoggedIn, datasheetController.addDatasheetToCollection);
};

export default loadFileRoutes;
