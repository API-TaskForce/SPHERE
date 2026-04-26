import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext, orgContextFromParam } from '../middlewares/OrgMiddleware';
import { checkCedar } from '../middlewares/CedarMiddleware';
import { checkSpacePlan, checkUserFeature } from '../middlewares/SpacePlanMiddleware';
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
      // Pricing creation is gated on the user's personal org, not on the
      // active org context: pricings are owned by users, so the plan tier
      // and maxPricings limit that apply are those of the owner's personal org.
      checkUserFeature('pricingManagement'),
      checkUserFeature('pricings', 1),
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
      // collectionId is expected in req.body; CedarMiddleware resolves it via
      // `req.body.collectionId` and uses it as resourceId for the PricingCollection gate.
      checkCedar('createPricing', 'PricingCollection'),
      pricingController.addPricingToCollection
    );

  app
    .route(baseUrl + '/me/pricings/all')
    .get(isLoggedIn, pricingController.getAllByOwner);

  app
    .route(baseUrl + '/organizations/:organizationId/pricings/assign')
    .post(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('updateOrganization', 'Organization', 'organizationId'),
      pricingController.assignToOrg
    );

  // Uses owner+name (not ID) because the org-pricings list aggregator excludes _id.
  app
    .route(baseUrl + '/organizations/:organizationId/pricings/:owner/:pricingName')
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('updateOrganization', 'Organization', 'organizationId'),
      pricingController.removeFromOrg
    );
};

export default loadFileRoutes;
