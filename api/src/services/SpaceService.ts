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
   * Retrieves the SPACE contract for the given organization.
   * Throws if the contract does not exist or SPACE is unreachable.
   */
  async getContract(organizationId: string): Promise<any> {
    return this.spaceClient.contracts.getContract(organizationId);
  }

  /**
   * Evaluates whether the organization's current plan allows the given feature.
   *
   * SPACE resolves the evaluation internally using the registered pricing YAML,
   * the organization's contracted plan, add-ons and current usage levels.
   *
   * @param organizationId  The organization whose contract is evaluated.
   * @param featureName     Feature name as defined in sphere-pricing.yaml (e.g. 'collectionManagement').
   * @param expectedConsumption  Optional — increment to check against usage-limited features
   *                             (e.g. pass 1 when about to create a new resource).
   * @returns Object with `eval: boolean` and optionally `used` and `limit`.
   */
  async evaluateFeature(
    organizationId: string,
    featureName: string,
    expectedConsumption?: number
  ): Promise<{ eval: boolean; used?: number; limit?: number }> {
    const featureId = `${SPACE_SERVICE_NAME}-${featureName}`;
    return this.spaceClient.features.evaluate(organizationId, featureId, expectedConsumption);
  }

  /**
   * Reverts the usage update produced by a previous evaluateFeature call.
   * Only effective within 2 minutes of the original evaluation.
   * Use this as a safety net when a request fails after evaluation.
   */
  async revertFeatureEvaluation(organizationId: string, featureName: string): Promise<void> {
    const featureId = `${SPACE_SERVICE_NAME}-${featureName}`;
    await this.spaceClient.features.revertEvaluation(organizationId, featureId);
  }

  /**
   * Updates the subscription plan and add-ons of an existing contract.
   * Use this when an organization upgrades or changes its plan.
   *
   * @param organizationId  The organization whose contract is updated.
   * @param plan            New plan name (e.g. 'PRO', 'ENTERPRISE').
   * @param addOns          Add-ons map: { addonName: quantity }. Defaults to empty.
   */
  async updateContract(
    organizationId: string,
    plan: string,
    addOns: Record<string, number> = {}
  ): Promise<void> {
    await this.spaceClient.contracts.updateContractSubscription(organizationId, {
      contractedServices: { [SPACE_SERVICE_NAME]: SPACE_SERVICE_VERSION },
      subscriptionPlans: { [SPACE_SERVICE_NAME]: plan },
      subscriptionAddOns: { [SPACE_SERVICE_NAME]: addOns },
    });
  }

  /**
   * Downgrades the organization's contract to FREE, effectively cancelling
   * the active paid plan while keeping the contract alive in SPACE.
   */
  async cancelContract(organizationId: string): Promise<void> {
    await this.updateContract(organizationId, FREE_PLAN);
  }

  /**
   * Permanently removes the organization's contract from SPACE.
   * Use this when an organization is deleted.
   *
   * A 404 response is treated as a no-op (contract already gone).
   */
  async deleteContract(organizationId: string): Promise<void> {
    const response = await fetch(`${SPACE_URL}api/v1/contracts/${organizationId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': SPACE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok || response.status === 404) {
      return;
    }

    const errorText = await response.text();
    throw new Error(`Failed to delete contract for organization ${organizationId}: ${response.status} ${errorText}`);
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
