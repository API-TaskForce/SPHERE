import express from 'express';
import PricingCollectionController from '../controllers/PricingCollectionController';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext } from '../middlewares/OrgMiddleware';
import { checkSpacePlan } from '../middlewares/SpacePlanMiddleware';
import PricingController from '../controllers/PricingController';
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware';
import * as PricingCollectionValidator from '../controllers/validation/PricingCollectionValidation';
import { handleCollectionUpload } from '../middlewares/FileHandlerMiddleware';
import path from 'path';

const loadFileRoutes = function (app: express.Application) {
  const pricingCollectionController = new PricingCollectionController();
  const pricingController = new PricingController();

  const upload = handleCollectionUpload(
    ['zip'],
    path.resolve(process.cwd(), 'public', 'static', 'collections')
  );

  const baseUrl = process.env.BASE_URL_PATH;

  app
    .route(baseUrl + '/pricings/collections')
    .get(pricingCollectionController.index)
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      checkSpacePlan('collections', 1),
      pricingCollectionController.create
    );

  app
    .route(baseUrl + '/pricings/collections/bulk')
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('bulkImport'),
      checkSpacePlan('collectionManagement'),
      checkSpacePlan('collections', 1),
      upload,
      pricingCollectionController.bulkCreate
    );

  app
    .route(baseUrl + '/me/collections')
    .get(isLoggedIn, orgContext, pricingCollectionController.showByUserId);

  app
    .route(baseUrl + '/me/collections/pricings/:pricingName')
    .delete(isLoggedIn, pricingController.removePricingFromCollection);

  app
    .route(baseUrl + '/pricings/collections/:userId/:collectionName')
    .get(pricingCollectionController.showByNameAndUserId)
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionAnalytics'),
      pricingCollectionController.generateAnalytics
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      PricingCollectionValidator.update,
      handleValidation,
      pricingCollectionController.update
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      pricingCollectionController.destroy
    );

  app
    .route(baseUrl + '/pricings/collections/:userId/:collectionName/download')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionExport'),
      pricingCollectionController.downloadCollection
    );
};

export default loadFileRoutes;
