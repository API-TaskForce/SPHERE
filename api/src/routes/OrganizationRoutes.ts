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

  // ── Invitation preview & join (static segments before :organizationId) ─────
  app
    .route(baseUrl + '/organizations/invitations/preview/:code')
    .get(isLoggedIn, organizationController.previewInvitation);

  app
    .route(baseUrl + '/organizations/join/:code')
    .post(isLoggedIn, organizationController.joinViaInvitation);

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
      checkCedar('updateOrganization', 'Organization', 'organizationId'),
      OrganizationValidation.update,
      handleValidation,
      organizationController.update
    )
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('deleteOrganization', 'Organization', 'organizationId'),
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
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      OrganizationValidation.updateMemberRole,
      handleValidation,
      organizationController.updateMemberRole
    )
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      organizationController.removeMember
    );

  // ── Invitation management ──────────────────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/invitations')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      organizationController.listInvitations
    )
    .post(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      organizationController.createInvitation
    );

  app
    .route(baseUrl + '/organizations/:organizationId/invitations/:invitationId')
    .delete(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageOrganizationMembers', 'Organization', 'organizationId'),
      organizationController.revokeInvitation
    );

  // ── Plan management ────────────────────────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/plan')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      organizationController.getPlan
    )
    .put(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageSubscription', 'Organization', 'organizationId'),
      organizationController.changePlan
    );

  // ── Add-on management ──────────────────────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/add-ons')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      organizationController.getAddOns
    )
    .put(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageSubscription', 'Organization', 'organizationId'),
      organizationController.updateAddOns
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
