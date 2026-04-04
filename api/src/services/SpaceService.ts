import { connect } from 'space-node-client';
import process from 'node:process';

const SPACE_URL = process.env.SPACE_URL || 'http://localhost:5403/';
const SPACE_API_KEY = process.env.SPACE_API_KEY || '';
const SPACE_SERVICE_NAME = process.env.SPACE_SERVICE_NAME || 'sphere';
const SPACE_SERVICE_VERSION = process.env.SPACE_SERVICE_VERSION || '2.0';
const FREE_PLAN = 'FREE';

class SpaceService {

  private spaceClient: ReturnType<typeof connect>;

  constructor() {
    this.spaceClient = connect({
      url: SPACE_URL,
      apiKey: SPACE_API_KEY,
    });
  }

  /**
   * Ensures a FREE contract exists in SPACE for the given organization.
   * If a contract already exists, it does nothing.
   * If no contract exists (404), it creates a new FREE one.
   * Errors are swallowed to avoid blocking organization creation.
   */
  async ensureFreeContract(organizationId: string, organizationName: string): Promise<void> {
    try {
      await this.spaceClient.contracts.getContract(organizationId);
      // Contract already exists — nothing to do
    } catch (error: any) {
      const isNotFound =
        error?.message?.includes('not found') ||
        error?.response?.status === 404 ||
        error?.status === 404;

      if (!isNotFound) {
        console.error(`[SpaceService] Error checking contract for organization ${organizationId}:`, error?.message);
        return;
      }

      // No contract found — create a FREE one
      try {
        await this.spaceClient.contracts.addContract({
          userContact: { userId: organizationId, username: organizationName },
          billingPeriod: { autoRenew: true, renewalDays: 30 },
          contractedServices: { [SPACE_SERVICE_NAME]: SPACE_SERVICE_VERSION },
          subscriptionPlans: { [SPACE_SERVICE_NAME]: FREE_PLAN },
          subscriptionAddOns: {},
        });
      } catch (createError: any) {
        console.error(`[SpaceService] Error creating FREE contract for organization ${organizationId}:`, createError?.message);
      }
    }
  }
}

export default SpaceService;
