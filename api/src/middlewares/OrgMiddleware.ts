import { NextFunction } from 'express';
import container from '../config/container';

/**
 * Populates req.organizationId from the X-Organization-Id header.
 * - If header is present: validates the authenticated user is a member of that org.
 * - If header is absent: defaults to the user's personal organization.
 *
 * Must be applied AFTER isLoggedIn (requires req.user).
 */
const orgContext = async (req: any, res: any, next: NextFunction) => {
  const organizationService = container.resolve('organizationService');
  const organizationMembershipRepository = container.resolve('organizationMembershipRepository');

  const orgId = req.headers['x-organization-id'] as string | undefined;

  try {
    if (orgId) {
      const membership = await organizationMembershipRepository.findByUserAndOrganization(
        req.user.id,
        orgId
      );

      if (!membership) {
        return res.status(403).json({ error: 'User is not a member of this organization' });
      }

      req.organizationId = orgId;
    } else {
      const orgs = await organizationService.indexByUser(req.user.id);
      const personalOrg = orgs.find((o: any) => o.isPersonal);

      if (!personalOrg) {
        return res.status(403).json({ error: 'No personal organization found for user' });
      }

      req.organizationId = personalOrg.id;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export { orgContext };
