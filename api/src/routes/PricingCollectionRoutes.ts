import express from 'express';
import PricingCollectionController from '../controllers/PricingCollectionController';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext } from '../middlewares/OrgMiddleware';
import { checkCedar } from '../middlewares/CedarMiddleware';
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
    .get(isLoggedIn, orgContext, pricingCollectionController.index)
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      checkSpacePlan('collections', 1),
      checkCedar('createCollection', 'Organization'),
      pricingCollectionController.create
    );

  app
    .route(baseUrl + '/groups/:groupId/collections')
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      checkSpacePlan('collections', 1),
      checkCedar('createCollection', 'Group', 'groupId'),
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
      checkCedar('createCollection', 'Organization'),
      upload,
      pricingCollectionController.bulkCreate
    );

  app
    .route(baseUrl + '/me/collections')
    .get(isLoggedIn, orgContext, pricingCollectionController.showByUserId);

  app
    .route(baseUrl + '/me/collections/pricings/:pricingName')
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkCedar('deletePricing', 'Pricing'),
      pricingController.removePricingFromCollection
    );

  app
    .route(baseUrl + '/pricings/collections/:userId/:collectionName')
    .get(
      isLoggedIn,
      orgContext,
      checkCedar('readCollection', 'PricingCollection'),
      pricingCollectionController.showByNameAndUserId
    )
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionAnalytics'),
      checkCedar('updateCollection', 'PricingCollection'),
      pricingCollectionController.generateAnalytics
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      checkCedar('updateCollection', 'PricingCollection'),
      PricingCollectionValidator.update,
      handleValidation,
      pricingCollectionController.update
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionManagement'),
      checkCedar('deleteCollection', 'PricingCollection'),
      pricingCollectionController.destroy
    );

  app
    .route(baseUrl + '/pricings/collections/:userId/:collectionName/download')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('collectionExport'),
      checkCedar('readCollection', 'PricingCollection'),
      pricingCollectionController.downloadCollection
    );
};

export default loadFileRoutes;
