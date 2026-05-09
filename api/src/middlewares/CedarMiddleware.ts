import { NextFunction, Response } from 'express';
import container from '../config/container';
import { AuthorizationRequest, CedarAction, ResourceType } from '../services/AuthorizationService';

/**
 * Middleware to enforce Cedar authorization policies.
 *
 * @param action The Cedar action to validate.
 * @param resourceType The type of resource being accessed.
 * @param idParam Optional: The name of the request param containing the resource ID.
 *                If omitted, the middleware will try to infer it or use organizationId.
 */
export const checkCedar = (
  action: CedarAction,
  resourceType: ResourceType,
  idParam?: string
) => async (req: any, res: Response, next: NextFunction) => {
  try {
    const authorizationService = container.resolve('authorizationService');
    const pricingRepository = container.resolve('pricingRepository');
    const pricingCollectionRepository = container.resolve('pricingCollectionRepository');

    const userId = req.user.id;
    const organizationId = req.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication and organization context required' });
    }

    let resourceId = idParam ? req.params[idParam] : (req.params.id || organizationId);
    let collectionId = req.params.collectionId || req.body.collectionId;
    let groupId: string | undefined;
    let creatorId: string | undefined;

    // For group resource unassignment routes, resolve whether the caller owns the resource.
    // CedarMiddleware passes this as creatorId so AuthorizationService can set isResourceOwner
    // in GroupContext — enabling the "resource owner regardless of group role" Cedar policy.
    if (resourceType === 'Group') {
      if (action === 'manageGroupCollections' && req.params.pricingCollectionId) {
        const col = await pricingCollectionRepository.findById(req.params.pricingCollectionId);
        if (col) creatorId = col._ownerId?.toString();
      }
      if (action === 'manageGroupPricings' && req.params.pricingId) {
        const pricing = await pricingRepository.findById(req.params.pricingId);
        // pricing.owner is a username — map to userId only when it matches the caller
        if (pricing && pricing.owner === req.user.username) creatorId = userId;
      }
    }

    // When resource is PricingCollection and resourceId wasn't found in URL params,
    // fall back to collectionId from body (e.g. PUT /me/pricings sends collectionId in body)
    if (resourceType === 'PricingCollection' && !resourceId && collectionId) {
      resourceId = collectionId;
    }

    // Special handling for routes using names instead of IDs
    if (resourceType === 'PricingCollection' && req.params.collectionName) {
      const col = await pricingCollectionRepository.findByNameAndUserId(req.params.collectionName, req.params.userId || userId);
      if (col) {
        resourceId = col.id;
      }
    }

    if (resourceType === 'Pricing' && req.params.pricingName) {
      const owner = req.params.owner || req.user.username;
      // Always use raw lookup: the aggregated findByNameAndOwner omits _collectionId,
      // _organizationId, _groupId from its versions array, so it cannot be used to
      // determine whether a pricing is standalone or which collection it belongs to.
      const raw = await pricingRepository.findRawByNameAndOwner(req.params.pricingName, owner);
      if (raw) {
        resourceId = raw._id?.toString();
        collectionId = raw._collectionId?.toString();
        groupId = raw._groupId?.toString();
        // raw.owner is a username; isCreator in Cedar compares creatorId === userId (_id).
        // Map to userId when the logged-in user is the pricing owner.
        creatorId = raw.owner === req.user.username ? userId : undefined;

        // Standalone pricing (no collection): skip Cedar entirely for personal pricings.
        // Org/group pricings without a collection proceed to Cedar with isStandaloneOrgPricing context.
        if (!collectionId) {
          const isPersonal = !raw._organizationId && !raw._groupId;
          if (isPersonal) return next();
        }
      }
    }

    // For routes that identify a pricing by ObjectId (e.g. /pricings/:pricingId/configuration-space)
    // look up the pricing to get its collectionId so effectiveRole can be resolved.
    if (resourceType === 'Pricing' && req.params.pricingId && !req.params.pricingName) {
      const p = await pricingRepository.findById(req.params.pricingId);
      if (p) {
        collectionId = p._collectionId?.toString();

        // Standalone pricing: skip Cedar for personal, let org/group proceed with isStandaloneOrgPricing
        if (!collectionId) {
          const isPersonal = !p._organizationId && !p._groupId;
          if (isPersonal) return next();
        }
      }
    }

    const authRequest: AuthorizationRequest = {
      userId,
      organizationId,
      action,
      resource: { type: resourceType, id: resourceId },
      collectionId,
      groupId,
      creatorId
    };

    const decision = await authorizationService.authorize(authRequest);

    if (decision.allowed) {
      return next();
    }

    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'You do not have permission to perform this action.',
      reasons: decision.reasons,
      details: decision.errors
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
