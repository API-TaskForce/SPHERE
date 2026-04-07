import { NextFunction } from 'express';
import container from '../config/container';

/**
 * Gates a route on whether the active organization's subscription plan
 * allows the given feature.
 *
 * SPACE evaluates the feature internally using the registered pricing YAML,
 * the organization's contracted plan, its active add-ons, and its current
 * usage levels — no manual YAML loading needed here.
 *
 * Must be applied AFTER isLoggedIn + orgContext (requires req.organizationId).
 *
 * @param featureName  Feature name as defined in sphere-pricing.yaml
 *                     (e.g. 'collectionManagement', 'pricings').
 * @param expectedConsumption  Optional increment for usage-limited features.
 *                             Pass 1 on create operations so SPACE checks
 *                             whether adding one more unit is still within the limit.
 *
 * Usage:
 *   router.post('/collections',
 *     isLoggedIn, orgContext,
 *     checkSpacePlan('collectionManagement'),
 *     controller.create
 *   );
 *
 *   router.post('/collections/:id/pricings',
 *     isLoggedIn, orgContext,
 *     checkSpacePlan('pricings', 1),
 *     controller.addPricing
 *   );
 */
const checkSpacePlan = (featureName: string, expectedConsumption?: number) =>
  async (req: any, res: any, next: NextFunction) => {
    const organizationId: string = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization context' });
    }

    try {
      const spaceService = container.resolve('spaceService');
      const result = await spaceService.evaluateFeature(organizationId, featureName, expectedConsumption);

      if (!result.eval) {
        return res.status(403).json({
          error: 'PLAN_LIMIT_REACHED',
          message: 'Your current plan does not allow this action. Please upgrade to continue.',
          feature: featureName,
          used: result.used ?? null,
          limit: result.limit ?? null,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

/**
 * Gates a route on a user-scoped feature, always evaluated against the
 * user's personal organization regardless of the active org context.
 *
 * Use this for features tied to the individual user rather than to a
 * specific organization: harveyAssistant, communitySupport, standardSupport,
 * prioritySupport.
 *
 * Must be applied AFTER isLoggedIn (requires req.user). Does NOT require
 * orgContext — in fact, orgContext must NOT override the personal org here.
 */
const checkUserFeature = (featureName: string) =>
  async (req: any, res: any, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const organizationService = container.resolve('organizationService');
      const spaceService = container.resolve('spaceService');

      const orgs = await organizationService.indexByUser(req.user.id);
      const personalOrg = orgs.find((o: any) => o.isPersonal);

      if (!personalOrg) {
        return res.status(403).json({ error: 'No personal organization found for user' });
      }

      const result = await spaceService.evaluateFeature(personalOrg.id, featureName);

      if (!result.eval) {
        return res.status(403).json({
          error: 'PLAN_LIMIT_REACHED',
          message: 'Your current plan does not allow this action. Please upgrade to continue.',
          feature: featureName,
          used: result.used ?? null,
          limit: result.limit ?? null,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

export { checkSpacePlan, checkUserFeature };
