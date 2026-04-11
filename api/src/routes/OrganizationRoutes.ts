import express from 'express';
import OrganizationController from '../controllers/OrganizationController';
import OrganizationMembershipController from '../controllers/OrganizationMembershipController';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext, orgContextFromParam } from '../middlewares/OrgMiddleware';
import { checkCedar } from '../middlewares/CedarMiddleware';
import { checkSpacePlan } from '../middlewares/SpacePlanMiddleware';
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware';
import * as OrganizationValidation from '../controllers/validation/OrganizationValidation';

const loadFileRoutes = function (app: express.Application) {
  const organizationController = new OrganizationController();
  const organizationMembershipController = new OrganizationMembershipController();

  const baseUrl = process.env.BASE_URL_PATH;

  // ── Organization CRUD ──────────────────────────────────────────────────────
  app
    .route(baseUrl + '/organizations')
    .get(organizationController.index)
    .post(
      isLoggedIn,
      OrganizationValidation.create,
      handleValidation,
      organizationController.create
    );

  app.route(baseUrl + '/organizations/by-name/:name').get(organizationController.showByName);

  app
    .route(baseUrl + '/organizations/:organizationId')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      organizationController.show
    )
    .put(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('organizationManagement'),
      checkCedar('updateOrganization', 'Organization', 'organizationId'),
      OrganizationValidation.update,
      handleValidation,
      organizationController.update
    )
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('organizationManagement'),
      checkCedar('deleteOrganization', 'Organization', 'organizationId'),
      checkSpacePlan('organizationManagement'),
      organizationController.destroy
    );

  // ── Member management ──────────────────────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/members')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      organizationController.listMembers
    )
    .post(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('organizationManagement'),
      checkSpacePlan('orgMembers', 1),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      OrganizationValidation.addMember,
      handleValidation,
      organizationController.addMember
    );

  app
    .route(baseUrl + '/organizations/:organizationId/members/:userId')
    .put(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('organizationManagement'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      OrganizationValidation.updateMemberRole,
      handleValidation,
      organizationController.updateMemberRole
    )
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('organizationManagement'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      organizationController.removeMember
    );

  // ── User-scoped organization routes ───────────────────────────────────────
  app
    .route(baseUrl + '/users/me/organizations')
    .get(isLoggedIn, organizationController.indexByUser);

  // ── Lightweight read endpoints ─────────────────────────────────────────────
  app
    .route(baseUrl + '/organization-memberships/:membershipId')
    .get(isLoggedIn, organizationMembershipController.show);

  app
    .route(baseUrl + '/users/:userId/organization-memberships')
    .get(isLoggedIn, organizationMembershipController.indexByUser);
};

export default loadFileRoutes;
