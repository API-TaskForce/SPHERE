import express from 'express';
import DatasheetCollectionController from '../controllers/DatasheetCollectionController';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import DatasheetController from '../controllers/DatasheetController';
import { handleCollectionUpload } from '../middlewares/FileHandlerMiddleware';
import path from 'path';

const loadFileRoutes = function (app: express.Application) {
  const datasheetCollectionController = new DatasheetCollectionController();
  const datasheetController = new DatasheetController();

  const upload = handleCollectionUpload(
    ['zip'],
    path.resolve(process.cwd(), 'public', 'static', 'datasheetCollections')
  );

  const baseUrl = process.env.BASE_URL_PATH;

  app
    .route(baseUrl + '/datasheets/collections')
    .get(datasheetCollectionController.index)
    .post(isLoggedIn, datasheetCollectionController.create);

  app
    .route(baseUrl + '/datasheets/collections/bulk')
    .post(isLoggedIn, upload, datasheetCollectionController.bulkCreate);

  app.route(baseUrl + '/me/datasheetCollections').get(isLoggedIn, datasheetCollectionController.showByUserId);

  app
    .route(baseUrl + '/me/datasheetCollections/datasheets/:datasheetName')
    .delete(isLoggedIn, datasheetController.removeDatasheetFromCollection);

  app
    .route(baseUrl + '/datasheets/collections/:userId/:collectionName')
    .get(datasheetCollectionController.showByNameAndUserId)
    .put(
      isLoggedIn,
      datasheetCollectionController.update
    )
    .delete(isLoggedIn, datasheetCollectionController.destroy);
};

export default loadFileRoutes;
