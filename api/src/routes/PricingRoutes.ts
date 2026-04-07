import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext } from '../middlewares/OrgMiddleware';
import { checkSpacePlan } from '../middlewares/SpacePlanMiddleware';
import PricingController from '../controllers/PricingController';
import { handlePricingUpload } from '../middlewares/FileHandlerMiddleware';
import * as PricingValidator from '../controllers/validation/PricingValidation';
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware';
import path from 'path';

const loadFileRoutes = function (app: express.Application) {
  const pricingController = new PricingController();
  const upload = handlePricingUpload(
    ['yaml'],
    path.resolve(process.cwd(), 'public', 'static', 'pricings', 'uploaded')
  );

  const baseUrl = process.env.BASE_URL_PATH;

  app
    .route(baseUrl + '/pricings')
    .get(pricingController.index)
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricings', 1),
      upload,
      pricingController.create
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingVersioning'),
      pricingController.updateVersion
    );

  app
    .route(baseUrl + '/pricings/:pricingId/configuration-space')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('configurationSpaceAnalysis'),
      pricingController.getConfigurationSpace
    );

  app
    .route(baseUrl + '/pricings/:owner/:pricingName')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingAnalytics'),
      pricingController.show
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingEditor'),
      PricingValidator.update,
      handleValidation,
      pricingController.update
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      pricingController.destroyByNameAndOwner
    );

  app
    .route(baseUrl + '/pricings/:owner/:pricingName/:pricingVersion')
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingVersioning'),
      pricingController.destroyVersionByNameAndOwner
    );

  app
    .route(baseUrl + '/me/pricings')
    .get(isLoggedIn, orgContext, pricingController.indexByUserWithoutCollection)
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      pricingController.addPricingToCollection
    );
};

export default loadFileRoutes;
