import express from 'express';
import { isLoggedIn } from '../middlewares/AuthMiddleware';
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
  app
    .route(baseUrl + '/groups')
    .get(groupController.index);

  app
    .route(baseUrl + '/groups/:groupId')
    .get(groupController.show)
    .put(isLoggedIn, GroupValidation.update, handleValidation, groupController.update)
    .delete(isLoggedIn, groupController.destroy);

  // ── Group member management ───────────────────────────────────────────────
  app
    .route(baseUrl + '/groups/:groupId/members')
    .get(isLoggedIn, groupController.listMembers)
    .post(isLoggedIn, GroupValidation.addMember, handleValidation, groupController.addMember);

  app
    .route(baseUrl + '/groups/:groupId/members/:userId')
    .put(isLoggedIn, GroupValidation.updateMemberRole, handleValidation, groupController.updateMemberRole)
    .delete(isLoggedIn, groupController.removeMember);

  // ── Group collection associations ─────────────────────────────────────────
  app
    .route(baseUrl + '/groups/:groupId/collections')
    .get(isLoggedIn, groupController.listCollections);

  app
    .route(baseUrl + '/groups/:groupId/collections/:pricingCollectionId')
    .put(isLoggedIn, GroupValidation.updateCollectionAccess, handleValidation, groupController.updateCollectionAccess)
    .delete(isLoggedIn, groupController.removeCollection);

  // ── Organization-scoped group routes ──────────────────────────────────────
  app
    .route(baseUrl + '/organizations/:organizationId/groups')
    .get(groupController.indexByOrganization)
    .post(isLoggedIn, GroupValidation.create, handleValidation, groupController.create);

  app
    .route(baseUrl + '/organizations/:organizationId/groups/:groupId/collections')
    .post(isLoggedIn, GroupValidation.addCollection, handleValidation, groupController.addCollection);

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
    .get(isLoggedIn, groupCollectionController.indexByOrganization);
};

export default loadFileRoutes;
