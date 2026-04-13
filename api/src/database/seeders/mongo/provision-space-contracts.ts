import container from '../../../config/container';

export const provisionEnterpriseContractsForSeededOrgs = async () => {
  try {
    const organizationRepository = container.resolve('organizationRepository');
    const spaceService = container.resolve('spaceService');
    const orgs = await organizationRepository.findAll();

    await Promise.all(
      orgs.map((org: any) => spaceService.ensureEnterpriseContract(org.id, org.name))
    );

    return orgs.length;
  } catch (error) {
    console.error('Failed to provision ENTERPRISE SPACE contracts for seeded orgs:', error);
    return 0;
  }
};
