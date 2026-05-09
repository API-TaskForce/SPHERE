import { NextFunction } from 'express';
import container from '../config/container';

// ── SPACE revert tracking ─────────────────────────────────────────────────────
//
// When checkSpacePlan / checkUserFeature evaluates a usage-limited feature
// (expectedConsumption > 0), SPACE increments the usage counter immediately.
// If the downstream controller operation fails, that counter must be decremented.
//
// Both middlewares push a revert entry onto req.spaceReverts when they consume
// quota. Controllers that can fail after SPACE gating must call
// revertPendingSpaceEvals(req) inside their catch blocks.

export interface SpaceRevertEntry {
  orgId: string;
  featureName: string;
}

/**
 * Reverts all SPACE usage increments tracked on the current request.
 * Call in controller catch blocks when a create operation fails after gating.
 * Each revert is best-effort (errors are swallowed) and only effective within
 * 2 minutes of the original evaluation.
 */
export async function revertPendingSpaceEvals(req: any): Promise<void> {
  const reverts: SpaceRevertEntry[] = req.spaceReverts ?? [];
  if (reverts.length === 0) return;
  const spaceService = container.resolve('spaceService');
  await Promise.allSettled(
    reverts.map(({ orgId, featureName }) =>
      spaceService.revertFeatureEvaluation(orgId, featureName)
    )
  );
}

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
      let result = await spaceService.evaluateFeature(
        organizationId,
        featureName,
        expectedConsumption
      );

      // In local development, seeded organizations are expected to have unrestricted
      // access. If a stale FREE/PRO contract is still present in SPACE, repair it
      // once on-demand and re-evaluate the feature before denying the request.
      if (!result.eval && process.env.ENVIRONMENT === 'development') {
        try {
          const organizationService = container.resolve('organizationService');
          const organization = await organizationService.show(organizationId);
          await spaceService.ensureEnterpriseContract(organizationId, organization.name);
          result = await spaceService.evaluateFeature(
            organizationId,
            featureName,
            expectedConsumption
          );
        } catch {
          // If the repair attempt fails, fall through and return the original denial shape.
        }
      }

      if (!result.eval) {
        return res.status(403).json({
          error: 'PLAN_LIMIT_REACHED',
          message: 'Your current plan does not allow this action. Please upgrade to continue.',
          feature: featureName,
          used: result.used ?? null,
          limit: result.limit ?? null,
        });
      }

      // Track this evaluation so the controller can revert it if the operation fails.
      if (expectedConsumption !== undefined) {
        if (!req.spaceReverts) req.spaceReverts = [];
        req.spaceReverts.push({ orgId: organizationId, featureName });
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
 * specific organization — most notably pricing creation, where the
 * pricingManagement gate and the maxPricings usage limit must be checked
 * against the owner's personal org, not the currently active org.
 *
 * @param featureName        Feature name as defined in sphere-pricing.yaml.
 * @param expectedConsumption  Optional increment for usage-limited features.
 *                             Pass 1 on create operations (e.g. 'pricings', 1)
 *                             so SPACE checks whether adding one more unit is
 *                             still within the personal-org limit.
 *
 * Must be applied AFTER isLoggedIn (requires req.user). Does NOT require
 * orgContext — in fact, orgContext must NOT override the personal org here.
 */
const checkUserFeature = (featureName: string, expectedConsumption?: number) =>
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

      const result = await spaceService.evaluateFeature(personalOrg.id, featureName, expectedConsumption);

      if (!result.eval) {
        return res.status(403).json({
          error: 'PLAN_LIMIT_REACHED',
          message: 'Your current plan does not allow this action. Please upgrade to continue.',
          feature: featureName,
          used: result.used ?? null,
          limit: result.limit ?? null,
        });
      }

      // Track this evaluation so the controller can revert it if the operation fails.
      if (expectedConsumption !== undefined) {
        if (!req.spaceReverts) req.spaceReverts = [];
        req.spaceReverts.push({ orgId: personalOrg.id, featureName });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

export { checkSpacePlan, checkUserFeature };
