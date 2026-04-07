import { useEffect } from 'react';
import { useSpaceClient } from 'space-react-client';
import { useOrganization } from '../../organization/hooks/useOrganization';

/**
 * Keeps the SPACE client synchronized with the currently active organization.
 *
 * Whenever the user switches organizations (or one is loaded after login),
 * this hook calls spaceClient.setUserId(org.id) so SPACE generates and stores
 * the pricing token for that organization's contract.
 *
 * The feature ID format used throughout the app is: sphere-<featureName>
 * e.g. "sphere-harveyAssistant", "sphere-bulkImport", "sphere-collectionAnalytics"
 *
 * Must be used inside both SpaceProvider and OrganizationContext.
 */
export function useSpaceSync() {
  const spaceClient = useSpaceClient();
  const { activeOrganization } = useOrganization();

  // Re-fetch the pricing token whenever the active organization changes
  useEffect(() => {
    if (!activeOrganization?.id) return;

    spaceClient.setUserId(activeOrganization.id).catch((err: unknown) => {
      console.error('[SPACE] Failed to load pricing token for organization:', err);
    });
  }, [activeOrganization?.id, spaceClient]);

  // Re-fetch the pricing token when the pricing plan changes (e.g. after upgrade)
  useEffect(() => {
    if (!activeOrganization?.id) return;

    const onPricingChange = () => {
      spaceClient.setUserId(activeOrganization.id).catch((err: unknown) => {
        console.error('[SPACE] Failed to refresh pricing token after plan change:', err);
      });
    };

    spaceClient.on('pricing_activated', onPricingChange);
    spaceClient.on('pricing_archived', onPricingChange);

    return () => {
      spaceClient.off('pricing_activated', onPricingChange);
      spaceClient.off('pricing_archived', onPricingChange);
    };
  }, [activeOrganization?.id, spaceClient]);
}
