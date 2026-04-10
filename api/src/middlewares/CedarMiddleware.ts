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
    let creatorId: string | undefined;

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
      const p = await pricingRepository.findByNameAndOwner(req.params.pricingName, req.params.owner || req.user.username);
      if (p && p.versions.length > 0) {
        resourceId = p.versions[0].id;
        collectionId = p.versions[0]._collectionId;
        creatorId = p.versions[0].ownerId;
      }
    }

    // For routes that identify a pricing by ObjectId (e.g. /pricings/:pricingId/configuration-space)
    // look up the pricing to get its collectionId so effectiveRole can be resolved.
    if (resourceType === 'Pricing' && req.params.pricingId && !req.params.pricingName) {
      const p = await pricingRepository.findById(req.params.pricingId);
      if (p) {
        collectionId = p._collectionId?.toString();
      }
    }

    const authRequest: AuthorizationRequest = {
      userId,
      organizationId,
      action,
      resource: { type: resourceType, id: resourceId },
      collectionId,
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
