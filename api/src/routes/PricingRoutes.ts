import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext } from '../middlewares/OrgMiddleware';
import { checkCedar } from '../middlewares/CedarMiddleware';
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
    .get(isLoggedIn, orgContext, pricingController.index)
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricings', 1),
      // Standalone pricing upload: authorized at org level.
      // owner/admin always pass; members need editor/admin role in at least one group.
      checkCedar('createPricing', 'Organization'),
      upload,
      pricingController.create
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingVersioning'),
      // updateVersion only parses/validates a YAML string in-memory — no DB resource is read or written.
      // orgContext (org membership) + SpacePlan gates are sufficient here.
      pricingController.updateVersion
    );

  app
    .route(baseUrl + '/pricings/:pricingId/configuration-space')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('configurationSpaceAnalysis'),
      checkCedar('readPricing', 'Pricing', 'pricingId'),
      pricingController.getConfigurationSpace
    );

  app
    .route(baseUrl + '/pricings/:owner/:pricingName')
    .get(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingAnalytics'),
      checkCedar('readPricing', 'Pricing'),
      pricingController.show
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingEditor'),
      checkCedar('updatePricing', 'Pricing'),
      PricingValidator.update,
      handleValidation,
      pricingController.update
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkCedar('deletePricing', 'Pricing'),
      pricingController.destroyByNameAndOwner
    );

  app
    .route(baseUrl + '/pricings/:owner/:pricingName/:pricingVersion')
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkSpacePlan('pricingVersioning'),
      checkCedar('deletePricing', 'Pricing'),
      pricingController.destroyVersionByNameAndOwner
    );
  app
    .route(baseUrl + '/me/pricings')
    .get(isLoggedIn, orgContext, pricingController.indexByUserWithoutCollection)
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      // Adding a pricing to a collection requires editor/admin role on that collection.
      // collectionId comes from request body; Cedar middleware resolves it as PricingCollection resource.
      checkCedar('createPricing', 'PricingCollection', 'collectionId'),
      pricingController.addPricingToCollection
    );
};

export default loadFileRoutes;
