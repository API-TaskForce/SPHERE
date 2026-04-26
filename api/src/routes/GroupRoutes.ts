import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
import { orgContext, orgContextFromParam } from '../middlewares/OrgMiddleware';
import { checkCedar } from '../middlewares/CedarMiddleware';
import { checkSpacePlan } from '../middlewares/SpacePlanMiddleware';
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware';
import GroupController from '../controllers/GroupController';
import GroupMembershipController from '../controllers/GroupMembershipController';
import GroupCollectionController from '../controllers/GroupCollectionController';
import * as GroupValidation from '../controllers/validation/GroupValidation';
const loadFileRoutes = function (app: express.Application) {
  const groupController = new GroupController();
  const groupMembershipController = new GroupMembershipController();
  const groupCollectionController = new GroupCollectionController();

  const baseUrl = process.env.BASE_URL_PATH;

  // ── Group CRUD ────────────────────────────────────────────────────────────
  app.route(baseUrl + '/groups').get(groupController.index);

  app
    .route(baseUrl + '/groups/:groupId')
    .get(isLoggedIn, orgContext, checkCedar('readGroup', 'Group', 'groupId'), groupController.show)
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('updateGroup', 'Group', 'groupId'),
      GroupValidation.update,
      handleValidation,
      groupController.update
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('deleteGroup', 'Group', 'groupId'),
      groupController.destroy
    );

  // ── Group member management ───────────────────────────────────────────────
  app
    .route(baseUrl + '/groups/:groupId/members')
    .get(
      isLoggedIn,
      orgContext,
      checkCedar('readGroup', 'Group', 'groupId'), // Assuming readGroup covers listing members
      groupController.listMembers
    )
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkSpacePlan('groupMembers', 1),
      checkCedar('manageGroupMembers', 'Group', 'groupId'),
      GroupValidation.addMember,
      handleValidation,
      groupController.addMember
    );

  app
    .route(baseUrl + '/groups/:groupId/members/:userId')
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('manageGroupMembers', 'Group', 'groupId'),
      GroupValidation.updateMemberRole,
      handleValidation,
      groupController.updateMemberRole
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('manageGroupMembers', 'Group', 'groupId'),
      groupController.removeMember
    );

  // ── Group collection associations ─────────────────────────────────────────
  app
    .route(baseUrl + '/groups/:groupId/collections')
    .get(
      isLoggedIn,
      orgContext,
      checkCedar('readGroup', 'Group', 'groupId'),
      groupController.listCollections
    );

  app
    .route(baseUrl + '/groups/:groupId/collections/:pricingCollectionId')
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('manageGroupCollections', 'Group', 'groupId'),
      GroupValidation.updateCollectionAccess,
      handleValidation,
      groupController.updateCollectionAccess
    )
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkCedar('manageGroupCollections', 'Group', 'groupId'),
      groupController.removeCollection
    );

  // ── Subgroup routes ───────────────────────────────────────────────────────
  // Listar subgrupos: permitido a cualquier miembro del grupo padre (acción listSubgroups)
  // Crear subgrupo: exclusivo de admin del grupo padre (acción createSubgroup)
  app
    .route(baseUrl + '/groups/:groupId/subgroups')
    .get(
      isLoggedIn,
      orgContext,
      checkCedar('listSubgroups', 'Group', 'groupId'),
      groupController.indexByParent
    )
    .post(
      isLoggedIn,
      orgContext,
      checkSpacePlan('groupManagement'),
      checkSpacePlan('groups', 1),
      checkCedar('createSubgroup', 'Group', 'groupId'),
      GroupValidation.create,
      handleValidation,
      groupController.createSubgroup
    );

  // ── Organization-scoped group routes ──────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/groups')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      groupController.indexByOrganization
    )
    .post(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('groupManagement'),
      checkSpacePlan('groups', 1),
      checkCedar('createGroup', 'Organization', 'organizationId'),
      GroupValidation.create,
      handleValidation,
      groupController.create
    );

  app
    .route(baseUrl + '/organizations/:organizationId/groups/:groupId/available-collections')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('manageGroupCollections', 'Group', 'groupId'),
      groupController.listAvailableCollections
    );

  app
    .route(baseUrl + '/organizations/:organizationId/groups/:groupId/collections')
    .post(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkSpacePlan('sharedCollections'),
      checkCedar('manageGroupCollections', 'Group', 'groupId'),
      GroupValidation.addCollection,
      handleValidation,
      groupController.addCollection
    );

  // ── Group pricing management ──────────────────────────────────────────────
  app
    .route(baseUrl + '/groups/:groupId/pricings')
    .get(
      isLoggedIn,
      orgContext,
      checkCedar('readGroup', 'Group', 'groupId'),
      groupController.listPricings
    )
    .put(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkCedar('createPricing', 'Group', 'groupId'),
      groupController.assignExistingPricing
    );

  app
    .route(baseUrl + '/groups/:groupId/pricings/:pricingId')
    .delete(
      isLoggedIn,
      orgContext,
      checkSpacePlan('pricingManagement'),
      checkCedar('manageGroupPricings', 'Group', 'groupId'),
      groupController.removePricing
    );

  // ── Lightweight read endpoints ────────────────────────────────────────────
  app
    .route(baseUrl + '/group-memberships/:membershipId')
    .get(isLoggedIn, groupMembershipController.show);

  app
    .route(baseUrl + '/users/:userId/group-memberships')
    .get(isLoggedIn, groupMembershipController.indexByUser);

  app
    .route(baseUrl + '/group-collections/:groupCollectionId')
    .get(isLoggedIn, groupCollectionController.show);

  app
    .route(baseUrl + '/organizations/:organizationId/group-collections')
    .get(
      isLoggedIn,
      orgContextFromParam('organizationId'),
      checkCedar('readOrganization', 'Organization', 'organizationId'),
      groupCollectionController.indexByOrganization
    );
};

export default loadFileRoutes;
